#!/usr/bin/env python3
"""Scoped real Chromium -> loopback synthetic RPC -> disposable PostgreSQL CAS.

Validates versioned holiday eligibility read and 4-argument write with actual
Workmoa QA UI, two separate administrators, stale conflict and refresh.
NOT original SQL, PostgREST, Auth, RLS, or production read/write evidence.
"""
import importlib.util
import json
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location("qa_holiday_admin",HERE/"browser-two-admin-account-cas.py")
qa=importlib.util.module_from_spec(sp)
sys.modules[sp.name]=qa
sp.loader.exec_module(qa)
br=qa.br
PASS=[]
READ_REQUESTS=[]
WRITE_REQUESTS=[]
UNSAFE=[]
LOCK=threading.Lock()

def check(condition,label):
    if not condition: raise AssertionError(label)
    PASS.append(label)
    print("HOLIDAY_CAS_BROWSER_PASS",len(PASS),label,flush=True)

def state():
    return br.value("""SELECT json_build_object(
      'enabled', holiday_work_enabled, 'revision',eligibility_revision,
      'audit',(SELECT count(*) FROM public.qa_holiday_toggle_audit))
      FROM public.qa_holiday_toggle_state WHERE employee_id=2""")

def roster():
    rows=br.value("""SELECT json_agg(json_build_object(
      'employee_id',employee_id,
      'holiday_work_enabled',holiday_work_enabled,
      'eligibility_revision',eligibility_revision) ORDER BY employee_id)
      FROM public.qa_holiday_toggle_state""")
    return rows

class HolidayCasSyntheticApi(qa.TwoAdminFakeApi):
    def do_POST(self):
        name=urlsplit(self.path).path
        if name not in (
            "/rest/v1/rpc/list_holiday_work_eligibility_v2",
            "/rest/v1/rpc/admin_set_holiday_work_enabled_v2"):
            return super().do_POST()
        if (self.headers.get("Origin")!="http://127.0.0.1:54330" or
            self.headers.get("apikey")!=br.KEY or
            self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_LOCAL_AUTH_ONLY"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or int(length)>4096:
            return self.reply(413,{"message":"QA_BAD_REQUEST_LENGTH"})
        try: data=json.loads(self.rfile.read(int(length)))
        except Exception: return self.reply(400,{"message":"QA_NOT_JSON"})
        if not isinstance(data,dict):return self.reply(400,{"message":"QA_BAD_JSON_OBJECT"})
        token=data.get("p_token")
        if token not in (qa.A,qa.B):
            return self.reply(403,{"message":"QA_INVALID_SESSION"})
        if name.endswith("list_holiday_work_eligibility_v2"):
            if set(data)!={"p_token"}:return self.reply(400,{"message":"QA_WRONG_READ_ARGS"})
            with LOCK: READ_REQUESTS.append({"token":token})
            return self.reply(200,roster())
        required={"p_token","p_employee_id","p_enabled","p_expected_revision"}
        if set(data)!=required:
            with LOCK:UNSAFE.append({"reason":"wrong_set", "args":list(data)})
            return self.reply(404,{"code":"PGRST202","message":"FOUR_ARGUMENT_CAS_REQUIRED"})
        if (data["p_employee_id"]!=2 or type(data["p_enabled"]) is not bool or
            type(data["p_expected_revision"]) is not int or data["p_expected_revision"]<0):
            with LOCK:UNSAFE.append({"reason":"wrong_data"})
            return self.reply(400,{"message":"QA_BAD_CAS_PAYLOAD"})
        with LOCK:WRITE_REQUESTS.append(dict(data))
        try:
            result=br.value("""SELECT public.qa_holiday_toggle_cas(
              %s::uuid,%s::smallint,%s::boolean,%s::bigint
            )""",(token,2,data["p_enabled"],data["p_expected_revision"]))
            return self.reply(200,result)
        except br.psycopg.Error as e:
            msg=str(e).splitlines()[0]
            if msg=="STALE_HOLIDAY_ELIGIBILITY":
                return self.reply(409,{"code":"PT409","message":msg})
            print("QA_HOLIDAY_SQL_UNEXPECTED_"+type(e).__name__,flush=True)
            return self.reply(500,{"message":"QA_LOCAL_POSTGRES_ERROR"})

def ready_for_admin(page):
    page.evaluate("openEmployeeManager()")
    page.locator("#employeeManageBackdrop.open").wait_for(timeout=12000)
    item=page.locator('#currentEmployeeList input[data-holiday-work-enabled="2"]')
    item.wait_for(timeout=12000)
    return item

def wait_cond(page,expression,timeout=12):
    limit=time.monotonic()+timeout
    while time.monotonic()<limit:
        if page.evaluate(expression):return True
        page.wait_for_timeout(100)
    return bool(page.evaluate(expression))

def run():
    br.require_env()
    br.reset()
    check(state()=={"enabled":False,"revision":0,"audit":0},
          "synthetic worker starts disabled revision zero no audit")
    srv=br.ThreadingHTTPServer((br.HOST,br.PORT),HolidayCasSyntheticApi)
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    directory=br.build()
    site=br.subprocess.Popen(
        ["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),directory],
        cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                external=[]
                ca=browser.new_context(locale="ko-KR",service_workers="block")
                cb=browser.new_context(locale="ko-KR",service_workers="block")
                a,ea=qa.setup(ca,external)
                b,eb=qa.setup(cb,external)
                qa.login(a,"가상관리자A")
                qa.login(b,"가상관리자B")
                check(a.evaluate("state.sessionToken")!=b.evaluate("state.sessionToken"),
                      "two browsers have different synthetic manager tokens")
                check(a.evaluate("state.holidayWorkEligibilityReady===true") and
                      b.evaluate("state.holidayWorkEligibilityReady===true"),
                      "both managers have authoritative three-column eligibility data")
                check(a.evaluate("state.employees.find(e=>e.id===2).holiday_work_eligibility_revision") == 0
                      and b.evaluate("state.employees.find(e=>e.id===2).holiday_work_eligibility_revision")==0,
                      "both browser snapshots use unchanged revision zero")
                a_input=ready_for_admin(a)
                b_input=ready_for_admin(b)
                check(a_input.is_enabled() and b_input.is_enabled(),
                      "real administrative checkbox is enabled in both browser contexts")
                check(not a_input.is_checked() and not b_input.is_checked(),
                      "both actual checkboxes show initial disabled flag")
                a_input.check(timeout=12000)
                check(wait_cond(a,"state.employees.find(e=>e.id===2).holiday_work_eligibility_revision===1"),
                      "manager A uses visible checkbox and reads back new revision one")
                check(state()=={"enabled":True,"revision":1,"audit":1},
                      "A commits exactly one atomic change plus one audit in throwaway PG")
                check(len(WRITE_REQUESTS)==1 and
                      WRITE_REQUESTS[0]["p_expected_revision"]==0 and
                      WRITE_REQUESTS[0]["p_enabled"] is True and
                      WRITE_REQUESTS[0]["p_token"]==qa.A,
                      "A real input mutation sends expected revision zero and 4-arg contract")
                # The second page must not refresh until B submits its stale revision.
                check(b.evaluate("state.employees.find(e=>e.id===2).holiday_work_eligibility_revision")==0,
                      "manager B still owns old revision zero in independent browser")
                b_input.check(timeout=12000)
                check(wait_cond(b,"state.employees.find(e=>e.id===2).holiday_work_eligibility_revision===1"),
                      "B gets stale CAS conflict and refreshes authoritative revision")
                check(state()=={"enabled":True,"revision":1,"audit":1},
                      "B stale save does not overwrite worker or create audit")
                check(len(WRITE_REQUESTS)==2 and
                      WRITE_REQUESTS[1]["p_expected_revision"]==0 and
                      WRITE_REQUESTS[1]["p_token"]==qa.B,
                      "B sent its old revision once, no automatic write retry")
                check(b.evaluate("state.holidayWorkEligibilityReady===true"),
                      "failed B write recovered authoritative read without disabling all staff")
                check(b.locator('#currentEmployeeList input[data-holiday-work-enabled="2"]').is_checked(),
                      "B checkbox was rerendered to A latest enabled state")
                b.locator('#currentEmployeeList input[data-holiday-work-enabled="2"]').uncheck(timeout=12000)
                check(wait_cond(b,"state.employees.find(e=>e.id===2).holiday_work_eligibility_revision===2"),
                      "B fresh checkbox save refreshes new revision two")
                check(state()=={"enabled":False,"revision":2,"audit":2},
                      "B fresh save commits disabled revision two exactly once")
                check(len(WRITE_REQUESTS)==3 and
                      [x["p_expected_revision"] for x in WRITE_REQUESTS]==[0,0,1],
                      "all 3 UI writes send 0 / stale 0 / refreshed 1 revisions")
                check([x["p_token"] for x in WRITE_REQUESTS]==[qa.A,qa.B,qa.B],
                      "actual synthetic manager token ownership retained across conflict")
                # Synthetic 3-arg legacy request with a valid admin cannot alter row.
                no_legacy=a.evaluate("""async () => {
                  try {
                    await rpc('admin_set_holiday_work_enabled_v2',
                      {p_token:state.sessionToken,p_employee_id:2,p_enabled:true});
                    return false;
                  } catch(e) { return String(e?.message||'').includes('FOUR_ARGUMENT_CAS_REQUIRED'); }
                }""")
                check(no_legacy and len(UNSAFE)==1,
                      "3-argument legacy mutation is rejected before DB CAS")
                check(state()=={"enabled":False,"revision":2,"audit":2},
                      "legacy request fails with zero additional writes")
                check(len(READ_REQUESTS)>=5,
                      "actual Chromium initiated repeated revisioned server reads")
                check(not any(".supabase.co" in u for u in external),
                      "both browsers prevented hosted Supabase requests")
                check(not ea and not eb,
                      "both Chromium pages had zero uncaught JavaScript errors")
                print("HOLIDAY_CAS_SCOPED_PASS "+str(len(PASS))+
                      " checks; original QA UI, synthetic REST gateway/SQL/RLS not original E2E",
                      flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        srv.shutdown();srv.server_close()

if __name__=="__main__":
    run()

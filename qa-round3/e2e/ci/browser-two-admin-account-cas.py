#!/usr/bin/env python3
"""Real Chromium admin account UI (two isolated browser contexts), disposable PG CAS.
Synthetic logins and miniature artificial SQL; NOT original Supabase/PostgREST/RLS E2E.
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
spec=importlib.util.spec_from_file_location("qa_form_admin",HERE/"browser-attendance-form.py")
fixture=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=fixture
spec.loader.exec_module(fixture)
br=fixture.br
A=br.ADMIN
B="33333333-3333-4333-8333-333333333333"
ADMINS={"가상관리자A":(A,1),"가상관리자B":(B,3)}
EVENTS=[]; MUTATIONS=[]; LOCK=threading.Lock()
ROSTER=[
 dict(id=i,display_name=name,login_name=name,category="일근(사무)",group_code="DAY",
      is_admin=admin,sort_order=i,active_from="2026-01-01",active_to=None,
      company_hire_date=None,employee_origin="existing",personnel_account_status="active")
 for i,name,admin in [(1,"가상관리자A",True),(2,"가상직원",False),(3,"가상관리자B",True)]
]
ASSIGNMENTS=[
 dict(action_id=i,batch_id=1,employee_id=i,sort_order=i,correction_of=None,
    effective_date="2026-01-01",batch_kind="baseline",batch_status="active",
    display_name=name,placement_code="DAY_OFFICE",employment_status="working",
    account_status="active",entry_type="existing",is_new_employee=False,
    batch_note="합성 초기배치",created_by_name="가상관리자A",
    batch_created_at="2026-01-01T00:00:00Z",
    company_hire_date=None,batch_revision=0)
 for i,name in [(1,"가상관리자A"),(2,"가상직원"),(3,"가상관리자B")]
]
def check(ok,label):
    if not ok: raise AssertionError(label)
    print("TWO_ADMIN_PASS "+label,flush=True)

def dbstate():
    return br.value("""SELECT json_build_object(
        'revision',revision,'status',target_status,
        'events',(SELECT count(*) FROM public.qa_two_admin_account_events))
      FROM public.qa_two_admin_shared_revision WHERE id=1""")

class TwoAdminFakeApi(fixture.AttendanceBridge):
    def do_POST(self):
        path=urlsplit(self.path).path
        prefix="/rest/v1/rpc/"
        if not path.startswith(prefix) or "/" in path[len(prefix):]:
            return self.reply(404,{"message":"QA_LOCAL_RPC_ONLY"})
        name=path[len(prefix):]
        if (self.headers.get("Origin")!="http://127.0.0.1:54330" or
            self.headers.get("apikey")!=br.KEY or
            self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_LOCAL_AUTH_HEADERS_ONLY"})
        rawlen=self.headers.get("Content-Length","")
        if not rawlen.isdecimal() or int(rawlen)>8192:
            return self.reply(413,{"message":"QA_REQUEST_TOO_LARGE"})
        try: data=json.loads(self.rfile.read(int(rawlen)) or b"{}")
        except Exception: return self.reply(400,{"message":"QA_BAD_JSON"})
        if not isinstance(data,dict):
            return self.reply(400,{"message":"QA_BAD_PAYLOAD"})
        if name=="login_employee_personnel_v1":
            name_value=data.get("p_name")
            if set(data)!={"p_name","p_pin","p_admin_pin"} or name_value not in ADMINS or data["p_pin"]!="1234":
                return self.reply(200,[{"display_name":"__INVALID_LOGIN__","is_admin":False}])
            if data["p_admin_pin"]!="5678":
                return self.reply(200,[{"display_name":"__ADMIN_PIN_INVALID__","is_admin":False}])
            token,employee_id=ADMINS[name_value]
            return self.reply(200,[{
                "token":token,"employee_id":employee_id,"display_name":name_value,
                "category":"일근(사무)","group_code":"DAY","is_admin":True,
                "expires_at":"2035-01-01T00:00:00Z"
            }])
        token=data.get("p_token")
        if token not in (A,B):
            return self.reply(403,{"message":"QA_SYNTHETIC_ADMIN_ONLY"})
        if name=="initial_pin_status_v1":
            return self.reply(200,False)
        if name=="get_personnel_account_status":
            return self.reply(200,[{
                "is_read_only":False,"is_disabled":False,
                "employment_status":"working","account_status":"active"
            }])
        if name=="get_personnel_restore_revision_v1":
            revision=dbstate()["revision"]
            return self.reply(200,format(revision,"032x"))
        if name in ("list_employees_personnel_v2","list_employees_personnel_v1"):
            return self.reply(200,ROSTER)
        if name=="list_personnel_assignments":
            return self.reply(200,ASSIGNMENTS)
        if name=="list_personnel_account_events":
            # Only synthetic event metadata; no personal data.
            rows=br.value("""SELECT COALESCE(json_agg(json_build_object(
              'id',id,'employee_id',employee_id,'account_status',account_status,
              'effective_date',effective_date,'note',note,
              'created_at',to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')
            ) ORDER BY id),'[]'::json) FROM public.qa_two_admin_account_events""")
            return self.reply(200,rows)
        if name=="list_personnel_snapshots":
            return self.reply(200,[])
        if name=="list_holiday_work_eligibility_v2":
            return self.reply(200,[{"employee_id":i,"holiday_work_enabled":False,
                "eligibility_revision":0} for i in (1,2,3)])
        if name=="list_holiday_work_eligibility":
            return self.reply(200,[{"employee_id":i,"holiday_work_enabled":False} for i in (1,2,3)])
        if name=="list_attendance_with_annual_leave":
            return self.reply(200,[])
        if name=="admin_set_employee_account_status_v3":
            required={"p_token","p_employee_id","p_account_status","p_effective_date",
                      "p_note","p_expected","p_expected_revision"}
            if set(data)!=required or data["p_employee_id"]!=2 or not isinstance(data["p_expected"],dict):
                return self.reply(400,{"message":"QA_BAD_ADMIN_CAS_ARGS"})
            with LOCK:
                MUTATIONS.append({"actor":token,"expected":data["p_expected_revision"],
                                  "snapshot":data["p_expected"],"status":data["p_account_status"]})
            try:
                success=br.value("""SELECT public.qa_two_admin_change_account(
                   %s::uuid,%s::smallint,%s::text,%s::date,%s::text,%s::jsonb,%s::text
                )""",(token,2,data["p_account_status"],data["p_effective_date"],
                      data["p_note"],br.Jsonb(data["p_expected"]),data["p_expected_revision"]))
                return self.reply(200,success)
            except br.psycopg.Error as e:
                err=str(e).splitlines()[0]
                if err in ("STALE_PERSONNEL_RESTORE_REVISION","STALE_PERSONNEL_ACCOUNT"):
                    return self.reply(409,{"message":err,"code":"PT409"})
                print("TWO_ADMIN_SQL_UNEXPECTED_ERROR_TYPE="+type(e).__name__,flush=True)
                return self.reply(500,{"message":"QA_SQL_ERROR"})
        if name in fixture.READS:
            return self.reply(200,fixture.READS[name])
        # All admin reset/restore/backup and unspecified writes intentionally denied.
        return self.reply(404,{"message":"QA_UNIMPLEMENTED_DENY"})

def setup(context,external):
    page=context.new_page()
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)[:250]))
    page.on("dialog",lambda d:d.accept())
    def gate(route):
        u=urlsplit(route.request.url)
        if u.scheme=="http" and u.hostname==br.HOST and u.port in (br.PORT,br.WEB):
            return route.continue_()
        external.append(route.request.url)
        return route.abort()
    page.route("**/*",gate)
    page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
    return page,errors

def login(page,admin):
    page.locator("#loginBtn").wait_for(state="visible",timeout=15000)
    page.locator("#loginName").fill(admin)
    page.locator("#loginPin").fill("1234")
    page.locator("#loginBtn").click()
    page.locator("#adminPinField:not(.hidden)").wait_for(timeout=12000)
    page.locator("#loginAdminPin").fill("5678")
    page.locator("#loginBtn").click()
    page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
    guide=page.locator("#usageGuideBackdrop.open")
    try:
        guide.wait_for(state="visible",timeout=3500)
        page.locator("#usageGuideConfirmBtn").click()
        guide.wait_for(state="hidden",timeout=5000)
    except Exception:
        if guide.is_visible():raise
    page.wait_for_function("state.personnelBackendReady===true&&state.me?.is_admin&&activeAdminMode()",timeout=12000)
    check(page.evaluate("activeAdminMode() && state.employees.length===3"),admin+" real login button + secondary PIN unlock + roster loaded")

def open_dirty(page,status,note):
    page.evaluate("openEmployeeAccount(2)")
    page.locator("#employeeAccountBackdrop.open").wait_for(timeout=10000)
    page.locator("#employeeAccountStatus").select_option(status)
    page.locator("#employeeAccountNote").fill(note)
    check(page.evaluate("employeeAccountDirty() && personnelMutationReady()"),
          "admin real account editor kept independent unsaved dirty draft")
    captured=page.evaluate("""async () => await personnelCandidateAccountRevisionAtOpen""")
    check(captured.get("value") is not None and len(captured["value"])==32,
          "admin account-open captured a valid 32-char shared revision")
    return captured["value"]

def click_save(page):
    page.locator("#confirmEmployeeAccountBtn").click(timeout=12000)

def run():
    br.require_env()
    br.reset()
    check(dbstate()=={"revision":0,"status":"active","events":0},
          "isolated PostgreSQL starts at synthetic revision 0")
    server=br.ThreadingHTTPServer((br.HOST,br.PORT),TwoAdminFakeApi)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
         cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                # Different browser contexts model distinct admins, not two tabs sharing a token.
                ctxa=browser.new_context(locale="ko-KR",service_workers="block")
                ctxb=browser.new_context(locale="ko-KR",service_workers="block")
                blocked=[]
                a,ae=setup(ctxa,blocked);b,be=setup(ctxb,blocked)
                login(a,"가상관리자A");login(b,"가상관리자B")
                check(a.evaluate("state.sessionToken")!=b.evaluate("state.sessionToken"),
                      "two administrators have separate synthetic session tokens")
                check(a.evaluate("state.me.employee_id") ==1 and b.evaluate("state.me.employee_id")==3,
                      "browser contexts have distinct manager identities")
                rev_a=open_dirty(a,"readonly","QA-A-first")
                rev_b=open_dirty(b,"disabled","QA-B-stale")
                check(rev_a==rev_b==("0"*32),"both open against identical original revision")
                click_save(a)
                a.locator("#employeeAccountBackdrop").wait_for(state="hidden",timeout=12000)
                check(dbstate()=={"revision":1,"status":"readonly","events":1},
                      "first admin UI SAVE atomically persists version 1 in disposable PG")
                click_save(b)
                b.locator("#employeeAccountError").get_by_text(
                   "이 직원의 계정/인사 상태가 다른 관리자 또는 창에서 변경되었습니다.",exact=False
                ).wait_for(timeout=12000)
                check(dbstate()=={"revision":1,"status":"readonly","events":1},
                      "second admin stale revision rejected without phantom write")
                check(b.evaluate("employeeAccountDirty()") and
                      b.locator("#employeeAccountNote").input_value()=="QA-B-stale",
                      "stale conflict preserves second admin unsaved draft")
                check(len(MUTATIONS)==2 and MUTATIONS[0]["expected"]==rev_a and
                      MUTATIONS[1]["expected"]==rev_b,
                      "both real save clicks sent same original CAS, only first committed")
                b.evaluate("closeBackdrop('employeeAccountBackdrop',true)")
                b.evaluate("loadEmployees()")
                b.wait_for_function("state.personnelBackendReady===true",timeout=10000)
                rev_b2=open_dirty(b,"disabled","QA-B-after-resync")
                check(rev_b2==format(1,"032x"),"second admin fresh editor holds revision 1")
                click_save(b)
                b.locator("#employeeAccountBackdrop").wait_for(state="hidden",timeout=12000)
                check(dbstate()=={"revision":2,"status":"disabled","events":2},
                      "fresh admin B submit succeeds only after new revision read")
                check(len(MUTATIONS)==3 and MUTATIONS[-1]["expected"]==rev_b2,
                      "second administrator never reused stale revision on new successful write")
                check(not any(".supabase.co" in url for url in blocked),
                      "both Chromium contexts block all hosted Supabase network calls")
                check(not ae and not be,
                      "no JavaScript uncaught browser errors in both managers")
                print("TWO_ADMIN_CAS_SCOPED_PASS 21 scoped assertions; artificial PG + fake login, NOT production E2E",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        server.shutdown();server.server_close()

if __name__=="__main__":
    run()

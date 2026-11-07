#!/usr/bin/env python3
"""QA-only real browser overtime MONTH LIST completion test with disposable PG.

Adds the synthetic save_my_overtime_entry_v2 RPC endpoint only inside this
QA fixture; it does not claim to reproduce the original production SQL.
No actual employee/auth/security-data and no external network access.
"""
import importlib.util
import json
import sys
import threading
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parent
NAME="workmoa_qa_list_completion_support"
spec=importlib.util.spec_from_file_location(NAME,HERE/"browser-overtime-save-integration.py")
support=importlib.util.module_from_spec(spec)
sys.modules[NAME]=support
spec.loader.exec_module(support)
br=support.br
lab=support.lab
ENTRY_HITS=[]
RPC_PATH="/rest/v1/rpc/save_my_overtime_entry_v2"

class SyntheticCompletionBridge(lab.ActionBridge):
    def do_POST(self):
        if urlsplit(self.path).path!=RPC_PATH:
            return super().do_POST()
        if (self.headers.get("Origin")!="http://127.0.0.1:54330"
            or self.headers.get("apikey")!=br.KEY
            or self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_SYNTHETIC_AUTH_REQUIRED"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or not 0<int(length)<=4096:
            return self.reply(413,{"message":"QA_INVALID_BODY"})
        try:
            data=json.loads(self.rfile.read(int(length)))
        except Exception:
            return self.reply(400,{"message":"QA_INVALID_JSON"})
        expected_keys={"p_token","p_work_date","p_slot","p_minutes","p_completed","p_expected"}
        if (not isinstance(data,dict) or set(data)!=expected_keys
            or data.get("p_token")!=br.WORKER
            or data.get("p_work_date")!=lab.OT_DATE
            or data.get("p_slot")!="early"
            or type(data.get("p_minutes")) is not int
            or data.get("p_minutes")!=10
            or type(data.get("p_completed")) is not bool
            or not isinstance(data.get("p_expected"),dict)):
            return self.reply(403,{"message":"QA_ONLY_ONE_SYNTHETIC_ROW_ALLOWED"})
        expected=data["p_expected"]
        if set(expected)!={"id","employeeId","date","slot","minutes","completed","updatedAt"}:
            return self.reply(400,{"message":"QA_BAD_EXPECTED_SHAPE"})
        try:
            if (expected["employeeId"]!=2 or expected["date"]!=lab.OT_DATE
                or expected["slot"]!="early" or expected["minutes"]!=10
                or type(expected["completed"]) is not bool
                or type(expected["id"]) is not int
                or not isinstance(expected["updatedAt"],str)):
                return self.reply(403,{"message":"QA_EXPECTED_ROW_SCOPE_DENIED"})
            stamp=datetime.fromisoformat(expected["updatedAt"].replace("Z","+00:00"))
        except (ValueError,TypeError,KeyError):
            return self.reply(400,{"message":"QA_EXPECTED_TIMESTAMP_INVALID"})
        try:
            with br.connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("""SELECT id, minutes, completed, updated_at
                      FROM public.qa_browser_overtime WHERE employee_id=2
                      AND work_date=%s::date AND slot='early' FOR UPDATE""",(lab.OT_DATE,))
                    row=cur.fetchone()
                    if (not row or row[0]!=expected["id"] or row[1]!=10
                        or row[2]!=expected["completed"] or row[3]!=stamp):
                        return self.reply(409,{"code":"P0001","message":"STALE_OVERTIME_ENTRY"})
                    cur.execute("""UPDATE public.qa_browser_overtime SET completed=%s,
                      updated_at=GREATEST(clock_timestamp(),updated_at + INTERVAL '1 microsecond')
                      WHERE id=%s AND employee_id=2 AND work_date=%s::date
                      RETURNING id""",(data["p_completed"],row[0],lab.OT_DATE))
                    changed=cur.fetchone()[0]
            br.HITS.append("save_my_overtime_entry_v2")
            ENTRY_HITS.append({"completed":data["p_completed"],"id":changed})
            return self.reply(200,changed)
        except br.psycopg.Error as err:
            print("QA_ONLY_LIST_COMPLETION_DB_ERROR_TYPE="+type(err).__name__,flush=True)
            return self.reply(400,{"message":"QA_FAKE_DATABASE_REJECTED"})

def check(ok,desc):
    if not ok:
        raise AssertionError(desc)
    print("PASS OVERTIME_LIST_COMPLETION: "+desc,flush=True)

def main():
    support.integration_guard()
    br.reset()
    with br.connect() as conn:
        conn.execute("TRUNCATE public.qa_browser_fingerprint, public.qa_browser_overtime RESTART IDENTITY")
        conn.execute("""INSERT INTO public.qa_browser_overtime
          (employee_id,work_date,slot,minutes,completed)
          VALUES (2,%s::date,'early',10,false)""",(lab.OT_DATE,))
    check(br.value("""SELECT count(*) FROM public.qa_browser_overtime
      WHERE employee_id=2 AND work_date=%s::date""",(lab.OT_DATE,))==1,
      "one synthetic ten-minute uncompleted row seeded")
    br.HITS.clear()
    server=br.ThreadingHTTPServer((br.HOST,br.PORT),SyntheticCompletionBridge)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(
        ["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
        cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with support.runner_chromium() as playwright:
            browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page()
                external=[]
                js_errors=[]
                page.on("pageerror",lambda e:js_errors.append(str(e)[:180]))
                page.on("dialog",lambda dialog:dialog.accept())
                def deny_external(route):
                    u=urlsplit(route.request.url)
                    if u.scheme in ("http","ws") and u.hostname==br.HOST and u.port in (br.PORT,br.WEB):
                        return route.continue_()
                    external.append(route.request.url)
                    return route.abort()
                page.route("**/*",deny_external)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=6000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=6000)
                check(page.evaluate("state.me?.employee_id===2 && state.personnelBackendReady===true"),
                      "fake employee login and personnel readiness")
                lab.open_date(page,lab.OT_DATE,2027,4)
                page.get_by_role("button",name="날짜 상세 닫기").click()
                page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=6000)
                page.locator("#overtimeSummaryMain").click()
                page.locator("#overtimeListBackdrop.open").wait_for(timeout=12000)
                page.wait_for_function("""()=>overtimeListBackendReady===true
                    && !state.refreshing && !refreshPendingOwner
                    && document.querySelectorAll('#overtimeListBody [data-overtime-list-check]').length===1
                    && !document.querySelector('#overtimeListBody [data-overtime-list-check]').disabled""",
                    timeout=22000)
                field=page.locator("#overtimeListBody input[data-overtime-list-check]")
                check(field.count()==1 and not field.is_checked(),
                      "actual monthly list displays one unchecked, editable row")
                check(page.locator("#overtimeListPlan").text_content().strip()=="10분"
                      and page.locator("#overtimeListDone").text_content().strip()=="0분",
                      "initial monthly list plan/done totals correct")
                with page.expect_response(lambda x:urlsplit(x.url).path==RPC_PATH,timeout=16000) as response:
                    field.check()
                check(response.value.status==200,"monthly list checkbox reaches synthetic entry RPC HTTP 200")
                page.wait_for_function("""()=>overtimeListPendingIds.size===0
                    && overtimeListBackendReady===true && !state.refreshing
                    && overtimeListRows.length===1 && overtimeListRows[0].completed===true
                    && document.querySelector('#overtimeListBody input[data-overtime-list-check]')?.checked===true""",
                    timeout=22000)
                check(br.value("""SELECT completed FROM public.qa_browser_overtime
                    WHERE employee_id=2 AND work_date=%s::date AND slot='early'""",(lab.OT_DATE,)) is True,
                    "list completion persisted as true in real disposable PostgreSQL")
                check(page.locator("#overtimeListPlan").text_content().strip()=="0분"
                      and page.locator("#overtimeListDone").text_content().strip()=="10분",
                      "list shows plan 0 and completed 10 without double counting")
                check(len(ENTRY_HITS)==1 and ENTRY_HITS[0]["completed"] is True,
                      "completed action made exactly one intended entry mutation")
                page.wait_for_function("""()=>overtimeListBackendReady===true
                  && !document.querySelector('#overtimeListBody input[data-overtime-list-check]').disabled""",
                  timeout=12000)
                with page.expect_response(lambda x:urlsplit(x.url).path==RPC_PATH,timeout=16000) as response:
                    page.locator("#overtimeListBody input[data-overtime-list-check]").uncheck()
                check(response.value.status==200,"uncheck sends second synthetic RPC HTTP 200")
                page.wait_for_function("""()=>overtimeListPendingIds.size===0
                    && overtimeListBackendReady===true
                    && overtimeListRows.length===1 && overtimeListRows[0].completed===false
                    && document.querySelector('#overtimeListBody input[data-overtime-list-check]')?.checked===false""",
                    timeout=22000)
                check(br.value("""SELECT completed FROM public.qa_browser_overtime
                    WHERE employee_id=2 AND work_date=%s::date AND slot='early'""",(lab.OT_DATE,)) is False,
                    "uncheck actually persists false in disposable PostgreSQL")
                check(len(ENTRY_HITS)==2 and [x["completed"] for x in ENTRY_HITS]==[True,False],
                    "two intentional completion toggles, no hidden extra writes")
                check(page.locator("#overtimeListPlan").text_content().strip()=="10분"
                      and page.locator("#overtimeListDone").text_content().strip()=="0분",
                    "list after uncheck restores plan 10 and done 0")

                # A separate fake writer changes minutes while this list still displays
                # 10. Clicking the checkbox must read current PG row and refuse to
                # overwrite the newer duration.
                page.evaluate("""()=>{if(realtimeRefreshTimer){
                  clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=null;}}""")
                changed=br.value("""UPDATE public.qa_browser_overtime
                    SET minutes=50,updated_at=GREATEST(clock_timestamp(),updated_at + INTERVAL '1 microsecond')
                    WHERE employee_id=2 AND work_date=%s::date AND slot='early'
                    RETURNING minutes""",(lab.OT_DATE,))
                check(changed==50,"concurrent synthetic writer updates duration to 50 minutes")
                before=len(ENTRY_HITS)
                page.locator("#overtimeListBody input[data-overtime-list-check]").check()
                page.wait_for_function("""()=>overtimeListPendingIds.size===0
                    && overtimeListBackendReady===true
                    && overtimeListRows.some(r=>r.work_date==='2027-05-13' && r.minutes===50)""",
                    timeout=22000)
                check(len(ENTRY_HITS)==before,
                      "stale list toggle rejected before writing entry RPC")
                latest=br.value("""SELECT json_build_object('minutes',minutes,'completed',completed)
                  FROM public.qa_browser_overtime WHERE employee_id=2
                  AND work_date=%s::date AND slot='early'""",(lab.OT_DATE,))
                check(latest=={"minutes":50,"completed":False},
                      "stale toggle preserved newer 50-minute DB record and incomplete status")
                check(page.locator("#overtimeListPlan").text_content().strip()=="50분"
                      and page.locator("#overtimeListDone").text_content().strip()=="0분",
                      "list resynchronized to latest 50-minute plan after conflict")
                check(not js_errors and not any(".supabase.co" in u for u in external),
                      "no browser JS exception and no production Supabase request")
                print("OVERTIME_MONTH_LIST_COMPLETION_REAL_CHROMIUM_SYNTHETIC_PG_SCOPED_PASS",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        server.shutdown()
        server.server_close()

if __name__=="__main__":
    main()

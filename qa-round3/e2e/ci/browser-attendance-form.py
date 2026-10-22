#!/usr/bin/env python3
"""Real app login UI and SAVE button -> isolated SQL attendance fixture.
Synthetic login/personnel backend, NOT production auth, RLS or full app E2E.
"""
import importlib.util, json, os, sys, threading, time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

PATH=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("workmoa_bridge", PATH/"browser-postgres-bridge.py")
br=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=br
spec.loader.exec_module(br)
TOKEN=br.WORKER
FAKE_EMP={
    "id":2,"display_name":"가상직원","login_name":"가상직원",
    "category":"일근(사무)","group_code":"DAY","is_admin":False,
    "sort_order":1,"active_from":"2026-01-01","active_to":None,
    "company_hire_date":None,"employee_origin":"existing",
    "personnel_account_status":"active"
}
FAKE_ASSIGN={
    "action_id":1,"batch_id":1,"employee_id":2,"sort_order":1,
    "correction_of":None,"effective_date":"2026-01-01",
    "batch_kind":"baseline","batch_status":"active","display_name":"가상직원",
    "placement_code":"DAY_OFFICE","employment_status":"working",
    "account_status":"active","entry_type":"existing","is_new_employee":False,
    "batch_note":"합성 인사배치","created_by_name":"가상 관리자",
    "batch_created_at":"2026-01-01T00:00:00Z","company_hire_date":None
}
READS={
    "get_personnel_account_status": [{"is_read_only":False,"is_disabled":False,"employment_status":"working","account_status":"active"}],
    "list_employees_personnel_v2":[FAKE_EMP],
    "list_personnel_assignments":[FAKE_ASSIGN],
    "list_personnel_account_events":[],
    "list_holiday_work_eligibility":[{"employee_id":2,"holiday_work_enabled":True}],
    # QA-only versioned read contract for the four-arg CAS client; fake worker only.
    "list_holiday_work_eligibility_v2":[{"employee_id":2,"holiday_work_enabled":True,"eligibility_revision":0}],
    "list_holiday_work":[],
    "list_my_holiday_work":[],
    "list_company_events_v2":[],
    "get_maintenance_schedule":{"revision":0,"data":br.INITIAL},
    "list_overtime_entries":[],
    "list_holiday_work_month_confirmations":[],
    "list_my_fingerprint_records":[],
    "list_my_memos":[],
    "list_my_memo_ddays":[]
}
SAVES=[]; CALLS=[]
class AttendanceBridge(br.Gateway):
    def do_POST(self):
        path=urlsplit(self.path).path
        name=path.removeprefix("/rest/v1/rpc/")
        if not path.startswith("/rest/v1/rpc/") or "/" in name:
            return self.reply(404,{"message":"QA_BAD_RPC"})
        if name not in READS and name not in ("initial_pin_status_v1",
                                             "list_attendance_with_annual_leave",
                                             "save_attendance_personnel_v2"):
            return super().do_POST()
        if (self.headers.get("Origin")!="http://127.0.0.1:54330" or
            self.headers.get("apikey")!=br.KEY or
            self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_AUTH_HEADER_DENIED"})
        raw_length=self.headers.get("Content-Length","")
        if not raw_length.isdecimal() or int(raw_length)>4096:
            return self.reply(413,{"message":"QA_REQUEST_TOO_LARGE"})
        try:
            data=json.loads(self.rfile.read(int(raw_length)) or b"{}")
        except Exception:
            return self.reply(400,{"message":"QA_BAD_JSON"})
        if not isinstance(data,dict) or data.get("p_token")!=TOKEN:
            return self.reply(403,{"message":"QA_WRONG_SESSION"})
        CALLS.append(name);br.HITS.append(name)
        if name=="initial_pin_status_v1":
            return self.reply(200,False)
        if name=="list_attendance_with_annual_leave":
            if set(data)!={"p_token","p_from","p_to"}:
                return self.reply(400,{"message":"QA_BAD_ATTENDANCE_QUERY"})
            rows=br.value("""SELECT coalesce(json_agg(json_build_object(
               'id',id,'employee_id',employee_id,
               'attendance_type',attendance_type,
               'start_date',start_date,'end_date',end_date,
               'absence_mode',absence_mode,
               'start_time',start_time,'end_time',end_time,
               'annual_leave_deduct',annual_leave_deduct,
               'updated_at',updated_at)), '[]'::json)
               FROM public.qa_attendance_entries
               WHERE start_date <= %s::date AND end_date >= %s::date""",
                (data["p_to"],data["p_from"]))
            return self.reply(200,rows)
        if name=="save_attendance_personnel_v2":
            required={"p_token","p_id","p_employee_id","p_attendance_type",
                      "p_start_date","p_end_date","p_absence_mode",
                      "p_start_time","p_end_time","p_expected"}
            if set(data)!=required:
                return self.reply(400,{"message":"QA_BAD_ATTENDANCE_ARGS"})
            # Confine mutation to one synthetic worker/day/type and create mode.
            if (data["p_employee_id"]!=2 or data["p_attendance_type"]!="연가"
                or data["p_start_date"]!=br.DATE or data["p_end_date"]!=br.DATE
                or data["p_absence_mode"]!="all_day" or data["p_start_time"] is not None
                or data["p_end_time"] is not None or data["p_id"] is not None
                or data["p_expected"] is not None):
                return self.reply(400,{"message":"QA_BAD_ATTENDANCE_FIELDS"})
            try:
                result=br.value("""SELECT public.save_attendance_personnel_v2(
                    %s::uuid,%s::bigint,%s::smallint,%s::text,%s::date,%s::date,
                    %s::text,%s::time,%s::time,%s::jsonb)""",
                    (data["p_token"],None,2,"연가",br.DATE,br.DATE,"all_day",None,None,None))
            except br.psycopg.Error:
                return self.reply(409,{"message":"QA_SYNTHETIC_ATTENDANCE_REJECTED"})
            SAVES.append(data)
            return self.reply(200,result)
        return self.reply(200,READS[name])

def check(x,message):
    assert x,message
    print("PASS attendance-form: "+message,flush=True)

def main():
    br.require_env()
    br.reset()
    folder=br.build()
    # UI form fixture is deliberately additive and absent from main.
    check(br.value("SELECT count(*) FROM public.qa_attendance_entries")==0,
          "synthetic attendance database begins empty")
    gateway=br.ThreadingHTTPServer((br.HOST,br.PORT),AttendanceBridge)
    threading.Thread(target=gateway.serve_forever,daemon=True).start()
    site=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
                             cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page(); blocked=[];errors=[];navigations=[]
                page.on("framenavigated",lambda f:navigations.append(f.url))
                def gate(route):
                    url=urlsplit(route.request.url)
                    if url.hostname==br.HOST and url.port in (br.PORT,br.WEB) and url.scheme in ("http","ws"):
                        return route.continue_()
                    blocked.append(route.request.url)
                    return route.abort()
                page.route("**/*",gate)
                page.on("pageerror",lambda e:errors.append(str(e)[:300]))
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginBtn").wait_for(state="visible",timeout=15000)
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                try:
                    page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                except Exception:
                    print("DIAG initial sync RPCs="+",".join(CALLS),flush=True)
                    print("DIAG tail requests="+",".join(br.HITS[-24:]),flush=True)
                    print("DIAG JS errors="+str(errors[-5:]),flush=True)
                    print("DIAG app="+str(page.evaluate("""() => ({
                      loginError:document.getElementById('loginError').textContent,
                      appClass:document.getElementById('appView').className,
                      reconnectClass:document.getElementById('reconnectView').className,
                      backend:state.personnelBackendReady,account:state.accountStatusBackendReady,
                      employees:state.employees.length
                    })""")),flush=True)
                    raise
                check("list_personnel_assignments" in CALLS and "list_employees_personnel_v2" in CALLS,
                      "real login UI loads synthetic personnel and worker roster")
                check(page.evaluate("state.personnelBackendReady===true && state.me?.employee_id===2"),
                      "real app has writable synthetic personnel context")
                # The first successful login opens the app's real usage-guide modal.
                # Dismiss it through the visible real button BEFORE opening the form,
                # otherwise Playwright correctly refuses to click through the overlay.
                # Usage guide is scheduled asynchronously after login; checking
                # count immediately misses its 120ms deferred open.
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=5000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=5000)
                check(page.locator("#usageGuideBackdrop.open").count()==0,
                      "first-login usage guide dismissed with actual UI control")
                # Test a future month: set the month context to the synthetic
                # record's month. The date-picker UX remains out of scope.
                page.evaluate("state.year=2027;state.month=4;")
                # Navigate to genuine form; date-picker UX is outside this focused scope.
                page.evaluate("openForm('2027-05-13')")
                page.locator("#formBackdrop.open").wait_for(timeout=10000)
                check(page.locator("#startDate").input_value()=="2027-05-13" and
                      page.locator("#attendanceType").input_value()=="연가" and
                      page.locator("#saveAttendanceBtn").is_enabled(),
                      "actual attendance form opens with synthetic date and enabled save button")
                check(br.value("SELECT count(*) FROM public.qa_attendance_entries")==0,
                      "no database attendance row exists before actual click")
                check(page.evaluate("!!state.me && !state.me.is_read_only && state.accountStatusBackendReady===true"),
                      "current synthetic session is active and account status is authoritative before click")
                page.locator("#saveAttendanceBtn").click()
                deadline=time.monotonic()+5
                while time.monotonic()<deadline and not SAVES:
                    if not page.evaluate("!!state.me"):
                        print("DIAG session lost immediately after button click",flush=True)
                        break
                    time.sleep(.15)
                if not SAVES:
                    print("DIAG calls="+",".join(CALLS[-30:]),flush=True)
                    print("DIAG hits="+",".join(br.HITS[-30:]),flush=True)
                    print("DIAG form="+str(page.locator("#formError").text_content()),flush=True)
                    print("DIAG app="+str(page.evaluate("""()=>({
                      mode:state.mode,personnel:state.personnelBackendReady,
                      account:state.me,tokenExists:!!state.sessionToken,
                      initialPin:state.initialPinRequired,
                      sessionKey:SESSION_KEY,tabToken:sessionStorage.getItem(SESSION_KEY),
                      sharedToken:localStorage.getItem(SESSION_KEY),
                      pageLifecycleFreshnessPending:pageLifecycleFreshnessPending,
                      visibleGuide:document.getElementById('usageGuideBackdrop').className,
                      appClass:document.getElementById('appView').className,
                      loginClass:document.getElementById('loginView').className,
                      formClass:document.getElementById('formBackdrop').className,
                      attendanceCount:state.attendance.length
                    })""")),flush=True)
                    print("DIAG pageNavigations="+str(navigations),flush=True)
                    print("DIAG errors="+str(errors[-5:]),flush=True)
                check(len(SAVES)==1,
                      "real save button passed preflight and issued exactly one protected attendance RPC")
                row=br.value("""SELECT json_build_object(
                    'employee_id',employee_id,'attendance_type',attendance_type,
                    'start_date',start_date,'end_date',end_date,
                    'absence_mode',absence_mode)
                    FROM public.qa_attendance_entries LIMIT 1""")
                check(row=={"employee_id":2,"attendance_type":"연가",
                           "start_date":br.DATE,"end_date":br.DATE,"absence_mode":"all_day"},
                      "app submit reached isolated PostgreSQL and committed exact synthetic attendance row")
                # Closed backdrops are intentionally invisible in this UI:
                # Playwright's default 'visible' would time out even when saved.
                page.locator("#formBackdrop").wait_for(state="hidden",timeout=20000)
                check(page.evaluate("state.attendance.some(r => r.employee_id===2 && r.start_date==='2027-05-13')"),
                      "post-save app resync reads committed DB attendance through bridge")
                check(not any(".supabase.co" in x for x in blocked),
                      "Chromium sent no remote Supabase requests")
                print("FORM_BUTTON_SQL_SCOPE_PASS: real login+form+save+resync; auth, personnel and attendance SQL are synthetic fixtures, NOT production E2E",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        gateway.shutdown();gateway.server_close()

if __name__=="__main__":
    main()

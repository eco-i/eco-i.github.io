#!/usr/bin/env python3
"""QA-only completion and deletion using real user controls on the integrated full app.
Synthetic employee, fake loopback gateway, disposable PostgreSQL. No production access.
"""
import importlib.util
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parent
name="workmoa_overtime_save_integration_support"
spec=importlib.util.spec_from_file_location(name,HERE/"browser-overtime-save-integration.py")
support=importlib.util.module_from_spec(spec)
sys.modules[name]=support
spec.loader.exec_module(support)
br=support.br
lab=support.lab

def check(ok,message):
    if not ok:
        raise AssertionError(message)
    print("PASS OVERTIME_COMPLETE_DELETE: "+message,flush=True)

def main():
    support.integration_guard()
    br.reset()
    with br.connect() as conn:
        conn.execute("TRUNCATE public.qa_browser_fingerprint,public.qa_browser_overtime RESTART IDENTITY")
    check(br.value("SELECT COUNT(*) FROM public.qa_browser_overtime")==0,
          "isolated overtime table starts empty")
    lab.OVERTIME_HITS.clear()
    br.HITS.clear()
    gateway=br.ThreadingHTTPServer((br.HOST,br.PORT),lab.ActionBridge)
    threading.Thread(target=gateway.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
                             cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with support.runner_chromium() as playwright:
            browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page()
                external=[]
                errors=[]
                page.on("pageerror",lambda e:errors.append(str(e)[:150]))
                page.on("dialog",lambda d:d.accept())
                def gate(route):
                    url=urlsplit(route.request.url)
                    if url.scheme in ("http","ws") and url.hostname==br.HOST and url.port in (br.PORT,br.WEB):
                        return route.continue_()
                    external.append(route.request.url)
                    return route.abort()
                page.route("**/*",gate)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=6000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=6000)
                check(page.evaluate("state.me?.employee_id===2 && state.personnelBackendReady===true"),
                      "real full-app browser login for synthetic worker")
                lab.open_date(page,lab.OT_DATE,2027,4)
                button=page.locator("#saveOvertimeBtn")
                if not button.is_visible():
                    page.locator("#overtimeDetailToggleBtn").click()
                check(button.is_visible() and button.is_enabled(),"detail save controls ready")
                page.locator('[data-overtime-slot="early"] button[data-overtime-adjust="10"]').click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="10분",
                      "10-minute plan entered through original UI")
                page.locator("#overtimeEarlyDone").check()
                check(page.locator("#overtimeEarlyDone").is_checked(),
                      "completion checkbox responds to user action")
                page.locator("#saveOvertimeBtn").click()
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                    state.overtimeEntries.some(r=>r.work_date==='2027-05-13' &&
                    r.slot==='early' && r.minutes===10 && r.completed===true)""",timeout=22000)
                done=br.value("""SELECT completed FROM public.qa_browser_overtime
                    WHERE employee_id=2 AND work_date=%s::date AND slot='early'""",(lab.OT_DATE,))
                check(done is True,"completed=true committed to real disposable PostgreSQL")
                check(page.locator("#overtimeDoneValue").text_content().strip()=="10분",
                      "calendar summary now counts 10 minutes as done")
                check(page.locator("#overtimePlanValue").text_content().strip()=="0분",
                      "calendar summary does not double-count completed plan")
                check(len(lab.OVERTIME_HITS)==1 and lab.OVERTIME_HITS[0]==10,
                      "exactly one intended completed write")
                page.locator('[data-overtime-slot="early"] button[data-overtime-clear="early"]').click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="0분" and
                      not page.locator("#overtimeEarlyDone").is_checked(),
                      "delete control clears selected minutes and completion tick")
                page.locator("#saveOvertimeBtn").click()
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                    !state.overtimeEntries.some(r=>r.work_date==='2027-05-13')""",timeout=22000)
                check(br.value("""SELECT COUNT(*) FROM public.qa_browser_overtime
                    WHERE employee_id=2 AND work_date=%s::date""",(lab.OT_DATE,))==0,
                      "deleted overtime row absent from real disposable PostgreSQL")
                check(page.locator("#overtimeDoneValue").text_content().strip()=="0분",
                      "completed summary resets to zero after deletion")
                check(len(lab.OVERTIME_HITS)==2 and lab.OVERTIME_HITS==[10,0],
                      "exactly one add and one delete, no duplicate writes")
                check(not errors and not any(".supabase.co" in u for u in external),
                      "no JavaScript exception or live Supabase traffic")
                print("OVERTIME_INTEGRATION_COMPLETE_DELETE_SYNTHETIC_PG_SCOPED_PASS",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:
            site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:
            site.kill()
        gateway.shutdown()
        gateway.server_close()

if __name__=="__main__":
    main()

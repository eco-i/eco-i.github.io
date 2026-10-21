#!/usr/bin/env python3
"""Test genuine holiday/overtime Save buttons with loopback-only error responses.
This IS NOT actual Supabase Auth/PostgREST or product full E2E.
Only synthetic identities, mock HTTP failures, and disposable PostgreSQL.
"""
import importlib.util
import json
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

PATH=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("workmoa_form_fixture",PATH/"browser-attendance-form.py")
fixture=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=fixture
spec.loader.exec_module(fixture)
br=fixture.br

SENT=[]
HOLIDAY="2027-05-15"
OVERTIME="2027-05-13"

class ErrorBridge(fixture.AttendanceBridge):
    def do_POST(self):
        path=urlsplit(self.path).path
        name=path.removeprefix("/rest/v1/rpc/")
        if name not in ("save_my_holiday_work_personnel_v2","save_my_overtime_day_v2"):
            return super().do_POST()
        if (path!="/rest/v1/rpc/"+name or
            self.headers.get("Origin")!="http://127.0.0.1:54330" or
            self.headers.get("apikey")!=br.KEY or
            self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_ONLY_DENIED"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or int(length)>4096:
            return self.reply(413,{"message":"QA_LENGTH_LIMIT"})
        try: data=json.loads(self.rfile.read(int(length)) or b"{}")
        except Exception: return self.reply(400,{"message":"QA_BAD_JSON"})
        if not isinstance(data,dict) or data.get("p_token")!=br.WORKER:
            return self.reply(403,{"message":"QA_FAKE_SESSION_REQUIRED"})
        if name=="save_my_holiday_work_personnel_v2":
            required={"p_token","p_date","p_start_time","p_end_time",
                      "p_expected_id","p_expected_updated_at"}
            if (set(data)!=required or data["p_date"]!=HOLIDAY or
                data["p_expected_id"] is not None or data["p_expected_updated_at"] is not None):
                return self.reply(400,{"message":"QA_BAD_HOLIDAY_PAYLOAD"})
            SENT.append(name)
            return self.reply(404,{
                "code":"PGRST202","hint":None,"details":None,
                "message":"Could not find the function public.save_my_holiday_work_personnel_v2 in the schema cache"
            })
        required={"p_token","p_work_date","p_early_minutes","p_early_completed",
                  "p_late_minutes","p_late_completed","p_expected"}
        if (set(data)!=required or data["p_work_date"]!=OVERTIME or
            data["p_expected"]!=[] or data["p_early_minutes"]!=10 or
            data["p_late_minutes"]!=0):
            return self.reply(400,{"message":"QA_BAD_OVERTIME_PAYLOAD"})
        SENT.append(name)
        # Simulate an authoritative stale-CAS conflict for the installed RPC name.
        return self.reply(409,{"code":"P0001","message":"STALE_OVERTIME_DAY"})

def check(ok, description):
    assert ok,description
    print("PASS holiday-overtime-errors: "+description,flush=True)

def no_writes():
    return (br.value("SELECT count(*) FROM public.holiday_work_entries")==0 and
            br.value("SELECT count(*) FROM public.qa_overtime_failed_write_sentinel")==0 and
            br.value("SELECT count(*) FROM public.audit_logs")==0)

def open_date(page, date, kind):
    page.evaluate("""async (date)=>{state.year=2027;state.month=4;
      await loadMonthData(true);openDetail(date)}""",date)
    page.locator("#detailBackdrop.open").wait_for(timeout=10000)
    section=f"#{kind}DetailSection"
    toggle="#holidayWorkToggleBtn" if kind=="holidayWork" else "#overtimeDetailToggleBtn"
    if not page.locator(section).is_visible():
        raise AssertionError(kind+" detail section unavailable in synthetic user/date")
    if not page.locator(section+" button").first.is_visible():
        page.locator(toggle).click()

def main():
    br.require_env()
    br.reset()
    check(no_writes(),"fake PostgreSQL starts with no holiday/overtime/audit writes")
    br.HITS.clear()
    gateway=br.ThreadingHTTPServer((br.HOST,br.PORT),ErrorBridge)
    threading.Thread(target=gateway.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
                             cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page()
                external=[]
                def gate(route):
                    u=urlsplit(route.request.url)
                    if u.scheme in ("http","ws") and u.hostname==br.HOST and u.port in (br.PORT,br.WEB):
                        return route.continue_()
                    external.append(route.request.url)
                    return route.abort()
                page.route("**/*",gate)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginBtn").wait_for(state="visible",timeout=15000)
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=5000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=5000)
                check(page.evaluate("state.me?.employee_id===2 && state.personnelBackendReady===true"),
                      "real login controls give writable synthetic employee session")

                open_date(page,HOLIDAY,"holidayWork")
                # Expand via actual UI toggle if the empty date is collapsed.
                if not page.locator("#saveHolidayWorkBtn").is_visible():
                    page.locator("#holidayWorkToggleBtn").click()
                check(page.locator("#saveHolidayWorkBtn").is_visible() and
                      page.locator("#saveHolidayWorkBtn").is_enabled(),
                      "holiday work Save button available on a Saturday")
                page.locator("#holidayWorkChecked").check()
                before=page.evaluate("""()=>({
                  checked:document.getElementById('holidayWorkChecked').checked,
                  start:document.getElementById('holidayStartHour').value,
                  end:document.getElementById('holidayEndHour').value})""")
                with page.expect_response(lambda r:urlsplit(r.url).path.endswith(
                        "/rest/v1/rpc/save_my_holiday_work_personnel_v2"),timeout=15000) as hresp:
                    page.locator("#saveHolidayWorkBtn").click()
                check(hresp.value.status==404,
                      "real holiday Save button receives synthetic PGRST202 missing-function 404")
                page.wait_for_function("""()=>!holidayWorkSavePendingKeys.size &&
                   !!document.getElementById('holidayWorkError').textContent.trim()""",timeout=12000)
                herror=page.locator("#holidayWorkError").text_content().strip()
                check(bool(herror) and len(herror)<600,
                      "holiday backend failure remains visible after finally cleanup")
                page.evaluate("syncOpenDetailPermissionsPreservingDraft()")
                check(page.locator("#holidayWorkError").text_content().strip()==herror,
                      "holiday save error survives routine permission refresh")
                after=page.evaluate("""()=>({
                  checked:document.getElementById('holidayWorkChecked').checked,
                  start:document.getElementById('holidayStartHour').value,
                  end:document.getElementById('holidayEndHour').value})""")
                check(after==before and page.locator("#saveHolidayWorkBtn").is_enabled(),
                      "holiday unsaved draft kept and Save unlocked after failure")
                check(no_writes(),"holiday Save 404 performed zero PG writes")
                # The legacy per-section Close button is hidden in this UI.
                # Use the visible modal header close and explicitly accept the
                # genuine unsaved-draft discard confirmation.
                page.once("dialog",lambda dlg:dlg.accept())
                page.get_by_role("button",name="날짜 상세 닫기").click()
                page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=5000)

                open_date(page,OVERTIME,"overtime")
                if not page.locator("#saveOvertimeBtn").is_visible():
                    page.locator("#overtimeDetailToggleBtn").click()
                check(page.locator("#saveOvertimeBtn").is_visible() and
                      page.locator("#saveOvertimeBtn").is_enabled(),
                      "overtime Save button is enabled on eligible date")
                page.locator('[data-overtime-slot="early"] button[data-overtime-adjust="10"]').click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="10분",
                      "real overtime +10-minute UI control edited draft")
                with page.expect_response(lambda r:urlsplit(r.url).path.endswith(
                        "/rest/v1/rpc/save_my_overtime_day_v2"),timeout=15000) as oresp:
                    page.locator("#saveOvertimeBtn").click()
                check(oresp.value.status==409,
                      "real overtime Save button receives synthetic stale-CAS HTTP 409")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                   !!document.getElementById('overtimeDetailError').textContent.trim()""",timeout=12000)
                oerror=page.locator("#overtimeDetailError").text_content().strip()
                check("다른 창" in oerror,
                      "overtime stale-CAS error translated into actionable Korean")
                page.evaluate("syncOpenDetailPermissionsPreservingDraft()")
                check(page.locator("#overtimeDetailError").text_content().strip()==oerror,
                      "overtime Save error survives further permission refresh")
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="10분" and
                      page.locator("#saveOvertimeBtn").is_enabled(),
                      "overtime unsaved 10-minute draft survives and Save reenabled")
                check(no_writes(),"overtime conflict performed zero synthetic PostgreSQL writes")
                check(SENT==["save_my_holiday_work_personnel_v2","save_my_overtime_day_v2"],
                      "exactly one real UI mutation request per failed operation")
                check(not any(".supabase.co" in x for x in external),
                      "no remote Supabase requests attempted")
                print("HOLIDAY_OVERTIME_NEGATIVE_UI_SCOPED_PASS: browser controls and fake errors only; real Supabase E2E UNVERIFIED",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        gateway.shutdown()
        gateway.server_close()

if __name__=="__main__":
    main()

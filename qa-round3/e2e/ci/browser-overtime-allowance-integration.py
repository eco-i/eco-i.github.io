#!/usr/bin/env python3
"""Scoped Chromium UI rendering test of the actual Workmoa QA index.html.
Synthetic login, synthetic rows and isolated PostgreSQL gateway only.
No production DB, employee identity, Supabase project or real payroll E2E.
"""
import importlib.util
import os
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "qa_existing_browser_lab", HERE / "browser-fingerprint-overtime-success.py"
)
lab = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = lab
spec.loader.exec_module(lab)
br = lab.br

TARGET_REF = "refs/heads/qa-round3-overtime-integration-20261107"


def guard():
    assert os.getenv("GITHUB_REPOSITORY") == "eco-i/eco-i.github.io"
    assert os.getenv("GITHUB_REF") == TARGET_REF
    for k, v in {
        "PGHOST": "127.0.0.1",
        "PGPORT": "5432",
        "PGUSER": "qa_runner",
        "PGDATABASE": "qa_round3",
        "PGPASSWORD": "synthetic_ci_only_not_a_real_secret",
    }.items():
        assert os.getenv(k) == v, "FAIL_CLOSED_LOCAL_POSTGRES_" + k
    for k in (
        "DATABASE_URL", "SUPABASE_URL", "SUPABASE_ACCESS_TOKEN",
        "SUPABASE_DB_PASSWORD", "QA_SUPABASE_URL", "QA_SUPABASE_ANON_KEY",
        "DOCKER_HOST", "DOCKER_CONTEXT",
    ):
        assert not os.getenv(k), "FAIL_CLOSED_REMOTE_CONFIG_" + k
    chrome = os.getenv("QA_CHROMIUM_EXECUTABLE", "")
    assert chrome and os.path.isabs(chrome) and os.path.isfile(chrome), "FAIL_CLOSED_LOCAL_CHROME_EXECUTABLE"


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    print("PASS OVERTIME_ALLOWANCE_CHROMIUM: " + label, flush=True)


def main():
    guard()
    br.reset()
    br.HITS.clear()
    server = br.ThreadingHTTPServer((br.HOST, br.PORT), lab.ActionBridge)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    folder = br.build()
    site = br.subprocess.Popen(
        ["node", str(br.ROOT / "qa-round3/e2e/serve-local-qa-site.mjs"), folder],
        cwd=br.ROOT,
        stdout=br.subprocess.DEVNULL,
        stderr=br.subprocess.DEVNULL,
    )
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, executable_path=os.environ["QA_CHROMIUM_EXECUTABLE"], args=["--no-sandbox"])
            try:
                context = browser.new_context(locale="ko-KR", service_workers="block")
                page = context.new_page()
                external = []
                page_errors = []
                page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))
                page.on("dialog", lambda d: d.accept())

                def gate(route):
                    u = urlsplit(route.request.url)
                    if (u.scheme in ("http", "ws") and u.hostname == br.HOST
                            and u.port in (br.PORT, br.WEB)):
                        return route.continue_()
                    external.append(route.request.url)
                    return route.abort()

                page.route("**/*", gate)
                page.goto("http://127.0.0.1:54330/", wait_until="domcontentloaded")
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(
                    state="visible", timeout=6000
                )
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(
                    state="hidden", timeout=6000
                )
                check(
                    page.evaluate("state.me?.employee_id===2 && state.personnelBackendReady===true"),
                    "actual full-app login succeeds for one synthetic worker only",
                )
                results = page.evaluate(r"""() => {
                  const worker = state.employees.find(x => Number(x.id) === 2);
                  if (!worker || !document.getElementById('overtimeListAllowanceBreakdown'))
                    throw new Error('QA_INTEGRATION_TARGET_MISSING');
                  const cases = [];
                  function scenario(count, overtimeMinutes, holidayMinutes=480, enabled=true, backendReady=true) {
                    worker.holiday_work_enabled=enabled;
                    state.year=2027;
                    state.month=4;
                    state.view='mine';
                    state.holidayWorkEligibilityReady=true;
                    state.holidayWorkBackendReady=backendReady;
                    state.overtimeConfirmBackendReady=true;
                    state.overtimeBackendReady=true;
                    state.overtimeConfirmations=[{month_start:'2027-05-01'}];
                    state.holidayWorks=Array.from({length:count},(_,i)=>({
                      id:100+i,
                      employee_id:2,
                      work_date:'2027-05-'+String(i+1).padStart(2,'0'),
                      net_minutes:holidayMinutes
                    }));
                    const overtimeRows=overtimeMinutes>0?[{
                      id:901,
                      employee_id:2,
                      work_date:'2027-05-13',
                      slot:'early',
                      minutes:overtimeMinutes,
                      completed:false,
                      updated_at:'2027-05-01T00:00:00Z'
                    }]:[];
                    state.overtimeEntries=overtimeRows;
                    overtimeListTargetEmployeeId=2;
                    overtimeListRows=overtimeRows;
                    overtimeListBackendReady=true;
                    renderOvertimeSummary();
                    renderOvertimeList();
                    const stats=overtimeSummaryFor(2,2027,4);
                    return {
                      cap:stats.capacity.minutes,
                      holiday:stats.holidayMinutes,
                      overtime:stats.total,
                      combined:stats.combinedTotal,
                      capText:document.getElementById('overtimeCapacityValue').textContent.trim(),
                      planText:document.getElementById('overtimePlanValue').textContent.trim(),
                      listCapText:document.getElementById('overtimeListCapacity').textContent.trim(),
                      breakdown:document.getElementById('overtimeListAllowanceBreakdown').textContent.trim(),
                      summaryTitle:document.getElementById('overtimeSummary').title,
                      warning:document.getElementById('overtimeListWarning').textContent.trim(),
                      warned:!document.getElementById('overtimeListWarning').classList.contains('hidden')
                    };
                  }
                  for(let n=0;n<=4;n++) cases.push({type:'normal',n,result:scenario(n,900)});
                  cases.push({type:'short-holiday',result:scenario(1,1080,240)});
                  cases.push({type:'dual-warning',result:scenario(1,960)});
                  cases.push({type:'fifth',result:scenario(5,0)});
                  cases.push({type:'no-eligibility',result:scenario(0,960,480,false)});
                  cases.push({type:'data-loading',result:scenario(2,600,480,true,false)});
                  return {
                    cases,
                    tenMinuteButtons:document.querySelectorAll(
                      '[data-overtime-slot="early"] button[data-overtime-adjust="10"]'
                    ).length,
                    isRealFullApp:!!document.getElementById('appView') &&
                      !!document.getElementById('calendarGrid')
                  };
                }""")
                check(results["isRealFullApp"], "real complete QA app HTML and original DOM loaded")
                check(results["tenMinuteButtons"] > 0, "existing 10-minute overtime controls retained")
                items = results["cases"]
                check(len(items) == 10, "ten independent rendered overtime UI scenarios")
                for n in range(5):
                    item = items[n]
                    r = item["result"]
                    expected = (15 + 8 * n) * 60
                    check(
                        item["type"] == "normal" and item["n"] == n and
                        r["cap"] == expected and
                        r["holiday"] == 480*n and
                        r["combined"] == expected and
                        r["capText"] == f"{15+8*n}시간" and
                        r["listCapText"] == f"{15+8*n}시간" and
                        r["planText"] == "15시간" and
                        r["breakdown"].startswith(f"휴근 {8*n}시간 +" if n else "휴근 0분 +") and
                        not r["warned"],
                        f"holiday duty {n} times: DOM reflects full cap and exact boundary",
                    )
                short = items[5]["result"]
                check(
                    short["cap"] == 1380 and short["holiday"] == 240 and
                    short["overtime"] == 1080 and short["combined"] == 1320 and
                    "별도 시간외근무가 월 15시간을 3시간 초과" in short["warning"] and
                    "휴근 포함 월 합계" not in short["warning"] and
                    "휴근 4시간 + 시간외 18시간" in short["breakdown"],
                    "4h holiday +18h overtime: separate 15h cap warned, combined 23h cap not exceeded",
                )
                dual = items[6]["result"]
                check(
                    dual["cap"] == 1380 and dual["combined"] == 1440 and
                    "별도 시간외근무가" in dual["warning"] and
                    "휴근 포함 월 합계" in dual["warning"] and
                    dual["warned"],
                    "8h holiday +16h overtime: independent and combined caps both warn",
                )
                fifth = items[7]["result"]
                check(
                    fifth["cap"] is None and
                    fifth["capText"] == "미정" and
                    fifth["listCapText"] == "미정",
                    "five holidays: no invented monthly allowance",
                )
                no_elig = items[8]["result"]
                check(
                    no_elig["cap"] == 900 and
                    "월 시간외근무 합계" in no_elig["warning"] and
                    "휴근 포함" not in no_elig["warning"],
                    "holiday-ineligible employee displays 15h cap with accurate warning label",
                )
                loading = items[9]["result"]
                check(
                    loading["cap"] is None and loading["capText"] == "미정",
                    "holiday backend not ready: allowance fails closed as unknown",
                )
                check(
                    not page_errors,
                    "no Chromium JavaScript page errors in the new allowance UI paths",
                )
                check(
                    not any(".supabase.co" in x for x in external),
                    "all production Supabase requests blocked by isolated browser network gate",
                )
                print(
                    "OVERTIME_2026_REVISED_ALLOWANCE_REAL_CHROMIUM_SCOPED_PASS "
                    "(synthetic UI state, not production E2E)",
                    flush=True,
                )
            finally:
                browser.close()
    finally:
        site.terminate()
        try:
            site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:
            site.kill()
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()

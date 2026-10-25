#!/usr/bin/env python3
"""Real Chromium reproducer of 2026-10-24 catalog's holiday RPC mismatch.

Private operating catalog indicates the versioned eligibility reader is absent
and the present writer has only 3 arguments. Reproduce that *shape* with a
synthetic, locally hosted PGRST202 404. No production server request or SQL writes.
"""
import importlib.util
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location("qa_holiday_account",HERE/"browser-two-admin-account-cas.py")
qa=importlib.util.module_from_spec(sp)
sys.modules[sp.name]=qa
sp.loader.exec_module(qa)
br=qa.br
reads=[]
writes=[]
checks=[]

def check(expr,detail):
    if not expr: raise AssertionError(detail)
    checks.append(detail)
    print("HOLIDAY_RPC_MISMATCH_PASS",len(checks),detail,flush=True)

class MissingCatalogHolidayApi(qa.TwoAdminFakeApi):
    def do_POST(self):
        path=urlsplit(self.path).path
        if path=="/rest/v1/rpc/list_holiday_work_eligibility_v2":
            reads.append(path)
            return self.reply(404,{
                "code":"PGRST202",
                "message":"Could not find function public.list_holiday_work_eligibility_v2(p_token) in schema cache"
            })
        if path=="/rest/v1/rpc/admin_set_holiday_work_enabled_v2":
            writes.append(path)
            return self.reply(404,{
                "code":"PGRST202",
                "message":"Could not find function public.admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled,p_expected_revision) in schema cache"
            })
        return super().do_POST()

def run():
    br.require_env()
    br.reset()
    baseline={"revision":0,"status":"active","events":0}
    check(qa.dbstate()==baseline,"isolated test PostgreSQL starts without mutations")
    server=br.ThreadingHTTPServer((br.HOST,br.PORT),MissingCatalogHolidayApi)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(
        ["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
        cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                cx=browser.new_context(locale="ko-KR",service_workers="block")
                blocked=[]
                page,errors=qa.setup(cx,blocked)
                qa.login(page,"가상관리자A")
                page.wait_for_function("state.holidayWorkEligibilityReady === false",
                                       timeout=12000)
                check(page.evaluate("!!state.me && state.me.is_admin && activeAdminMode()"),
                      "the user can log in and unlock admin normally")
                check(page.evaluate("state.personnelBackendReady === true"),
                      "main personnel roster loaded normally")
                check(page.evaluate("state.employees.length === 3"),
                      "3 synthetic employees are present in UI")
                check(len(reads)>=1,
                      "browser actually called unavailable versioned eligibility reader")
                check(page.evaluate("state.holidayWorkEligibilityReady === false"),
                      "missing mandatory versioned reader is marked failed, never healthy")
                check(not page.evaluate("coreMonthSyncHealthy()"),
                      "global synchronized data indicator stays fail-closed")
                check(all(not isinstance(x.get("holiday_work_eligibility_revision"),int)
                          for x in page.evaluate("state.employees")),
                      "no fabricated CAS revision is injected for employees")
                # Render permission check with a fabricated DOM input (not part of website).
                # This invokes the real UI handler with a real active synthetic employee.
                page.evaluate("""async () => {
                    const input=document.createElement('input');
                    input.type='checkbox';
                    input.dataset.holidayWorkEnabled='2';
                    input.checked=true;
                    await changeHolidayWorkEligibility(input);
                }""")
                check(len(writes)==0,
                      "real change handler refuses to send writes without server CAS revision")
                check(qa.dbstate()==baseline and not qa.MUTATIONS,
                      "all synthetic employee account records and audit events are unchanged")
                check(len(reads)>=1,
                      "read error still observed after rejected attempted checkbox mutation")
                check(page.evaluate("state.holidayWorkEligibilityReady === false"),
                      "UI remains in fail-closed state after attempted checkbox action")
                check(not any(".supabase.co" in u for u in blocked),
                      "no remote Supabase network calls")
                check(not errors,
                      "no uncaught Chromium errors during intentional missing RPC response")
                print(f"HOLIDAY_RPC_MISMATCH_SCOPED_PASS {len(checks)} checks; authentic frontend, synthetic missing-RPC backend; NOT proof of current live outage",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        server.shutdown();server.server_close()

if __name__=="__main__":
    run()

#!/usr/bin/env python3
"""Two real same-origin Chromium tabs using a loopback fake worker backend.
Scoped P0 session isolation only. NOT two-admin Auth/PostgREST or live RLS E2E.
"""
import importlib.util
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("qa_form_gateway", HERE/"browser-attendance-form.py")
fixture = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = fixture
spec.loader.exec_module(fixture)
br = fixture.br
ENDPOINT = "http://127.0.0.1:54330/"

def check(value, message):
    if not value:
        raise AssertionError(message)
    print("TWO_TAB_PASS "+message, flush=True)

def snapshot(page):
    return page.evaluate("""() => ({
        employee:state.me?.employee_id || null,
        token:state.sessionToken || '',
        tab:sessionStorage.getItem(SESSION_KEY),
        shared:localStorage.getItem(SESSION_KEY),
        appVisible:!document.getElementById('appView').classList.contains('hidden'),
        loginVisible:!document.getElementById('loginView').classList.contains('hidden')
    })""")

def login(page, *, persistent=False):
    page.locator("#loginBtn").wait_for(state="visible", timeout=12000)
    if page.locator("#pcRememberLogin").is_visible():
        page.locator("#pcRememberLogin").set_checked(persistent)
    page.locator("#loginName").fill("가상직원")
    page.locator("#loginPin").fill("1234")
    page.locator("#loginBtn").click()
    page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
    guide=page.locator("#usageGuideBackdrop.open")
    try:
        guide.wait_for(state="visible", timeout=2500)
        page.locator("#usageGuideConfirmBtn").click()
        guide.wait_for(state="hidden", timeout=5000)
    except Exception:
        if guide.is_visible():
            raise
    page.wait_for_function("state.me?.employee_id===2", timeout=10000)
    return snapshot(page)

def test_tabs():
    br.require_env()
    br.reset()
    fixture.CALLS.clear()
    server=br.ThreadingHTTPServer((br.HOST,br.PORT),fixture.AttendanceBridge)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    folder=br.build()
    site=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
         cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                ctx=browser.new_context(locale="ko-KR",service_workers="block")
                outside=[]
                def gate(route):
                    u=urlsplit(route.request.url)
                    if u.scheme=="http" and u.hostname==br.HOST and u.port in (br.PORT,br.WEB):
                        return route.continue_()
                    outside.append(u.hostname or u.scheme)
                    return route.abort()
                ctx.route("**/*",gate)
                a=ctx.new_page()
                a.goto(ENDPOINT,wait_until="domcontentloaded")
                initial=login(a,persistent=False)
                check(initial["employee"]==2 and initial["tab"]==br.WORKER
                    and not initial["shared"] and initial["appVisible"],
                    "tab A logs in with only sessionStorage (no shared session)")
                b=ctx.new_page()
                b.goto(ENDPOINT,wait_until="domcontentloaded")
                check(snapshot(b)["employee"] is None,
                    "new tab B does not inherit tab-only A credentials")
                second=login(b,persistent=False)
                check(second["employee"]==2 and second["tab"]==br.WORKER
                    and not second["shared"],"tab B can establish independent PC tab-only session")
                check(snapshot(a)["employee"]==2 and snapshot(a)["appVisible"],
                    "tab A still protected under its own session after B login")
                a.evaluate("logout(false)")
                a.wait_for_function("!state.me && !state.sessionToken && document.getElementById('appView').classList.contains('hidden')",timeout=10000)
                check(snapshot(b)["employee"]==2 and snapshot(b)["appVisible"]
                    and snapshot(b)["tab"]==br.WORKER,
                    "tab A logout does not delete a separately logged-in tab B")
                b.evaluate("logout(false)")
                b.wait_for_function("!state.me && !state.sessionToken && document.getElementById('appView').classList.contains('hidden')",timeout=10000)
                check(not snapshot(b)["tab"] and not snapshot(b)["shared"],
                    "both isolated tabs are logged out without residual saved token")

                # Different persistence mode: A is PC-only, B is shared/persistent.
                # A must not silently borrow the other tab's shared login.
                a.reload(wait_until="domcontentloaded")
                isolated=login(a,persistent=False)
                check(isolated["tab"]==br.WORKER and not isolated["shared"],
                    "fresh tab-only session remains isolated from shared persistent storage")
                b.reload(wait_until="domcontentloaded")
                persistent=login(b,persistent=True)
                check(persistent["shared"]==br.WORKER and persistent["appVisible"],
                    "real persistent-login checkbox stores shared session in Chromium")
                check(snapshot(a)["employee"]==2,
                    "persistent login in B does not overwrite the protected identity in tab A")
                # A newly opened tab will encounter B's shared token, but the
                # synthetic backend has no get_me restore contract; not claiming
                # automatic session restoration in this scoped test.
                b.evaluate("logout(false)")
                b.wait_for_function("!state.me && !state.sessionToken", timeout=10000)
                a.wait_for_timeout(300)
                check(snapshot(a)["employee"]==2 and snapshot(a)["appVisible"],
                    "shared B logout does not revoke independent tab-only A")
                check(not snapshot(a)["shared"],
                    "shared token cleanup does not leave persistent credential behind")
                a.evaluate("logout(false)")
                a.wait_for_function("!state.me && !state.sessionToken", timeout=10000)
                check(not snapshot(a)["tab"] and not snapshot(a)["shared"],
                    "final two-tab cleanup removes only synthetic credentials")
                check(not [v for v in outside if v.endswith(".supabase.co") or v=="supabase.co"],
                    "browser never attempted an actual Supabase network call")
                check(not any(k in ("save_attendance_personnel_v2","admin_reset_data_v2",
                                    "admin_restore_data_v2","admin_restore_safety_backup_v2")
                        for k in fixture.CALLS),
                    "two-tab test issued no attendance or admin data mutations")
                print("TWO_TAB_SCOPED_PASS isolated Chromium + fake employee session; NOT two-admin/RLS/E2E",flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        server.shutdown();server.server_close()

if __name__=="__main__":
    test_tabs()

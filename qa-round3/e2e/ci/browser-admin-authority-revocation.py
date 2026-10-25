#!/usr/bin/env python3
"""Scoped real-Chromium privilege downgrade and session-expiry regression.
All identity, authority, PIN, and responses come from a synthetic loopback-only fixture.
This is NOT authentic Supabase Auth, PostgREST, original RPC, RLS, or live E2E.
"""
import importlib.util
import sys
import threading
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("two_admin_qa", HERE / "browser-two-admin-account-cas.py")
qa = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa
spec.loader.exec_module(qa)
br = qa.br
CHECKS = []
AUTHORITY = {"revoked": False, "expire_on_write": set(), "denied_attempts": 0}

def check(condition, label):
    if not condition:
        raise AssertionError(label)
    CHECKS.append(label)
    print("AUTHORITY_PASS " + label, flush=True)

class AuthorityApi(qa.TwoAdminFakeApi):
    def do_POST(self):
        path = urlsplit(self.path).path
        if path == "/rest/v1/rpc/admin_set_employee_account_status_v3":
            # A fake service must recheck permissions at the final commit boundary.
            # A rejected request NEVER enters the disposable PostgreSQL mutator.
            if qa.A in AUTHORITY["expire_on_write"] or qa.B in AUTHORITY["expire_on_write"]:
                # Only one principal can expire in this one-at-a-time scenario.
                AUTHORITY["denied_attempts"] += 1
                return self.reply(401, {"code": "P0001", "message": "SESSION_EXPIRED"})
            if AUTHORITY["revoked"]:
                AUTHORITY["denied_attempts"] += 1
                return self.reply(403, {"code": "42501", "message": "ADMIN_PERMISSION_REVOKED"})
        return super().do_POST()

def run():
    br.require_env()
    br.reset()
    qa.ROSTER[0]["is_admin"] = True
    qa.ROSTER[2]["is_admin"] = True
    check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
          "disposable database starts with zero events and revision 0")
    server = br.ThreadingHTTPServer((br.HOST, br.PORT), AuthorityApi)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    folder = br.build()
    site = br.subprocess.Popen(
        ["node", str(br.ROOT / "qa-round3/e2e/serve-local-qa-site.mjs"), folder],
        cwd=br.ROOT, stdout=br.subprocess.DEVNULL, stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            try:
                network = []
                ctx_a = browser.new_context(locale="ko-KR", service_workers="block")
                a, ae = qa.setup(ctx_a, network)
                qa.login(a, "가상관리자A")
                qa.open_dirty(a, "readonly", "UNSAVED-ROLE-REVOKE")
                check(a.evaluate("activeAdminMode()"), "administrator initially holds PIN-gated unlock")
                # A fresh synthetic employee-list response removes A's administrator role.
                AUTHORITY["revoked"] = True
                qa.ROSTER[0]["is_admin"] = False
                a.evaluate("loadEmployees()")
                check(a.evaluate("state.me.is_admin===false && !activeAdminMode()"),
                      "fresh roster downgrades currently logged-in administrator")
                check(a.evaluate("!adminUnlockMatches(state.sessionToken)"),
                      "old second-PIN unlock revoked on downgrade")
                check(a.locator("#adminTools").is_hidden(),
                      "admin-only controls hidden after downgrade")
                check(a.locator("#employeeAccountBackdrop").evaluate(
                          "(el) => el.classList.contains('open')"),
                      "dirty editor remains open without leaking manager list")
                check(a.locator("#employeeAccountNote").input_value() == "UNSAVED-ROLE-REVOKE",
                      "dirty account note preserved after downgrade")
                check(a.locator("#confirmEmployeeAccountBtn").is_disabled(),
                      "save button locked when privilege is absent")
                a.evaluate("saveEmployeeAccountStatus()")
                check(len(qa.MUTATIONS) == 0 and AUTHORITY["denied_attempts"] == 0,
                      "direct stale save handler cannot emit a mutation")
                # Regranting roster role must not silently restore a previously cleared PIN.
                AUTHORITY["revoked"] = False
                qa.ROSTER[0]["is_admin"] = True
                a.evaluate("loadEmployees()")
                check(a.evaluate("state.me.is_admin===true && !activeAdminMode()"),
                      "role recovery does not resurrect old second-PIN unlock")
                check(a.locator("#confirmEmployeeAccountBtn").is_disabled(),
                      "old dirty editor stays locked until explicit new authentication")
                check(a.locator("#employeeAccountNote").input_value() == "UNSAVED-ROLE-REVOKE",
                      "locked editor retains unsaved note after role recovery")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "role downgrade and recovery never write PostgreSQL")
                # A different synthetic administrator experiences definite server session expiry
                # after pressing the actual save button. No SQL call is permitted.
                ctx_b = browser.new_context(locale="ko-KR", service_workers="block")
                b, be = qa.setup(ctx_b, network)
                qa.login(b, "가상관리자B")
                qa.open_dirty(b, "disabled", "UNSAVED-EXPIRED")
                AUTHORITY["expire_on_write"].add(qa.B)
                qa.click_save(b)
                b.locator("#loginView").wait_for(state="visible", timeout=15000)
                check(b.evaluate("!state.sessionToken && !state.me"),
                      "confirmed expiry clears old user identity and session token")
                check(b.locator("#appView").is_hidden(),
                      "confirmed session expiry hides previously authenticated app")
                check(b.locator("#loginView").is_visible(),
                      "session-expired browser returns to login")
                check(not b.evaluate("activeAdminMode()"),
                      "expired session cannot keep manager unlock")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "definite expired-session rejection writes no SQL event")
                check(AUTHORITY["denied_attempts"] == 1 and len(qa.MUTATIONS) == 0,
                      "expired save rejected before any synthetic CAS transaction")
                check(not any(".supabase.co" in x for x in network),
                      "both browsers have no hosted Supabase access")
                check(not ae and not be, "no unhandled browser JavaScript errors")
                print(f"AUTHORITY_SCOPE_PASS {len(CHECKS)} scoped assertions; synthetic authority and PostgreSQL, NOT original server E2E", flush=True)
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
    run()

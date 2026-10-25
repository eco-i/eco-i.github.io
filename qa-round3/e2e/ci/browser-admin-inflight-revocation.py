#!/usr/bin/env python3
"""In-flight role revoke / old-session expiry; Chromium + synthetic loopback ONLY.

The blocked save RPC is deliberately answered WITHOUT invoking the artificial
PostgreSQL mutator. This proves frontend handoff/response fencing under a fake
server rejection, not real backend authorization, RLS, or in-transaction races.
"""
import importlib.util
import json
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("two_admin_inflight", HERE / "browser-two-admin-account-cas.py")
qa = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa
spec.loader.exec_module(qa)
br = qa.br
CHECKS = []
INTERCEPT = {"mode": "idle", "entered": threading.Event(),
             "release": threading.Event(), "requests": [], "replies": []}
LOCK = threading.Lock()

def check(ok, label):
    if not ok:
        raise AssertionError(label)
    CHECKS.append(label)
    print("INFLIGHT_PASS " + label, flush=True)

class DelayedSaveApi(qa.TwoAdminFakeApi):
    def do_POST(self):
        endpoint = urlsplit(self.path).path
        if endpoint != "/rest/v1/rpc/admin_set_employee_account_status_v3":
            return super().do_POST()
        # Validate that only local synthetic browser requests enter the gate.
        if (self.headers.get("Origin") != "http://127.0.0.1:54330"
            or self.headers.get("apikey") != br.KEY
            or self.headers.get("Authorization") != "Bearer " + br.KEY):
            return self.reply(403, {"message": "QA_LOCAL_AUTH_HEADERS_ONLY"})
        size = self.headers.get("Content-Length", "")
        if not size.isdecimal() or not (0 < int(size) <= 8192):
            return self.reply(413, {"message": "QA_BAD_LENGTH"})
        try:
            data = json.loads(self.rfile.read(int(size)))
        except Exception:
            return self.reply(400, {"message": "QA_BAD_JSON"})
        if (not isinstance(data, dict) or set(data) != {
            "p_token", "p_employee_id", "p_account_status", "p_effective_date",
            "p_note", "p_expected", "p_expected_revision"
        } or data.get("p_employee_id") != 2
            or data.get("p_token") not in (qa.A, qa.B)
            or not isinstance(data.get("p_expected"), dict)):
            return self.reply(400, {"message": "QA_BAD_MUTATION_INPUT"})
        mode = INTERCEPT["mode"]
        if mode not in ("revoked", "expired"):
            return self.reply(409, {"message": "QA_TEST_GATE_NOT_ARMED"})
        with LOCK:
            INTERCEPT["requests"].append({"mode": mode, "actor": data["p_token"],
                                          "revision": data["p_expected_revision"],
                                          "note": data["p_note"]})
        INTERCEPT["entered"].set()
        if not INTERCEPT["release"].wait(timeout=20):
            return self.reply(503, {"message": "QA_TEST_GATE_TIMEOUT"})
        with LOCK:
            INTERCEPT["replies"].append(mode)
        # The fake backend rechecks authoritative identity AFTER the hold and
        # rejects before any SQL transaction, irrespective of UI state.
        if mode == "revoked":
            return self.reply(403, {"code": "42501", "message": "ADMIN_PERMISSION_REVOKED"})
        return self.reply(401, {"code": "P0001", "message": "SESSION_EXPIRED"})

def arm(mode):
    assert mode in ("revoked", "expired")
    INTERCEPT["mode"] = mode
    INTERCEPT["entered"].clear()
    INTERCEPT["release"].clear()

def wait_pending_off(page, timeout=12):
    stop = time.monotonic() + timeout
    while time.monotonic() < stop:
        if page.evaluate("!employeeAccountSavePending"):
            return True
        page.wait_for_timeout(80)
    return False

def run():
    br.require_env()
    br.reset()
    assert qa.dbstate() == {"revision": 0, "status": "active", "events": 0}
    server = br.ThreadingHTTPServer((br.HOST, br.PORT), DelayedSaveApi)
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
                blocked = []
                ctx_a = browser.new_context(locale="ko-KR", service_workers="block")
                a, err_a = qa.setup(ctx_a, blocked)
                qa.login(a, "가상관리자A")
                qa.open_dirty(a, "readonly", "A-ROLE-REVOKED-WHILE-SAVE")
                arm("revoked")
                qa.click_save(a)
                check(INTERCEPT["entered"].wait(10), "A actual UI save RPC arrives while server reply is held")
                check(a.evaluate("employeeAccountSavePending"),
                      "A browser keeps save pending during in-flight request")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "A no PostgreSQL write before authorization recheck")
                qa.ROSTER[0]["is_admin"] = False
                a.evaluate("loadEmployees()")
                check(a.evaluate("state.me.is_admin === false && !activeAdminMode()"),
                      "A latest synthetic roster revokes admin privilege during pending save")
                check(not a.evaluate("adminUnlockMatches(state.sessionToken)"),
                      "A second-PIN unlock invalidated while HTTP request is pending")
                check(a.locator("#employeeAccountNote").input_value() == "A-ROLE-REVOKED-WHILE-SAVE",
                      "A dirty unsaved input persists through role transition")
                check(a.locator("#adminTools").is_hidden(),
                      "A admin-only surface hidden before HTTP save completes")
                INTERCEPT["release"].set()
                check(wait_pending_off(a), "A delayed HTTP privilege denial clears pending state")
                check(a.evaluate("state.me && !activeAdminMode()"),
                      "A denial cannot restore privileges on late response")
                check(a.locator("#confirmEmployeeAccountBtn").is_disabled(),
                      "A save remains disabled after late forbidden response")
                check(a.locator("#employeeAccountNote").input_value() == "A-ROLE-REVOKED-WHILE-SAVE",
                      "A late denial does not erase draft")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "A delayed rejection leaves DB at revision zero with no audit events")

                # In a separate browser, B's stale expiry must not log out a NEW
                # A session after the app's explicit logout/login handoff.
                ctx_b = browser.new_context(locale="ko-KR", service_workers="block")
                b, err_b = qa.setup(ctx_b, blocked)
                qa.login(b, "가상관리자B")
                qa.open_dirty(b, "disabled", "B-EXPIRE-AFTER-NEW-LOGIN")
                arm("expired")
                qa.click_save(b)
                check(INTERCEPT["entered"].wait(10), "B save reaches server before session handoff")
                check(b.evaluate("employeeAccountSavePending"),
                      "B save remains in flight while old session logs out")
                b.evaluate("logout(false)")
                b.locator("#loginView").wait_for(state="visible", timeout=10000)
                check(b.evaluate("!state.sessionToken && !state.me"),
                      "B local logout removes old token before delayed server response")
                # This is a fresh login, with a different identity/token.
                qa.ROSTER[0]["is_admin"] = True  # A role regranted before fresh independent login
                qa.login(b, "가상관리자A")
                check(b.evaluate("state.me.employee_id===1 && state.sessionToken") == qa.A,
                      "new A login owns same Chromium page before B reply arrives")
                INTERCEPT["release"].set()
                b.wait_for_timeout(750)
                check(b.evaluate("state.me?.employee_id===1 && state.sessionToken") == qa.A,
                      "old B SESSION_EXPIRED response cannot terminate new A session")
                check(b.evaluate("activeAdminMode()"),
                      "new A's own second-PIN proof survives B's late rejection")
                check(b.locator("#appView").is_visible(),
                      "new A authenticated app remains visible after old B error")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "both delayed rejected saves produce zero SQL writes")
                check(len(INTERCEPT["requests"]) == len(INTERCEPT["replies"]) == 2
                      and [v["mode"] for v in INTERCEPT["requests"]] == ["revoked", "expired"]
                      and [v["actor"] for v in INTERCEPT["requests"]] == [qa.A, qa.B],
                      "exactly two expected synthetic writes were intercepted and rejected")
                check(not qa.MUTATIONS,
                      "no delayed request reached PostgreSQL CAS mutator")
                check(not [x for x in blocked if ".supabase.co" in x],
                      "no hosted Supabase request from either Chromium context")
                check(not err_a and not err_b, "no uncaught JS errors in both browsers")
                print(f"INFLIGHT_SCOPE_PASS {len(CHECKS)} scoped assertions; synthetic authority gate only, NOT original RPC or Auth E2E", flush=True)
            finally:
                INTERCEPT["release"].set()
                browser.close()
    finally:
        INTERCEPT["release"].set()
        site.terminate()
        try:
            site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:
            site.kill()
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    run()

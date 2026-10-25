#!/usr/bin/env python3
"""Scoped Chromium regression: forced OWN-login-PIN gate during in-flight admin SAVE.
All personnel, token/PIN validation and delayed HTTP responses are SYNTHETIC.
Never contacts real Supabase, original Auth/RLS or production PostgreSQL.
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
spec = importlib.util.spec_from_file_location("qa_pin_admin", HERE / "browser-two-admin-account-cas.py")
qa = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa
spec.loader.exec_module(qa)
br = qa.br
CHECKS = []
HOLD = {"entered": threading.Event(), "release": threading.Event(),
        "mode": "", "arrivals": [], "returns": [], "pin_attempts": 0}
GATE_LOCK = threading.Lock()

def check(ok, label):
    if not ok:
        raise AssertionError(label)
    CHECKS.append(label)
    print("PIN_GATE_PASS " + label, flush=True)

class PinGateSyntheticApi(qa.TwoAdminFakeApi):
    def do_POST(self):
        name = urlsplit(self.path).path
        if name == "/rest/v1/rpc/change_own_pin_v2":
            if (self.headers.get("Origin") != "http://127.0.0.1:54330" or
                self.headers.get("apikey") != br.KEY or
                self.headers.get("Authorization") != "Bearer " + br.KEY):
                return self.reply(403, {"message": "QA_LOCAL_ONLY"})
            length = self.headers.get("Content-Length", "")
            if not length.isdecimal() or int(length) > 8192:
                return self.reply(413, {"message": "QA_BAD_LENGTH"})
            try:
                data = json.loads(self.rfile.read(int(length)))
            except Exception:
                return self.reply(400, {"message": "QA_BAD_JSON"})
            if (set(data) != {"p_token", "p_current_pin", "p_new_pin"} or
                data.get("p_token") != qa.A or
                data.get("p_current_pin") != "0000" or
                data.get("p_new_pin") != "2468"):
                return self.reply(400, {"message": "QA_WRONG_PIN_REQUEST"})
            with GATE_LOCK:
                HOLD["pin_attempts"] += 1
            # The synthetic PIN update must NOT execute against PostgreSQL.
            return self.reply(403, {"code": "P0001", "message": "CURRENT_PIN_INVALID"})
        if name != "/rest/v1/rpc/admin_set_employee_account_status_v3":
            return super().do_POST()
        if (self.headers.get("Origin") != "http://127.0.0.1:54330" or
            self.headers.get("apikey") != br.KEY or
            self.headers.get("Authorization") != "Bearer " + br.KEY):
            return self.reply(403, {"message": "QA_LOCAL_ONLY"})
        length = self.headers.get("Content-Length", "")
        if not length.isdecimal() or not (0 < int(length) <= 8192):
            return self.reply(413, {"message": "QA_BAD_LENGTH"})
        try:
            data = json.loads(self.rfile.read(int(length)))
        except Exception:
            return self.reply(400, {"message": "QA_BAD_JSON"})
        if (not isinstance(data, dict) or
            set(data) != {"p_token", "p_employee_id", "p_account_status",
                         "p_effective_date", "p_note", "p_expected", "p_expected_revision"} or
            data.get("p_token") not in (qa.A, qa.B) or
            data.get("p_employee_id") != 2 or
            not isinstance(data.get("p_expected"), dict)):
            return self.reply(400, {"message": "QA_BAD_ACCOUNT_RPC"})
        mode = HOLD["mode"]
        if mode not in ("same-session", "old-session"):
            return self.reply(409, {"message": "QA_TEST_NOT_ARMED"})
        with GATE_LOCK:
            HOLD["arrivals"].append((mode, data["p_token"]))
        HOLD["entered"].set()
        if not HOLD["release"].wait(timeout=20):
            return self.reply(503, {"message": "QA_TIMEOUT"})
        with GATE_LOCK:
            HOLD["returns"].append((mode, data["p_token"]))
        # Simulate the ORIGINAL server denying old login-PIN credentials before
        # any SQL writer is called. No original backend is exercised here.
        return self.reply(403, {"code": "P0001", "message": "INITIAL_PIN_CHANGE_REQUIRED"})

def arm(mode):
    HOLD["mode"] = mode
    HOLD["entered"].clear()
    HOLD["release"].clear()

def wait_browser(page, event, timeout=12):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if event.is_set():
            return True
        page.wait_for_timeout(80)
    return event.is_set()

def await_page_condition(page, predicate, timeout=12):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if page.evaluate(predicate):
            return True
        page.wait_for_timeout(80)
    return bool(page.evaluate(predicate))

def run():
    br.require_env()
    br.reset()
    check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
          "synthetic PostgreSQL begins unchanged")
    server = br.ThreadingHTTPServer((br.HOST, br.PORT), PinGateSyntheticApi)
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
                outside = []
                ca = browser.new_context(locale="ko-KR", service_workers="block")
                a, errors_a = qa.setup(ca, outside)
                qa.login(a, "가상관리자A")
                qa.open_dirty(a, "readonly", "PIN-REQUIRED-WHILE-SAVING")
                check(a.evaluate("!state.initialPinRequired && activeAdminMode()"),
                      "A starts as unlocked administrator with normal app access")
                arm("same-session")
                qa.click_save(a)
                check(wait_browser(a, HOLD["entered"]),
                      "A actual SAVE RPC starts before forced PIN requirement is returned")
                check(a.evaluate("employeeAccountSavePending"),
                      "A save remains pending while server rechecks login PIN")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "server hold causes zero SQL write")
                HOLD["release"].set()
                a.locator("#initialPinBackdrop.open").wait_for(state="visible", timeout=15000)
                check(a.evaluate("state.initialPinRequired === true"),
                      "late server INITIAL_PIN_CHANGE_REQUIRED enables mandatory PIN gate")
                check(a.locator("#appView").is_hidden(),
                      "forced PIN gate hides authenticated app UI")
                check(a.locator("#adminTools").is_hidden(),
                      "forced gate hides previous manager tools")
                check(a.locator("#initialPinBackdrop").is_visible(),
                      "user receives visible mandatory own-PIN change dialog")
                check(a.evaluate("!state.initialPinRequired || !activeAdminMode()"),
                      "gate removes ability to use active manager mode")
                token = a.evaluate("state.sessionToken")
                mutation_result = a.evaluate("""async () => {
                  try {
                    await rpc('admin_set_employee_account_status_v3',
                              {p_token:state.sessionToken});
                    return 'UNEXPECTED_SENT';
                  } catch(e) { return String(e?.message || ''); }
                }""")
                check("INITIAL_PIN_CHANGE_REQUIRED" in mutation_result,
                      "new protected mutation is stopped client-side before network")
                check(len(HOLD["arrivals"]) == 1,
                      "no additional account-change HTTP request escapes PIN gate")
                check(a.evaluate("state.sessionToken") == token,
                      "forced PIN gate retains correct same-session identity for PIN change")
                a.locator("#initialPinChangeBtn").click()
                a.locator("#selfPinBackdrop.open").wait_for(state="visible", timeout=12000)
                check(a.locator("#selfPinBackdrop").is_visible(),
                      "mandatory PIN change opens actual own-PIN form")
                a.locator("#selfPinCurrent").fill("0000")
                a.locator("#selfPinNew").fill("2468")
                a.locator("#selfPinConfirm").fill("2468")
                a.locator("#saveSelfPinBtn").click()
                check(await_page_condition(a, "document.querySelector('#selfPinError').textContent.includes('현재 비밀번호')"),
                      "rejected synthetic own-PIN change visibly reports incorrect current PIN")
                check(HOLD["pin_attempts"] == 1,
                      "only allowlisted own-PIN change may reach fake server while forced gate active")
                check(a.evaluate("state.initialPinRequired"),
                      "rejected own-PIN change does not bypass mandatory gate")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0},
                      "PIN-gated edit cannot mutate synthetic employee data")

                # A new browser starts B's save, logs out, logs in again as A,
                # then receives B's stale PIN-required error. It must belong to B.
                cb = browser.new_context(locale="ko-KR", service_workers="block")
                b, errors_b = qa.setup(cb, outside)
                qa.login(b, "가상관리자B")
                qa.open_dirty(b, "disabled", "STALE-PIN-REQUIREMENT")
                arm("old-session")
                qa.click_save(b)
                check(wait_browser(b, HOLD["entered"]),
                      "B save is in flight before old-session PIN-required response")
                b.evaluate("logout(false)")
                b.locator("#loginView").wait_for(state="visible", timeout=12000)
                check(b.evaluate("!state.sessionToken && !state.me"),
                      "logout clears B token before old RPC response")
                qa.login(b, "가상관리자A")
                check(b.evaluate("state.sessionToken") == qa.A,
                      "fresh A login owns the browser before old B response")
                HOLD["release"].set()
                check(await_page_condition(b, "!employeeAccountSavePending"),
                      "old B save handler settles after delayed PIN error")
                b.wait_for_timeout(300)
                check(b.evaluate("state.sessionToken") == qa.A and
                      b.evaluate("state.me?.employee_id") == 1,
                      "old B forced-PIN response cannot replace fresh A identity")
                check(not b.evaluate("state.initialPinRequired"),
                      "old B PIN-required response cannot gate new A")
                check(b.evaluate("activeAdminMode()") and b.locator("#appView").is_visible(),
                      "fresh A retains own secondary administrator unlock and app view")
                check(len(HOLD["arrivals"]) == len(HOLD["returns"]) == 2
                      and HOLD["arrivals"] == [("same-session", qa.A), ("old-session", qa.B)],
                      "exactly two expected synthetic account SAVE requests were denied")
                check(qa.dbstate() == {"revision": 0, "status": "active", "events": 0}
                      and not qa.MUTATIONS,
                      "both refused account writes and PIN denial cause zero SQL changes")
                check(not any(".supabase.co" in x for x in outside),
                      "no browser request reached original hosted Supabase")
                check(not errors_a and not errors_b,
                      "two Chromium contexts have no uncaught JavaScript errors")
                print(f"PIN_GATE_SCOPE_PASS {len(CHECKS)} scoped assertions; mock PIN response and dummy DB only; NOT original Auth/RLS E2E", flush=True)
            finally:
                HOLD["release"].set()
                browser.close()
    finally:
        HOLD["release"].set()
        site.terminate()
        try:
            site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:
            site.kill()
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    run()

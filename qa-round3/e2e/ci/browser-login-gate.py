#!/usr/bin/env python3
"""Real Chromium, full production-shaped QA HTML, strict fake loopback API.
Browser/UI scoped only: NOT an authenticated Supabase/PostgREST or database E2E.
"""
import json
import os
import re
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
QA_PAGE_PORT, API_PORT = 54330, 54321
SYNTHETIC_NAME = "가상직원"
SYNTHETIC_TOKEN = "22222222-2222-4222-8222-222222222222"
# Intentionally not a real hosted Supabase key.
SYNTHETIC_KEY = "sb_publishable_QA_FAKE_BROWSER_ONLY_123456789"
seen = []

class QAHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return
    def answer(self, code, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:54330")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "apikey, authorization, content-type")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self):
        self.answer(200, {})
    def do_POST(self):
        path = urlsplit(self.path).path
        if not path.startswith("/rest/v1/rpc/"):
            return self.answer(404, {"message": "QA_API_ONLY"})
        name = path.rsplit("/", 1)[-1]
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 <= length <= 2048:
                return self.answer(413, {"message": "QA_LIMIT"})
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self.answer(400, {"message": "QA_BAD_REQUEST"})
        if self.headers.get("apikey") != SYNTHETIC_KEY:
            return self.answer(403, {"message": "QA_FAKE_KEY_REQUIRED"})
        seen.append((name, payload))
        if name in ("login_employee_personnel_v1", "login_employee"):
            if payload.get("p_name") == SYNTHETIC_NAME and payload.get("p_pin") == "1234":
                return self.answer(200, [{
                    "token": SYNTHETIC_TOKEN, "employee_id": 2,
                    "display_name": SYNTHETIC_NAME,
                    "category": "일근(사무)", "group_code": "DAY",
                    "is_admin": False, "expires_at": "2035-01-01T00:00:00Z"
                }])
            return self.answer(200, [{"display_name": "__INVALID_LOGIN__", "is_admin": False}])
        if name == "initial_pin_status_v1":
            if payload.get("p_token") != SYNTHETIC_TOKEN:
                return self.answer(403, {"message": "QA_INVALID_TOKEN"})
            return self.answer(200, True)
        # Fail-closed: never invent full Supabase functional coverage.
        return self.answer(404, {"message": "QA_RPC_NOT_IMPLEMENTED"})

def verify_loopback_up():
    import urllib.request
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:54330/", timeout=1) as r:
                if r.status != 200:
                    raise AssertionError("non-200 local QA HTML")
                page = r.read().decode()
                assert 'workmoa-environment" content="local-synthetic-qa"' in page
                assert not re.search(r"https?://[a-z0-9]{20}\.supabase\.co", page, re.I)
                assert SYNTHETIC_KEY in page
                return
        except OSError:
            time.sleep(.1)
    raise RuntimeError("QA localhost page server failed to start")

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print("PASS real Chromium: " + message, flush=True)

def main():
    if os.getenv("GITHUB_REPOSITORY") != "eco-i/eco-i.github.io" or os.getenv("GITHUB_REF") != "refs/heads/qa-3-8":
        raise RuntimeError("QA-only GitHub Actions branch required")
    for secret in ("SUPABASE_ACCESS_TOKEN", "SUPABASE_DB_PASSWORD", "SUPABASE_URL", "QA_SUPABASE_URL", "QA_SUPABASE_ANON_KEY"):
        if os.getenv(secret):
            raise RuntimeError("Unexpected cloud credential or remote Supabase config")
    env = dict(os.environ)
    env.update({
        "LOCAL_QA_ONLY": "YES", "LOCAL_QA_KEYS_CONFIRMED": "YES",
        "LOCAL_SUPABASE_URL": "http://127.0.0.1:54321",
        "LOCAL_SUPABASE_ANON_KEY": SYNTHETIC_KEY
    })
    build = subprocess.run(["node", str(ROOT / "qa-round3/e2e/prepare-local-qa-site.mjs")],
                           cwd=ROOT, env=env, capture_output=True, text=True, timeout=20)
    if build.returncode:
        raise RuntimeError("Fail-closed QA HTML builder did not accept synthetic environment: " + build.stderr)
    m = re.search(r"(?m)^LOCAL QA READY: (.+)$", build.stdout)
    if not m or not Path(m.group(1)).is_dir():
        raise RuntimeError("Local synthetic QA site directory missing")
    page_dir = Path(m.group(1))
    rpc = ThreadingHTTPServer(("127.0.0.1", API_PORT), QAHandler)
    rpc_thread = threading.Thread(target=rpc.serve_forever, daemon=True)
    rpc_thread.start()
    site = subprocess.Popen(["node", str(ROOT / "qa-round3/e2e/serve-local-qa-site.mjs"), str(page_dir)],
                            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    try:
        verify_loopback_up()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            try:
                context = browser.new_context(locale="ko-KR", service_workers="block")
                page = context.new_page()
                forbidden = []
                denied = []
                def route_gate(route):
                    url = route.request.url
                    u = urlsplit(url)
                    if u.scheme in ("http", "https", "ws", "wss") and u.hostname == "127.0.0.1" and u.port in (QA_PAGE_PORT, API_PORT):
                        return route.continue_()
                    # All non-local traffic blocked at browser routing even though CSP also restricts.
                    denied.append(urlsplit(url).hostname or u.scheme)
                    if re.search(r"\.supabase\.co(?:/|$)", url, re.I) or "github" in url:
                        forbidden.append(url)
                    return route.abort()
                page.route("**/*", route_gate)
                page.goto("http://127.0.0.1:54330/", wait_until="domcontentloaded", timeout=30000)
                page.locator("#loginBtn").wait_for(state="visible", timeout=10000)
                check(page.title().startswith("[로컬 QA 전용]"), "real complete QA HTML renders with unmistakable local-only title")
                check(not forbidden, "no outbound production-host or GitHub browser request permitted")

                # Invalid PIN: only front-end validation; must not transmit to fake backend.
                page.locator("#loginName").fill(SYNTHETIC_NAME)
                page.locator("#loginPin").fill("12")
                page.locator("#loginBtn").click()
                page.locator("#loginError").get_by_text("로그인 이름과 4자리 비밀번호를 입력해 주세요.").wait_for(timeout=10000)
                check(not seen, "invalid PIN blocked before any network RPC")

                # Server response is deliberately synthetic, not genuine PostgREST or auth.
                page.locator("#loginPin").fill("9999")
                page.locator("#loginBtn").click()
                page.locator("#loginError").get_by_text("성명 또는 비밀번호를 확인해 주세요.").wait_for(timeout=10000)
                check(sum(n == "login_employee_personnel_v1" for n,_ in seen) == 1,
                      "fake backend rejected invalid credentials; app remained on login screen")
                check("hidden" in page.locator("#appView").get_attribute("class").split(),
                      "synthetic invalid login did not open protected app view")

                # Successfully shaped synthetic login then genuine app initial PIN gate.
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#initialPinBackdrop.open").wait_for(timeout=20000)
                check(sum(n == "initial_pin_status_v1" for n,_ in seen) >= 1,
                      "real login UI consulted synthetic PIN-required RPC before opening a gate")
                check("hidden" in page.locator("#appView").get_attribute("class").split(),
                      "initial PIN required gate keeps protected app content hidden")
                check(page.locator("#initialPinChangeBtn").is_visible(),
                      "mandatory PIN change control is visible in Chromium")
                check(not forbidden, "no remote production Supabase requests during all login flows")
                check(all(n in ("login_employee_personnel_v1", "login_employee", "initial_pin_status_v1") for n,_ in seen),
                      "browser never invoked an unexpected API route in this scoped flow")
                print("BROWSER_UI_SCOPED_PASS: actual full HTML login and mandatory PIN gate; "
                      "backend fake, no real authentication or database E2E", flush=True)
            finally:
                browser.close()
    finally:
        site.terminate()
        try: site.communicate(timeout=4)
        except subprocess.TimeoutExpired: site.kill()
        rpc.shutdown()
        rpc.server_close()

if __name__ == "__main__":
    main()

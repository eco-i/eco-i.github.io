#!/usr/bin/env python3
"""QA full HTML in Chromium -> loopback-only HTTP bridge -> real disposable PostgreSQL.
This is not Supabase Auth/PostgREST, RLS or authenticated form-level E2E.
"""
import json, os, re, subprocess, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
from psycopg.types.json import Jsonb
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[3]
HOST="127.0.0.1"; PORT=54321; WEB=54330
KEY="sb_publishable_QA_FAKE_BROWSER_ONLY_123456789"
WORKER="22222222-2222-4222-8222-222222222222"
ADMIN="11111111-1111-4111-8111-111111111111"
DATE="2027-05-13"
INITIAL={"periods":[],"overrides":[],"holidays":[{"date":DATE,"title":"합성 휴일"}],"excludedHolidays":[]}
REMOVED={"periods":[],"overrides":[],"holidays":[],"excludedHolidays":[]}
HITS=[]

def require_env():
    assert os.getenv("GITHUB_REPOSITORY")=="eco-i/eco-i.github.io"
    assert os.getenv("GITHUB_REF")=="refs/heads/qa-3-8"
    for k,v in {"PGHOST":HOST,"PGPORT":"5432","PGUSER":"qa_runner","PGDATABASE":"qa_round3","PGPASSWORD":"synthetic_ci_only_not_a_real_secret"}.items():
        assert os.getenv(k)==v, "FAIL_CLOSED_PG_"+k
    for k in ("DATABASE_URL","SUPABASE_URL","SUPABASE_ACCESS_TOKEN","SUPABASE_DB_PASSWORD","QA_SUPABASE_URL","QA_SUPABASE_ANON_KEY"):
        assert not os.getenv(k), "FAIL_CLOSED_REMOTE_"+k

def connect():
    return psycopg.connect(host=HOST,port=5432,user="qa_runner",dbname="qa_round3",
                           password="synthetic_ci_only_not_a_real_secret",connect_timeout=3,
                           options="-c statement_timeout=15000")

def value(sql,args=()):
    with connect() as c:
        with c.cursor() as cur:
            cur.execute(sql,args)
            return cur.fetchone()[0]

def reset():
    with connect() as c:
        c.execute("TRUNCATE public.holiday_work_entries, public.audit_logs RESTART IDENTITY")
        c.execute("UPDATE public.maintenance_schedule_state SET revision=0,data=%s",(Jsonb(INITIAL),))

def snapshot():
    return {"count":value("SELECT count(*) FROM public.holiday_work_entries"),
            "revision":value("SELECT revision FROM public.maintenance_schedule_state WHERE id=1")}

class Gateway(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def reply(self,status,data):
        b=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        for k,v in {"Content-Type":"application/json; charset=utf-8",
                    "Access-Control-Allow-Origin":"http://127.0.0.1:54330",
                    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
                    "Access-Control-Allow-Methods":"OPTIONS, POST",
                    "Cache-Control":"no-store","Content-Length":str(len(b))}.items():
            self.send_header(k,v)
        self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        if self.headers.get("Origin")!="http://127.0.0.1:54330":
            return self.reply(403,{"message":"QA_ORIGIN_DENIED"})
        self.reply(200,{})
    def do_POST(self):
        if (self.headers.get("Origin")!="http://127.0.0.1:54330"
            or self.headers.get("apikey")!=KEY or self.headers.get("Authorization")!="Bearer "+KEY):
            return self.reply(403,{"message":"QA_REQUEST_DENIED"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or int(length)>4096:
            return self.reply(413,{"message":"QA_BODY_DENIED"})
        try: data=json.loads(self.rfile.read(int(length)) or b"{}")
        except Exception: return self.reply(400,{"message":"QA_BAD_JSON"})
        prefix="/rest/v1/rpc/"
        path=urlsplit(self.path).path
        if not path.startswith(prefix) or "/" in path[len(prefix):]:
            return self.reply(404,{"message":"QA_PATH_DENIED"})
        name=path[len(prefix):]
        HITS.append(name)
        try:
            if name=="login_employee_personnel_v1":
                if data=={"p_name":"가상직원","p_pin":"1234","p_admin_pin":None}:
                    return self.reply(200,[{"token":WORKER,"employee_id":2,"display_name":"가상직원",
                        "category":"일근(사무)","group_code":"DAY","is_admin":False,
                        "expires_at":"2035-01-01T00:00:00Z"}])
                return self.reply(200,[{"display_name":"__INVALID_LOGIN__","is_admin":False}])
            if name=="initial_pin_status_v1":
                return self.reply(200,data=={"p_token":WORKER})
            if name=="save_my_holiday_work":
                if data not in (
                    {"p_token":WORKER,"p_date":DATE,"p_start_time":"09:00","p_end_time":"18:00"},
                    {"p_token":ADMIN,"p_date":DATE,"p_start_time":"09:00","p_end_time":"18:00"}):
                    return self.reply(400,{"message":"QA_NON_SYNTHETIC_WORK_DENIED"})
                r=value("SELECT public.save_my_holiday_work(%s::uuid,%s::date,%s::time,%s::time)",
                        (data["p_token"],DATE,"09:00","18:00"))
                return self.reply(200,r)
            if name=="admin_save_maintenance_schedule":
                if (not isinstance(data,dict) or set(data)!={"p_token","p_expected_revision","p_data"}
                    or data["p_token"]!=ADMIN or type(data["p_expected_revision"]) is not int
                    or data["p_expected_revision"] not in (0,1) or data["p_data"] not in (INITIAL,REMOVED)):
                    return self.reply(400,{"message":"QA_NON_SYNTHETIC_SCHEDULE_DENIED"})
                r=value("SELECT public.admin_save_maintenance_schedule(%s::uuid,%s::bigint,%s::jsonb)",
                        (ADMIN,data["p_expected_revision"],Jsonb(data["p_data"])))
                return self.reply(200,r)
            return self.reply(404,{"message":"QA_RPC_NOT_IMPLEMENTED"})
        except psycopg.Error as e:
            msg=str(e).splitlines()[0]
            if msg in ("SYNTHETIC_INVALID_SESSION","NOT_HOLIDAY",
                       "STALE_MAINTENANCE_SCHEDULE","HOLIDAY_WORK_HISTORY_CONFLICT"):
                return self.reply(409,{"message":msg})
            return self.reply(500,{"message":"QA_DB_ERROR"})

def build():
    env=dict(os.environ,LOCAL_QA_ONLY="YES",LOCAL_QA_KEYS_CONFIRMED="YES",
             LOCAL_SUPABASE_URL="http://127.0.0.1:54321",LOCAL_SUPABASE_ANON_KEY=KEY)
    p=subprocess.run(["node",str(ROOT/"qa-round3/e2e/prepare-local-qa-site.mjs")],
                     cwd=ROOT,env=env,capture_output=True,text=True,check=True,timeout=20)
    m=re.search(r"(?m)^LOCAL QA READY: (.+)$",p.stdout)
    assert m and Path(m[1]).is_dir()
    return m[1]

def wait_for_web():
    import urllib.request
    for i in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:54330/",timeout=1) as x:
                html=x.read().decode()
                assert 'workmoa-environment" content="local-synthetic-qa"' in html
                assert "http://127.0.0.1:54321" in html
                return
        except OSError: time.sleep(.1)
    raise AssertionError("Synthetic local web server unavailable")

def assert_pass(ok,text):
    assert ok,text
    print("PASS browser-to-PostgreSQL: "+text,flush=True)

def api(page,name,body):
    # Real Chromium fetch transport from unchanged original HTML origin, but
    # not through the app's privileged form handler or Supabase/PostgREST.
    return page.evaluate("""async ({name,body}) => {
      const r=await fetch('http://127.0.0.1:54321/rest/v1/rpc/'+name,{
        method:'POST',headers:{apikey:SUPABASE_ANON_KEY,
          Authorization:'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json'},
        body:JSON.stringify(body)});
      return {code:r.status,data:await r.json()};
    }""",{"name":name,"body":body})

def app_rpc_guard(page):
    return page.evaluate("""async ()=>{
      try {
        await rpc('save_my_holiday_work',{
          p_token:'22222222-2222-4222-8222-222222222222',
          p_date:'2027-05-13',p_start_time:'09:00',p_end_time:'18:00'});
        return 'UNEXPECTED_WRITE';
      } catch(e){return String(e?.message||e);}
    }""")

def main():
    require_env();reset()
    folder=build()
    gateway=ThreadingHTTPServer((HOST,PORT),Gateway)
    threading.Thread(target=gateway.serve_forever,daemon=True).start()
    server=subprocess.Popen(["node",str(ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
                            cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page();outside=[]
                def allow(route):
                    u=urlsplit(route.request.url)
                    if u.hostname==HOST and u.scheme in ("http","ws") and u.port in (PORT,WEB):
                        return route.continue_()
                    outside.append(route.request.url)
                    return route.abort()
                page.route("**/*",allow)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginBtn").wait_for(state="visible")
                assert_pass(page.title().startswith("[로컬 QA 전용]"),
                            "actual complete QA HTML rendered under network-isolated Chromium")
                assert_pass(app_rpc_guard(page)!="UNEXPECTED_WRITE" and
                            "save_my_holiday_work" not in HITS and snapshot()["count"]==0,
                            "actual app RPC refuses mutation before login, no SQL write")
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#initialPinBackdrop.open").wait_for(timeout=15000)
                assert_pass(page.locator("#appView.hidden").count()==1,
                            "app login with synthetic HTTP response remains PIN-gated")
                prev=HITS.count("save_my_holiday_work")
                assert_pass(app_rpc_guard(page)!="UNEXPECTED_WRITE" and
                            HITS.count("save_my_holiday_work")==prev,
                            "actual app RPC denies mutation during mandatory PIN change")
                req={"p_token":WORKER,"p_date":DATE,"p_start_time":"09:00","p_end_time":"18:00"}
                invalid=api(page,"save_my_holiday_work",dict(req,p_token=ADMIN))
                assert_pass(invalid["code"]==409 and
                            invalid["data"]["message"]=="SYNTHETIC_INVALID_SESSION" and
                            snapshot()["count"]==0,
                            "Chromium HTTP to real SQL rejects synthetic invalid session")
                ok=api(page,"save_my_holiday_work",req)
                assert_pass(ok["code"]==200 and type(ok["data"]) is int and
                            snapshot()["count"]==1,
                            "Chromium HTTP to original QA SQL commits a synthetic holiday row")
                sched={"p_token":ADMIN,"p_expected_revision":0,"p_data":REMOVED}
                rejected=api(page,"admin_save_maintenance_schedule",sched)
                assert_pass(rejected["code"]==409 and
                            rejected["data"]["message"]=="HOLIDAY_WORK_HISTORY_CONFLICT" and
                            snapshot()=={"count":1,"revision":0},
                            "holiday declassification HTTP request blocked, DB history preserved")
                with connect() as db:
                    db.execute("DELETE FROM public.holiday_work_entries WHERE work_date=%s",(DATE,))
                changed=api(page,"admin_save_maintenance_schedule",sched)
                assert_pass(changed["code"]==200 and changed["data"]["revision"]==1 and
                            snapshot()["revision"]==1,
                            "Chromium HTTP request updates actual QA schedule SQL revision")
                bad=api(page,"save_my_holiday_work",req)
                assert_pass(bad["code"]==409 and bad["data"]["message"]=="NOT_HOLIDAY" and
                            snapshot()["count"]==0,
                            "reclassified holiday rejects actual SQL work insertion")
                stale=api(page,"admin_save_maintenance_schedule",sched)
                assert_pass(stale["code"]==409 and
                            stale["data"]["message"]=="STALE_MAINTENANCE_SCHEDULE" and
                            snapshot()["revision"]==1,
                            "stale revision rejected via Chromium HTTP to real QA SQL")
                hosts=sorted({urlsplit(url).hostname or "unknown" for url in outside})
                print("BLOCKED_EXTERNAL_HOSTS: "+",".join(hosts),flush=True)
                assert_pass(not any((host.endswith(".supabase.co") or host=="supabase.co")
                                    for host in hosts),
                            "no production or other hosted Supabase browser request attempted")
                assert_pass(all(host in ("cdn.jsdelivr.net",) for host in hosts),
                            "every attempted outside-origin request was blocked; only known script CDN attempted")
                print("SQL_HTTP_BRIDGE_SCOPED_PASS; original app UI and real PG connected via "+
                      "synthetic gateway, not authenticated app form or real Supabase E2E",flush=True)
            finally: browser.close()
    finally:
        server.terminate()
        try: server.communicate(timeout=4)
        except subprocess.TimeoutExpired: server.kill()
        gateway.shutdown();gateway.server_close()

if __name__=="__main__":
    main()

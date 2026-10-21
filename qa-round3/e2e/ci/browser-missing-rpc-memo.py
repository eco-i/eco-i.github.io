#!/usr/bin/env python3
"""Run the genuine workmoa memo save UI against an intentionally absent RPC.
PostgREST-like PGRST202 is simulated ONLY on loopback, backed by an empty
disposable PostgreSQL memo table for before/after zero-write verification.
No production SQL, Auth, RLS, account, or employee data is touched.
"""
import importlib.util
import json
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("qa_attendance_fixture",HERE/"browser-attendance-form.py")
fixture=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=fixture
spec.loader.exec_module(fixture)
br=fixture.br

MISSING_REQUESTS=[]
MEMO_READS=[]
MEMO_DAY="2027-05-13"
MEMO_TEXT="격리 시험 메모: 저장실패 시 초안 보존 확인"

class MissingMemoBridge(fixture.AttendanceBridge):
    def do_POST(self):
        url=urlsplit(self.path).path
        name=url.removeprefix("/rest/v1/rpc/")
        if name not in ("list_my_memos","save_my_memo_v2"):
            return super().do_POST()
        if (url!="/rest/v1/rpc/"+name or
            self.headers.get("Origin")!="http://127.0.0.1:54330" or
            self.headers.get("apikey")!=br.KEY or
            self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_DENIED"})
        ln=self.headers.get("Content-Length","")
        if not ln.isdecimal() or int(ln)>4096:
            return self.reply(413,{"message":"QA_BODY_LIMIT"})
        try: data=json.loads(self.rfile.read(int(ln)) or b"{}")
        except Exception: return self.reply(400,{"message":"QA_BAD_JSON"})
        if not isinstance(data,dict) or data.get("p_token")!=br.WORKER:
            return self.reply(403,{"message":"QA_WRONG_SESSION"})
        br.HITS.append(name)
        if name=="list_my_memos":
            if set(data)!={"p_token","p_from","p_to"}:
                return self.reply(400,{"message":"QA_BAD_MEMO_READ"})
            MEMO_READS.append(data)
            rows=br.value("""SELECT coalesce(json_agg(json_build_object(
                'id',id,'memo_date',memo_date,'memo_text',memo_text,
                'updated_at',updated_at)),'[]'::json)
                FROM public.qa_memo_entries
                WHERE employee_id=2 AND (%s::date IS NULL OR memo_date >= %s::date)
                  AND (%s::date IS NULL OR memo_date <= %s::date)""",
                  (data["p_from"],data["p_from"],data["p_to"],data["p_to"]))
            return self.reply(200,rows)
        if set(data)!={"p_token","p_date","p_text","p_expected"} or (
            data["p_date"]!=MEMO_DAY or data["p_text"]!=MEMO_TEXT or
            data["p_expected"] is not None):
            return self.reply(400,{"message":"QA_BAD_MISSING_RPC_CALL"})
        MISSING_REQUESTS.append(data)
        # Genuine PostgREST missing-function *shape*, not a live PostgREST response.
        return self.reply(404,{
            "code":"PGRST202","details":None,"hint":None,
            "message":"Could not find the function public.save_my_memo_v2 in the schema cache"
        })

def check(value,message):
    assert value,message
    print("PASS missing-memo-RPC: "+message,flush=True)

def main():
    br.require_env()
    br.reset()
    check(br.value("SELECT count(*) FROM public.qa_memo_entries")==0,
          "isolated PostgreSQL synthetic memo table empty before UI interaction")
    br.HITS.clear()
    gateway=br.ThreadingHTTPServer((br.HOST,br.PORT),MissingMemoBridge)
    threading.Thread(target=gateway.serve_forever,daemon=True).start()
    folder=br.build()
    server=br.subprocess.Popen(["node",str(br.ROOT/"qa-round3/e2e/serve-local-qa-site.mjs"),folder],
                               cwd=br.ROOT,stdout=br.subprocess.DEVNULL,stderr=br.subprocess.DEVNULL)
    try:
        br.wait_for_web()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                context=browser.new_context(locale="ko-KR",service_workers="block")
                page=context.new_page()
                js_errors=[]
                page.on("pageerror",lambda e:js_errors.append(str(e)[:300]))
                external=[]
                def route_gate(route):
                    uri=urlsplit(route.request.url)
                    if uri.hostname==br.HOST and uri.port in (br.PORT,br.WEB) and uri.scheme in ("http","ws"):
                        return route.continue_()
                    external.append(route.request.url)
                    route.abort()
                page.route("**/*",route_gate)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginBtn").wait_for(state="visible",timeout=15000)
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=5000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=5000)
                check(page.evaluate("state.me?.employee_id===2 && state.memoBackendReady===true"),
                      "genuine logged-in app has writable synthetic memo backend")
                page.evaluate("""async ()=>{state.year=2027;state.month=4;
                    await loadMonthData(true);openDetail('2027-05-13')}""")
                page.locator("#detailBackdrop.open").wait_for(timeout=10000)
                # Empty dates are auto-collapsed in the genuine UI.
                # Expand through the visible real memo section toggle before asserting Save.
                if not page.locator("#saveMemoBtn").is_visible():
                    page.locator("#memoDetailToggleBtn").click()
                if not (page.locator("#saveMemoBtn").is_visible() and
                        page.locator("#saveMemoBtn").is_enabled() and
                        not page.locator("#memoText").is_disabled()):
                    print("DIAG MEMO GATE "+str(page.evaluate("""()=>({
                      view:state.view, selected:state.selectedDate,
                      memoReady:state.memoBackendReady,
                      personnelReady:state.personnelBackendReady,
                      accountReady:state.accountStatusBackendReady,
                      memoSectionClass:document.getElementById('memoDetailSection').className,
                      dateWritable:memoDateWritable(state.selectedDate),
                      personnelWritable:personnelMutationReady(),
                      accountReadOnly:accountReadOnly(),
                      saveHidden:document.getElementById('saveMemoBtn').className,
                      saveDisabled:document.getElementById('saveMemoBtn').disabled,
                      memoReadOnly:document.getElementById('memoText').readOnly,
                      memoMessage:document.getElementById('memoDetailError').textContent,
                      selectedMonth:state.month,employee:myEmployeeRecord()
                    })""")),flush=True)
                check(page.locator("#saveMemoBtn").is_visible() and
                      page.locator("#saveMemoBtn").is_enabled() and
                      page.locator("#memoText").is_editable(),
                      "real memo edit field and Save button are enabled")
                page.locator("#memoText").fill(MEMO_TEXT)
                page.evaluate("""()=>{window.__qaMemoClickCount=0;
                    document.getElementById('saveMemoBtn').addEventListener('click',
                     ()=>window.__qaMemoClickCount++,{capture:true})}""")
                check(br.value("SELECT count(*) FROM public.qa_memo_entries")==0,
                      "synthetic PostgreSQL contains no memo before click")
                page.locator("#saveMemoBtn").click()
                deadline=time.monotonic()+12
                while time.monotonic()<deadline:
                    if MISSING_REQUESTS and page.locator("#memoDetailError").text_content().strip():
                        break
                    time.sleep(.15)
                if not MISSING_REQUESTS:
                    print("DIAG hit_tail="+",".join(br.HITS[-25:]),flush=True)
                    print("DIAG memo_error="+repr(page.locator("#memoDetailError").text_content()),flush=True)
                    print("DIAG app="+str(page.evaluate("""()=>({
                      memoBackend:state.memoBackendReady, personnel:state.personnelBackendReady,
                      selected:state.selectedDate, memoText:document.getElementById('memoText').value,
                      action:state.me?.employee_id,view:state.view,
                      memoSavePending:memoSavePending, memoDateWritable:memoDateWritable(state.selectedDate),
                      personnelMutationReady:personnelMutationReady(), readonly:accountReadOnly(),
                      initialPinRequired:state.initialPinRequired,
                      saveDisabled:document.getElementById('saveMemoBtn').disabled,
                      editorOpen:document.getElementById('detailBackdrop').className,
                      toast:document.getElementById('toast').textContent,
                      loading:document.getElementById('loadingOverlay')?.className,
                      dirty:detailDirtyFlags(),
                      lifecycleReady:pageLifecycleWriteFreshnessReady()
                    })""")),flush=True)
                    print("DIAG JS errors="+str(js_errors[-5:]),flush=True)
                    print("DIAG REAL CLICKS="+str(page.evaluate("window.__qaMemoClickCount")),flush=True)
                    await_direct=page.evaluate("async ()=>{await saveSelectedDateMemo(); return {pending:memoSavePending,error:document.getElementById('memoDetailError').textContent}}")
                    print("DIAG direct-function result="+str(await_direct)+" RPCs="+",".join(br.HITS[-6:]),flush=True)
                check(len(MISSING_REQUESTS)==1,
                      "actual Save button dispatched exactly one missing save_my_memo_v2 RPC")
                page.wait_for_function("""()=>!memoSavePending && (
                   !!document.getElementById('memoDetailError').textContent.trim())""",timeout=15000)
                error=page.locator("#memoDetailError").text_content().strip()
                check(bool(error) and len(error)<600,
                      "visible real app error after PostgREST-shaped missing-function response")
                check(page.locator("#memoText").input_value()==MEMO_TEXT and
                      page.locator("#detailBackdrop.open").count()==1,
                      "unsaved memo text and open editor preserved after failed Save")
                check(page.locator("#saveMemoBtn").is_enabled(),
                      "save control re-enabled so user may retry once backend is repaired")
                check(br.value("SELECT count(*) FROM public.qa_memo_entries")==0,
                      "real isolated PostgreSQL holds zero memo writes after 404")
                check(page.evaluate("!state.memos.some(x=>x.memo_date==='2027-05-13')"),
                      "frontend did not falsely show memo as persisted")
                check(not any(".supabase.co" in u for u in external),
                      "no external Supabase request attempted from Chromium")
                print("MISSING_RPC_UI_NEGATIVE_PATH_SCOPED_PASS: real UI/error/draft retention; "+
                      "missing-function response synthesized, not operational PostgREST E2E",flush=True)
            finally:
                browser.close()
    finally:
        server.terminate()
        try:server.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:server.kill()
        gateway.shutdown()
        gateway.server_close()

if __name__=="__main__":
    main()

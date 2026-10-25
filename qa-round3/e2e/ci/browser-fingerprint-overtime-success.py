#!/usr/bin/env python3
"""Real full QA page + Chromium file chooser and overtime Save -> local bridge -> disposable PG.
Only fake employee/date/photo; not actual PostgREST, Android OS picker, or production E2E.
"""
import importlib.util
import io
import json
import struct
import sys
import threading
import time
import zlib
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("qa_attendance_bridge", HERE/"browser-attendance-form.py")
fixture=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=fixture
spec.loader.exec_module(fixture)
br=fixture.br
PHOTO_DATE="2026-10-21"
OT_DATE="2027-05-13"
PHOTO_HITS=[]
OVERTIME_HITS=[]

class ActionBridge(fixture.AttendanceBridge):
    def do_POST(self):
        path=urlsplit(self.path).path
        name=path.removeprefix("/rest/v1/rpc/")
        handled={"list_my_fingerprint_records","save_my_fingerprint_photo",
                 "list_overtime_entries","save_my_overtime_day_v2"}
        if name not in handled or path!="/rest/v1/rpc/"+name:
            return super().do_POST()
        if (self.headers.get("Origin")!="http://127.0.0.1:54330"
            or self.headers.get("apikey")!=br.KEY
            or self.headers.get("Authorization")!="Bearer "+br.KEY):
            return self.reply(403,{"message":"QA_FAKE_LOCAL_AUTH_REQUIRED"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or int(length)>205000:
            return self.reply(413,{"message":"QA_BODY_SIZE_DENIED"})
        try: data=json.loads(self.rfile.read(int(length)) or b"{}")
        except Exception: return self.reply(400,{"message":"QA_BAD_JSON"})
        if not isinstance(data,dict) or data.get("p_token")!=br.WORKER:
            return self.reply(403,{"message":"QA_WRONG_FAKE_IDENTITY"})
        br.HITS.append(name)
        try:
            if name=="list_my_fingerprint_records":
                if set(data)!={"p_token","p_from","p_to"}:
                    return self.reply(400,{"message":"QA_BAD_FINGERPRINT_READ_KEYS"})
                body=br.value("""SELECT COALESCE(json_agg(json_build_object(
                  'record_date',record_date,
                  'has_clock_in',clock_in_photo IS NOT NULL,
                  'has_clock_out',clock_out_photo IS NOT NULL,
                  'confirmed',confirmed,
                  'clock_in_uploaded_at',clock_in_uploaded_at,
                  'clock_out_uploaded_at',clock_out_uploaded_at,
                  'confirmed_at',confirmed_at,'updated_at',updated_at)), '[]'::json)
                  FROM public.qa_browser_fingerprint
                  WHERE employee_id=2 AND record_date BETWEEN %s::date AND %s::date""",
                  (data["p_from"],data["p_to"]))
                return self.reply(200,body)
            if name=="list_overtime_entries":
                if set(data)!={"p_token","p_employee_id","p_from","p_to"} or data["p_employee_id"]!=2:
                    return self.reply(400,{"message":"QA_BAD_OVERTIME_READ"})
                rows=br.value("""SELECT COALESCE(json_agg(json_build_object(
                  'id',id,'employee_id',employee_id,'work_date',work_date,
                  'slot',slot,'minutes',minutes,'completed',completed,
                  'updated_at',updated_at) ORDER BY CASE slot WHEN 'early' THEN 0 ELSE 1 END),'[]'::json)
                  FROM public.qa_browser_overtime WHERE employee_id=2
                  AND work_date BETWEEN %s::date AND %s::date""",
                  (data["p_from"],data["p_to"]))
                return self.reply(200,rows)
            if name=="save_my_overtime_day_v2":
                required={"p_token","p_work_date","p_early_minutes","p_early_completed",
                          "p_late_minutes","p_late_completed","p_expected"}
                if set(data)!=required or data["p_work_date"]!=OT_DATE:
                    return self.reply(400,{"message":"QA_BAD_OVERTIME_MUTATION"})
                result=br.value("""SELECT public.qa_browser_overtime_day(%s::uuid,%s::date,
                     %s::int,%s::boolean,%s::int,%s::boolean,%s::jsonb)""",
                    (br.WORKER,OT_DATE,data["p_early_minutes"],data["p_early_completed"],
                     data["p_late_minutes"],data["p_late_completed"],br.Jsonb(data["p_expected"])))
                OVERTIME_HITS.append(data["p_early_minutes"])
                return self.reply(200,result)
            required={"p_token","p_date","p_kind","p_base64","p_mime",
                      "p_filename","p_expected_updated_at"}
            if (set(data)!=required or data["p_date"]!=PHOTO_DATE
                or data["p_kind"] not in ("clock_in","clock_out")
                or data["p_mime"]!="image/jpeg"
                or len(data["p_base64"])>190000):
                return self.reply(400,{"message":"QA_BAD_PHOTO_MUTATION"})
            br.value("""SELECT public.qa_browser_fingerprint_save(%s::uuid,%s::date,
                     %s::text,%s::text,%s::timestamptz)""",
                    (br.WORKER,PHOTO_DATE,data["p_kind"],
                     data["p_base64"],data["p_expected_updated_at"]))
            PHOTO_HITS.append((data["p_kind"],len(data["p_base64"])))
            return self.reply(200,None)
        except br.psycopg.Error as e:
            desc=str(e).splitlines()[0]
            if desc in ("STALE_OVERTIME_DAY","STALE_FINGERPRINT"):
                return self.reply(409,{"code":"P0001","message":desc})
            print("QA_ONLY_BRIDGE_SQL_EXCEPTION_TYPE="+type(e).__name__,flush=True)
            return self.reply(400,{"message":"QA_SYNTHETIC_DB_REJECTED"})

def check(ok,label):
    assert ok,label
    print("PASS real-browser-photo-overtime: "+label,flush=True)

def make_png(w=400,h=280):
    def chunk(t,data):
        return struct.pack("!I",len(data))+t+data+struct.pack("!I",zlib.crc32(t+data)&0xffffffff)
    row=b"\x00"+bytes([140,170,190])*w
    raw=row*h
    return (b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack("!2I5B",w,h,8,2,0,0,0))
            +chunk(b"IDAT",zlib.compress(raw,6))+chunk(b"IEND",b""))

def open_date(page,date,year,month):
    page.evaluate("""async ({date,year,month})=>{
      state.year=year;state.month=month;
      await loadMonthData(true);openDetail(date);
    }""",{"date":date,"year":year,"month":month})
    page.locator("#detailBackdrop.open").wait_for(timeout=12000)

def main():
    br.require_env()
    br.reset()
    check(br.value("SELECT count(*) FROM public.qa_browser_overtime")==0 and
          br.value("SELECT count(*) FROM public.qa_browser_fingerprint")==0,
          "PG synthetic fingerprint and overtime records initially empty")
    br.HITS.clear()
    server=br.ThreadingHTTPServer((br.HOST,br.PORT),ActionBridge)
    threading.Thread(target=server.serve_forever,daemon=True).start()
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
                external=[];js_errors=[];overtime_list_network=[]
                page.on("pageerror",lambda e:js_errors.append(str(e)[:100]))
                page.on("request",lambda r:overtime_list_network.append("request") if urlsplit(r.url).path.endswith("/rest/v1/rpc/list_overtime_entries") else None)
                page.on("response",lambda r:overtime_list_network.append("response:"+str(r.status)) if urlsplit(r.url).path.endswith("/rest/v1/rpc/list_overtime_entries") else None)
                page.on("requestfailed",lambda r:overtime_list_network.append("failed") if urlsplit(r.url).path.endswith("/rest/v1/rpc/list_overtime_entries") else None)
                page.on("dialog",lambda d:d.accept())
                def gate(route):
                    u=urlsplit(route.request.url)
                    if u.scheme in ("http","ws") and u.hostname==br.HOST and u.port in (br.PORT,br.WEB):
                        return route.continue_()
                    external.append(route.request.url)
                    return route.abort()
                page.route("**/*",gate)
                page.goto("http://127.0.0.1:54330/",wait_until="domcontentloaded")
                page.locator("#loginName").fill("가상직원")
                page.locator("#loginPin").fill("1234")
                page.locator("#loginBtn").click()
                page.locator("#appView:not(.hidden)").wait_for(timeout=30000)
                page.locator("#usageGuideBackdrop.open").wait_for(state="visible",timeout=6000)
                page.locator("#usageGuideConfirmBtn").click()
                page.locator("#usageGuideBackdrop.open").wait_for(state="hidden",timeout=6000)
                check(page.evaluate("state.me?.employee_id===2 && !state.me?.is_read_only && state.personnelBackendReady===true"),
                      "actual login UI and read-only gate authorize only synthetic worker")
                if "--overtime-only" in sys.argv:
                    open_date(page,OT_DATE,2027,4)
                else:
                    open_date(page,PHOTO_DATE,2026,9)
                    check(page.evaluate("state.fingerprintBackendReady===true"),"fingerprint metadata ready before photo choice")
                    upload=page.locator("#fingerprintClockInUploadBtn")
                    # The app deliberately collapses an empty fingerprint section.
                    # Expand the visible real section header before testing the upload button.
                    if not upload.is_visible():
                        page.locator("#fingerprintDetailToggleBtn").click()
                    if not (upload.is_visible() and upload.is_enabled()):
                        diag=page.evaluate("""()=>({
                          selectedDate:state.selectedDate,view:state.view,
                          today:todayKey(),personnel:state.personnelBackendReady,
                          fingerprint:state.fingerprintBackendReady,
                          accountReadOnly:accountReadOnly(),personnelReady:fingerprintPersonnelReady(),
                          operational:fingerprintDateOperational(state.selectedDate),
                          dateNotFuture:fingerprintDateNotFuture(state.selectedDate),
                          hidden:document.getElementById('fingerprintDetailSection')?.className,
                          btnDisabled:document.getElementById('fingerprintClockInUploadBtn')?.disabled,
                          detailError:document.getElementById('fingerprintDetailError')?.textContent,
                          employee:state.employees.find(e=>Number(e.id)===2)?.placement_code,
                          lifecycle:pageLifecycleFreshnessPending
                        })""")
                        print("SYNTHETIC_FINGERPRINT_BUTTON_DIAG="+str(diag),flush=True)
                    check(upload.is_visible() and upload.is_enabled(),
                          "real fingerprint upload button enabled on past synthetic active date")
                    photo=make_png()
                    with page.expect_file_chooser(timeout=10000) as picker:
                        upload.click()
                    picker.value.set_files({"name":"synthetic-qa.png","mimeType":"image/png","buffer":photo})
                    page.wait_for_function("""()=>!fingerprintPhotoPending &&
                      !!state.fingerprintRecords.find(r=>r.record_date==='2026-10-21' && r.has_clock_in)""",
                      timeout=30000)
                    check(len(PHOTO_HITS)==1 and PHOTO_HITS[0][1]>100,
                          "real file chooser -> browser PNG decode -> canvas JPEG -> HTTP write exactly once")
                    check(br.value("""SELECT octet_length(clock_in_photo) FROM public.qa_browser_fingerprint
                        WHERE employee_id=2 AND record_date=%s::date""",(PHOTO_DATE,))>100,
                          "actual fingerprint JPEG bytes persisted in isolated PostgreSQL")
                    check(page.locator("#fingerprintClockInState").text_content().strip()=="등록됨",
                          "real UI readback shows registered image after DB resync")
                    check(page.evaluate("state.fingerprintBackendReady===true"),
                          "photo metadata resynchronization returns to ready, not indefinite loading")
                    # Reproduce only the browser events, not a physical Android OS picker.
                    # The second upload is an existing-photo replacement with actual CAS stamp.
                    original_stamp=page.evaluate("fingerprintRecordForDate('2026-10-21')?.updated_at")
                    with page.expect_file_chooser(timeout=10000) as resumed_picker:
                        upload.click()
                    page.evaluate("""()=>{
                      window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
                      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
                    }""")
                    resumed_picker.value.set_files({"name":"synthetic-qa.png","mimeType":"image/png","buffer":photo})
                    page.wait_for_function("""(before)=>!fingerprintPhotoPending &&
                      fingerprintRecordForDate('2026-10-21')?.updated_at!==before
                      && state.fingerprintBackendReady===true""",arg=original_stamp,timeout=30000)
                    check(len(PHOTO_HITS)==2 and PHOTO_HITS[1][0]=="clock_in",
                          "synthetic picker pagehide/pageshow/BFCache return does not lose or double-send photo change")
                    check(page.locator("#fingerprintClockInState").text_content().strip()=="등록됨",
                          "photo replacement persists and UI unlocks after simulated native picker return")
                    # The on-change handler keeps the picker active until its async finally.
                    # Do not inject a new failure while that picker still owns detail rendering.
                    page.wait_for_function("""()=>!fingerprintPickerFlowActive &&
                      !fingerprintPhotoPending && !state.refreshing && !refreshPendingOwner""",timeout=12000)
                    # QA-only HTTP 503 injection: real full-page Javascript must distinguish
                    # a fingerprint metadata read failure from an infinite spinner.
                    # This route never reaches either synthetic PostgreSQL or any production URL.
                    def injected_read_failure(route):
                        route.fulfill(status=503,content_type="application/json",
                                      body='{"code":"QA_READ_503","message":"QA_SYNTHETIC_FAILURE_DO_NOT_SHOW"}')
                    successful_photo_writes=len(PHOTO_HITS)
                    page.route("**/rest/v1/rpc/list_my_fingerprint_records",injected_read_failure)
                    try:
                        failed=page.evaluate("""async()=>{
                          const bounds=monthBounds(state.year,state.month);
                          return await loadFingerprintRecords(bounds.from,bounds.to);
                        }""")
                        check(failed is False and page.evaluate("state.fingerprintBackendReady===false"),
                              "synthetic 503 fingerprint metadata read unlocks loading into explicit failure state")
                        current_message=page.locator("#fingerprintDetailError").text_content()
                        if "시간 초과 또는 네트워크 오류" not in current_message:
                            print("QA_SYNTHETIC_FINGERPRINT_ERROR_UI="+repr({
                              "message":current_message,
                              "picker_active":page.evaluate("fingerprintPickerFlowActive"),
                              "photo_pending":page.evaluate("fingerprintPhotoPending"),
                              "backend_ready":page.evaluate("state.fingerprintBackendReady")
                            }),flush=True)
                        check(("조회에 실패했습니다" in current_message or "시간 초과 또는 네트워크 오류" in current_message)
                              and "QA_SYNTHETIC" not in current_message and "불러오는 중" not in current_message,
                              "real fingerprint detail shows safe failed-read status, not a spinner or raw HTTP body")
                        check(page.locator("#fingerprintClockInState").text_content().strip()=="등록됨"
                              and not upload.is_enabled() and len(PHOTO_HITS)==successful_photo_writes,
                              "failed metadata refresh preserves previous photo and blocks unsafe write")
                    finally:
                        page.unroute("**/rest/v1/rpc/list_my_fingerprint_records",injected_read_failure)
                    check(page.evaluate("""async()=>{
                      const b=monthBounds(state.year,state.month);
                      return await loadFingerprintRecords(b.from,b.to);
                    }""") is True and page.evaluate("state.fingerprintBackendReady===true"),
                          "successful subsequent real HTTP/PG fingerprint metadata read restores ready state")
                    check(upload.is_enabled() and page.locator("#fingerprintDetailError").text_content().strip()=="",
                          "successful metadata read clears error and safely re-enables upload")

                    # Simulate interrupted bootstrap: a preceding month attendance RPC
                    # fails BEFORE the fingerprint read starts. It must show a failure
                    # state rather than keep the user waiting on a nonexistent request.
                    page.route("**/rest/v1/rpc/list_attendance_with_annual_leave",injected_read_failure)
                    try:
                        page.evaluate("state.fingerprintBackendReady=null")
                        check(page.evaluate("async()=>await loadMonthData(true)") is False,
                              "synthetic upstream HTTP 503 prevents starting downstream fingerprint fetch")
                        check(page.evaluate("state.fingerprintBackendReady===false")
                              and "지문 기록 조회를 시작하지 못했습니다" in page.locator("#fingerprintDetailError").text_content(),
                              "orphaned loading converts to truthful prerequisite failure")
                        check(page.locator("#fingerprintClockInState").text_content().strip()=="등록됨"
                              and not upload.is_enabled() and len(PHOTO_HITS)==successful_photo_writes,
                              "failed prerequisite never loses persisted fingerprint or sends unintended write")
                    finally:
                        page.unroute("**/rest/v1/rpc/list_attendance_with_annual_leave",injected_read_failure)
                    check(page.evaluate("async()=>await loadMonthData(true)") is True
                          and page.evaluate("state.fingerprintBackendReady===true"),
                          "full normal HTTP/PG read restores screen after preceding dependency failure")
                    check(upload.is_enabled() and len(PHOTO_HITS)==successful_photo_writes,
                          "prerequisite recovery re-enables upload without duplicate photo mutation")

                    # The fingerprint itself can be current while another screen is
                    # still refreshing. Display its distinct reason and KEEP the
                    # global write lock instead of pretending the photo is still loading.
                    page.evaluate("pageLifecycleFreshnessPending=true;renderFingerprintDetail(state.selectedDate)")
                    check("다른 최신 데이터 동기화" in page.locator("#fingerprintDetailError").text_content()
                          and not upload.is_enabled(),
                          "unrelated unfinished sync has distinct status and still blocks writes")
                    page.evaluate("pageLifecycleFreshnessPending=false;renderFingerprintDetail(state.selectedDate)")
                    check(upload.is_enabled() and page.locator("#fingerprintDetailError").text_content().strip()=="",
                          "global freshness completion clears status and restores upload")
                    if js_errors or any(".supabase.co" in x for x in external):
                        print("QA_SCOPED_RECOVERY_NETWORK_DIAG="+repr({
                          "js_errors":js_errors[:3],
                          "blocked_domains":sorted(set(urlsplit(x).hostname for x in external))[:8]
                        }),flush=True)
                    # The existing fixture blocks unrelated CDN/font attempts. No
                    # Supabase requests or browser exceptions are permitted.
                    check(not js_errors and not any(".supabase.co" in x for x in external),
                          "failure recovery generated no JS exceptions or live Supabase access")
                    if "--fingerprint-only" in sys.argv:
                        check(len(PHOTO_HITS)==2 and not js_errors and
                              not any(".supabase.co" in u for u in external),
                              "fingerprint-only fixture sent exactly two intended photo saves, no live service calls")
                        print("FINGERPRINT_READ_RECOVERY_ISOLATED_CHROMIUM_POSTGRES_PASS",flush=True)
                        return
                    page.get_by_role("button",name="날짜 상세 닫기").click()
                    page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=6000)
                    open_date(page,OT_DATE,2027,4)
                if not page.locator("#saveOvertimeBtn").is_visible():
                    page.locator("#overtimeDetailToggleBtn").click()
                check(page.locator("#saveOvertimeBtn").is_visible() and page.locator("#saveOvertimeBtn").is_enabled(),
                      "actual overtime Save button enabled for synthetic eligible day")
                adjustment=page.locator('[data-overtime-slot="early"] button[data-overtime-adjust="10"]')
                adjustment.click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="10분",
                      "actual +10 overtime control updates draft")
                # If a concurrently running authoritative read cancels the first
                # click, retry only as a *second explicit user action*, after PG and
                # mutation logs prove no first write occurred. Never blindly retry.
                first_write_attempt=len(OVERTIME_HITS)
                try:
                    with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=6000) as resp:
                        page.locator("#saveOvertimeBtn").click()
                    check(resp.value.status==200,"real overtime Save HTTP success")
                except Exception as e:
                    page.wait_for_function("()=>!overtimeDaySavePending",timeout=12000)
                    feedback=page.locator("#overtimeDetailError").text_content()
                    no_write=(len(OVERTIME_HITS)==first_write_attempt and
                              br.value("SELECT count(*) FROM public.qa_browser_overtime WHERE work_date=%s::date",(OT_DATE,))==0)
                    if not (no_write and "저장을 중단" in feedback and
                            page.locator("#overtimeEarlyTime").text_content().strip()=="10분"):
                        raise
                    check(no_write,"cancelled first click preserved 10-minute draft and sent zero write")
                    page.wait_for_function("""()=>personnelMutationReady() &&
                      state.overtimeBackendReady===true && pageLifecycleWriteFreshnessReady() &&
                      !state.refreshing && !refreshPendingOwner && !overtimeDaySavePending &&
                      !document.getElementById('saveOvertimeBtn').disabled""",timeout=15000)
                    with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=15000) as retry:
                        page.locator("#saveOvertimeBtn").click()
                    check(retry.value.status==200,"explicit user retry after current status succeeded once")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                  state.overtimeEntries.some(r=>r.work_date==='2027-05-13' && r.minutes===10)""",
                  timeout=20000)
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==10,
                      "Save button committed synthetic overtime in PostgreSQL")
                check(OVERTIME_HITS==[10],"one overtime write, no duplicated mutation")
                if "--draft-inflight-probe" in sys.argv:
                    # Deterministic in-flight refresh gate, local test only. Pause
                    # AFTER the month has reloaded but BEFORE account UI rerenders.
                    page.evaluate("""()=>{
                      window.__qaPriorLoadMonthData=loadMonthData;
                      window.__qaReadHeld=false;
                      window.__qaInFlightRefreshDone=false;
                      loadMonthData=async (...args)=>{
                        const result=await window.__qaPriorLoadMonthData(...args);
                        window.__qaReadHeld=true;
                        await new Promise(resolve=>{window.__qaReleaseRefresh=resolve;});
                        return result;
                      };
                      window.__qaInFlightRefresh=refresh('realtime').then(
                        result=>{window.__qaInFlightRefreshDone=true;return result;},
                        err=>{window.__qaInFlightRefreshDone=true;throw err;}
                      );
                    }""")
                    page.wait_for_function("()=>window.__qaReadHeld===true",timeout=14000)
                    check(page.locator("#overtimeEarlyTime").text_content().strip()=="10분",
                          "pending realtime read has not replaced current 10-minute detail")
                    adjustment.click()
                    during=page.evaluate("""()=>({
                       draft:overtimeDetailMinutes.early,
                       baseline:detailRecordBaseline.overtime,
                       dirty:detailDirtyFlags().overtime,
                       date:state.selectedDate
                    })""")
                    check(during["draft"]==20 and during["dirty"] is True,
                          "user edits a genuine 20-minute draft while refresh awaits final render")
                    page.evaluate("""()=>{
                      const release=window.__qaReleaseRefresh;
                      window.__qaReleaseRefresh=null;
                      loadMonthData=window.__qaPriorLoadMonthData;
                      if(release)release();
                    }""")
                    page.wait_for_function("()=>window.__qaInFlightRefreshDone && !refreshPendingOwner",timeout=14000)
                    after=page.evaluate("""()=>({
                      draft:overtimeDetailMinutes.early,
                      baseline:detailRecordBaseline.overtime,
                      dirty:detailDirtyFlags().overtime,
                      date:state.selectedDate,
                      backend:state.overtimeBackendReady
                    })""")
                    print("QA_INFLIGHT_REALTIME_DIRTY_OVERTIME="+repr({
                      "during":during,"after":after,"writes":len(OVERTIME_HITS)
                    }),flush=True)
                    check(after["draft"]==20 and after["dirty"] is True
                          and after["baseline"]==during["baseline"],
                          "in-flight full refresh must not replace newly typed draft or CAS baseline")
                    check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==10
                          and len(OVERTIME_HITS)==1,
                          "in-flight race caused no hidden overtime write")
                    print("OVERTIME_INFLIGHT_REALTIME_DRAFT_PRESERVATION_SCOPED_PASS",flush=True)
                    return
                adjustment.click()
                if "--readiness-ui-probe" in sys.argv:
                    check(page.locator("#overtimeEarlyTime").text_content().strip()=="20분"
                          and page.evaluate("detailDirtyFlags().overtime===true"),
                          "dirty 20-minute overtime draft ready for in-flight read UI guard")
                    # Scoped synthetic setter tracing only; never included in app.
                    page.evaluate("""()=>{
                      const base=detailDraftBaseline;
                      window.__qaBaselineEvents=[];
                      window.__qaBaselineObject=base;
                      for(const k of ['key','overtime']){
                        let v=base[k];
                        Object.defineProperty(base,k,{
                          configurable:true,enumerable:true,
                          get(){return v},
                          set(next){
                            window.__qaBaselineEvents.push({
                              key:k,from:JSON.stringify(v),to:JSON.stringify(next),
                              stack:String(new Error().stack).slice(0,330)
                            });
                            v=next;
                          }
                        });
                      }
                    }""")
                    # Real local PG read completes, but hold the response before
                    # JS can mark overtime metadata fresh. Controls must lock now.
                    page.evaluate("""()=>{
                      window.__qaPriorRpc=rpc;
                      window.__qaOtHeld=false;
                      window.__qaOtIntercepted=false;
                      rpc=async (...args)=>{
                        if(args[0]!=='list_overtime_entries'||window.__qaOtIntercepted)return window.__qaPriorRpc(...args);
                        window.__qaOtIntercepted=true;
                        const rows=await window.__qaPriorRpc(...args);
                        window.__qaOtHeld=true;
                        await new Promise(resolve=>window.__qaReleaseOtRead=resolve);
                        return rows;
                      };
                      const b=monthBounds(state.year,state.month);
                      window.__qaOtReadTask=loadOvertimeData(b.from,b.to);
                      window.__qaOtReadGeneration=overtimeDataLoadSeq;
                    }""")
                    page.wait_for_function("()=>window.__qaOtHeld===true",timeout=12000)
                    check(page.evaluate("state.overtimeBackendReady===null") and
                          (not page.locator("#saveOvertimeBtn").is_visible() or
                           page.locator("#saveOvertimeBtn").is_disabled()) and
                          page.locator("#overtimeEarlyTime").text_content().strip()=="20분" and
                          page.evaluate("detailDirtyFlags().overtime===true"),
                          "in-flight overtime metadata read promptly locks save without losing draft")
                    page.evaluate("""()=>{
                      const release=window.__qaReleaseOtRead;
                      rpc=window.__qaPriorRpc;
                      if(release)release();
                    }""")
                    overtime_restored=page.evaluate("""async()=>({
                      completed:await window.__qaOtReadTask,
                      backend:state.overtimeBackendReady,
                      personnel:state.personnelBackendReady,
                      writable:personnelMutationReady(),
                      refreshPending:!!refreshPendingOwner,
                      refreshing:state.refreshing,
                      disabled:document.getElementById('saveOvertimeBtn').disabled,
                      hidden:document.getElementById('saveOvertimeBtn').classList.contains('hidden'),
                      draft:overtimeDetailMinutes.early,
                      dirty:detailDirtyFlags().overtime,
                      overtimeDataLoadSeq,
                      error:document.getElementById('overtimeDetailError')?.textContent
                    })""")
                    # A background refresh may supersede this read or still be finishing
                    # its broader authoritative lifecycle. A stale read returning false
                    # is acceptable ONLY if a newer generation superseded it; final UI
                    # must unlock after that newer refresh is fully settled.
                    read_completed=overtime_restored["completed"] is True
                    read_superseded=(overtime_restored["completed"] is False and
                        overtime_restored["overtimeDataLoadSeq"]>
                        page.evaluate("window.__qaOtReadGeneration"))
                    if (overtime_restored["personnel"] is None or
                        overtime_restored["refreshPending"] or overtime_restored["refreshing"]):
                        if overtime_restored["personnel"] is None:
                            check(overtime_restored["disabled"] is True
                                  and overtime_restored["hidden"] is True
                                  and overtime_restored["draft"]==20 and overtime_restored["dirty"] is True,
                                  "overlapping personnel refresh retains safe Save lock and 20-minute dirty draft")
                        page.wait_for_function("""()=>!refreshPendingOwner && !state.refreshing &&
                          state.personnelBackendReady===true && state.overtimeBackendReady===true""",
                          timeout=14000)
                        overtime_restored=page.evaluate("""()=>({
                          backend:state.overtimeBackendReady,
                          personnel:state.personnelBackendReady,writable:personnelMutationReady(),
                          refreshPending:!!refreshPendingOwner,refreshing:state.refreshing,
                          disabled:document.getElementById('saveOvertimeBtn').disabled,
                          hidden:document.getElementById('saveOvertimeBtn').classList.contains('hidden'),
                          draft:overtimeDetailMinutes.early,dirty:detailDirtyFlags().overtime,
                          overtimeDataLoadSeq,
                          error:document.getElementById('overtimeDetailError')?.textContent
                        })""")
                    overtime_restored_ok=((read_completed or read_superseded) and
                        overtime_restored["backend"] is True and
                        overtime_restored["personnel"] is True and
                        overtime_restored["writable"] is True and
                        not overtime_restored["refreshPending"] and not overtime_restored["refreshing"] and
                        not overtime_restored["disabled"] and not overtime_restored["hidden"] and
                        overtime_restored["draft"]==20 and overtime_restored["dirty"] is True)
                    if not overtime_restored_ok:
                        print("QA_OVERTIME_READ_COMPLETION_DIAG="+repr(overtime_restored),flush=True)
                    check(overtime_restored_ok,
                          "completed authoritative overtime read unlocks dirty detail without rerender")
                    # A personnel refresh also changes readiness before any HTTP
                    # response arrives. Use the app's real loadEmployees path.
                    # One-shot read interception prevents later background requests
                    # from overwriting the release promise (false deadlock).
                    page.wait_for_function("()=>!state.refreshing && !refreshPendingOwner",timeout=10000)
                    page.evaluate("""()=>{
                      if(realtimeRefreshTimer){clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=null;}
                      window.__qaPriorRefresh=refresh;
                      refresh=async()=>false;
                      window.__qaPriorPersonnelChain=rpcPreferPersonnelChain;
                      window.__qaPersonnelHeld=false;
                      window.__qaPersonnelIntercepted=false;
                      window.__qaPersonnelDone=false;
                      window.__qaPersonnelResult=null;
                      rpcPreferPersonnelChain=async (...args)=>{
                        if(window.__qaPersonnelIntercepted)return window.__qaPriorPersonnelChain(...args);
                        window.__qaPersonnelIntercepted=true;
                        const rows=await window.__qaPriorPersonnelChain(...args);
                        window.__qaPersonnelHeld=true;
                        await new Promise(resolve=>window.__qaReleasePersonnelRead=resolve);
                        return rows;
                      };
                      window.__qaPersonnelTask=loadEmployees().then(result=>{
                        window.__qaPersonnelResult=result;window.__qaPersonnelDone=true;return result;
                      },error=>{
                        window.__qaPersonnelError=String(error?.name||'error');
                        window.__qaPersonnelDone=true;return false;
                      });
                    }""")
                    page.wait_for_function("()=>window.__qaPersonnelHeld===true",timeout=12000)
                    check(page.evaluate("state.personnelBackendReady===null") and
                          (not page.locator("#saveOvertimeBtn").is_visible() or
                           page.locator("#saveOvertimeBtn").is_disabled()) and
                          page.locator("#overtimeEarlyTime").text_content().strip()=="20분" and
                          page.evaluate("detailDirtyFlags().overtime===true"),
                          "in-flight personnel read promptly locks save while preserving dirty overtime")
                    page.evaluate("""()=>{
                      const release=window.__qaReleasePersonnelRead;
                      rpcPreferPersonnelChain=window.__qaPriorPersonnelChain;
                      if(release)release();
                    }""")
                    try:
                        page.wait_for_function("()=>window.__qaPersonnelDone===true",timeout=10000)
                    except Exception:
                        print("QA_PERSONNEL_HOLD_UNFINISHED="+repr(page.evaluate("""()=>({
                          pending:window.__qaPersonnelDone,refreshing:state.refreshing,
                          refreshOwner:!!refreshPendingOwner,personnelLoadSeq,
                          backend:state.personnelBackendReady,
                          restoreReady:pageLifecycleWriteFreshnessReady()
                        })""")),flush=True)
                        raise
                    restored=page.evaluate("""()=>({
                       completed:window.__qaPersonnelResult,
                       error:window.__qaPersonnelError||'',
                       backend:state.personnelBackendReady,
                       overtimeBackend:state.overtimeBackendReady,
                       personnelReady:personnelMutationReady(),
                       fresh:pageLifecycleWriteFreshnessReady(),
                       disabled:document.getElementById('saveOvertimeBtn').disabled,
                       hidden:document.getElementById('saveOvertimeBtn').classList.contains('hidden'),
                       draft:overtimeDetailMinutes.early,dirty:detailDirtyFlags().overtime,
                       seq:personnelLoadSeq
                    })""")
                    page.evaluate("refresh=window.__qaPriorRefresh")
                    if restored["backend"] is not True or restored["disabled"] or restored["hidden"] or restored["draft"]!=20:
                        print("QA_PERSONNEL_RESTORATION_DIAG="+repr(restored),flush=True)
                    check(restored["backend"] is True and restored["personnelReady"] is True
                          and restored["disabled"] is False and restored["hidden"] is False
                          and restored["draft"]==20 and restored["dirty"] is True,
                          "authoritative personnel read completion unlocks save with original draft intact")
                    final_pg_minutes=br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))
                    final_dirty=page.evaluate("detailDirtyFlags().overtime===true")
                    baseline_diag=page.evaluate("""()=>({
                      baselineKey:detailDraftBaseline.key,selectedDate:state.selectedDate,
                      baselineOvertime:detailDraftBaseline.overtime,
                      actualDraft:detailOvertimeSnapshot(),
                      sameObject:detailDraftBaseline===window.__qaBaselineObject,
                      setterTrace:window.__qaBaselineEvents.slice(-15),
                      detailOpen:document.getElementById('detailBackdrop')?.classList.contains('open')
                    })""")
                    print("QA_READINESS_FINAL_GUARD_DIAG="+repr({
                      "dirty":final_dirty,"overtimeWrites":OVERTIME_HITS[:],
                      "pgMinutes":final_pg_minutes,
                      "personnelResult":restored["completed"],
                      "backend":restored["backend"],
                      "draft":restored["draft"],"baseline":baseline_diag
                    }),flush=True)
                    check(final_dirty and len(OVERTIME_HITS)==1 and final_pg_minutes==10,
                          "UI-only loading locks issue zero writes and keep original 10-minute PG baseline")
                    print("OVERTIME_READINESS_UI_LOCK_SYNTHETIC_PG_PASS",flush=True)
                    return
                if "--draft-refresh-probe" in sys.argv:
                    check(page.locator("#overtimeEarlyTime").text_content().strip()=="20분",
                          "synthetic 20-minute unsaved draft exists before forced Realtime read")
                    before_sync=page.evaluate("""()=>({
                      dirty:detailDirtyFlags().overtime,
                      draft:overtimeDetailMinutes.early,
                      baseline:detailRecordBaseline.overtime,
                      nav:state.selectedDate
                    })""")
                    check(before_sync["dirty"] is True and before_sync["draft"]==20,
                          "true dirty baseline captured before Realtime refresh")
                    page.evaluate("""async()=>await refresh('realtime')""")
                    after_sync=page.evaluate("""()=>({
                      dirty:detailDirtyFlags().overtime,
                      draft:overtimeDetailMinutes.early,
                      baseline:detailRecordBaseline.overtime,
                      nav:state.selectedDate,
                      backend:state.overtimeBackendReady,
                      pending:overtimeDaySavePending,
                      error:document.getElementById('overtimeDetailError')?.textContent,
                      complete:!state.refreshing&&!refreshPendingOwner
                    })""")
                    print("QA_OVERTIME_DRAFT_REALTIME_PROBE="+repr({
                      "before":before_sync,"after":after_sync,
                      "write_hits":len(OVERTIME_HITS)
                    }),flush=True)
                    check(after_sync["draft"]==20 and after_sync["dirty"] is True
                          and after_sync["baseline"]==before_sync["baseline"],
                          "Realtime refresh preserves unsaved overtime time and original CAS baseline")
                    check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==10
                          and len(OVERTIME_HITS)==1,
                          "Realtime refresh only reads synthetic PG; unsaved 20 not written")
                    print("OVERTIME_DRAFT_AFTER_FINGERPRINT_REALTIME_REFRESH_SCOPED_PASS",flush=True)
                    return
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="20분",
                      "existing 10-minute plan edited through actual +10 control")
                # Diagnose if the second Save stalls before or after its preflight.
                preflight_before=sum(x=="list_overtime_entries" for x in br.HITS)
                writes_before=len(OVERTIME_HITS)
                try:
                    with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=5000) as resp:
                        page.locator("#saveOvertimeBtn").click()
                    check(resp.value.status==200,"actual overtime modification HTTP success")
                except Exception as e:
                    page.wait_for_timeout(180)
                    diagnosis=page.evaluate("""()=>({
                       date:state.selectedDate,view:state.view,uiMinutes:overtimeDetailMinutes.early,
                       backendReady:state.overtimeBackendReady,personnelReady:personnelMutationReady(),
                       pending:overtimeDaySavePending,readOnly:accountReadOnly(),
                       writeFresh:pageLifecycleWriteFreshnessReady(),
                       refreshing:state.refreshing,refreshOwner:!!refreshPendingOwner,
                       buttonDisabled:document.getElementById('saveOvertimeBtn')?.disabled,
                       buttonHidden:document.getElementById('saveOvertimeBtn')?.classList.contains('hidden'),
                       detailError:document.getElementById('overtimeDetailError')?.textContent,
                       detailStatus:document.getElementById('overtimeDetailStatus')?.textContent,
                       baseline:detailRecordBaseline.overtime,
                       current:overtimeDaySourceSnapshot(state.selectedDate)
                    })""")
                    print("QA_ONLY_SECOND_OVERTIME_WRITE_DIAG="+repr({
                       "exception":type(e).__name__,
                       "preflight_delta":sum(x=="list_overtime_entries" for x in br.HITS)-preflight_before,
                       "write_delta":len(OVERTIME_HITS)-writes_before,
                       "recent_methods":br.HITS[-12:],
                       "ui":diagnosis,
                       "js_errors":js_errors[-3:],
                    }),flush=True)
                    # User-initiated retry is allowed only after verifying
                    # that the first aborted click did not commit any PG write.
                    no_write=(len(OVERTIME_HITS)==writes_before and
                              br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==10)
                    cancelled=no_write and "저장을 중단" in (diagnosis.get("detailError") or "")
                    if not cancelled:
                        raise
                    page.wait_for_function("""()=>personnelMutationReady() &&
                       pageLifecycleWriteFreshnessReady() && state.overtimeBackendReady===true &&
                       !state.refreshing && !refreshPendingOwner && !overtimeDaySavePending""",
                       timeout=12000)
                    check(no_write,"cancelled preflight never writes before explicit user retry")
                    with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=15000) as retry_resp:
                        page.locator("#saveOvertimeBtn").click()
                    check(retry_resp.value.status==200,"explicit user retry after fresh preflight commits once")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                  state.overtimeEntries.some(r=>r.work_date==='2027-05-13' && r.minutes===20)""",
                  timeout=20000)
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==20,
                      "overtime second Save committed modification, not just first insertion")
                check(OVERTIME_HITS==[10,20],"exactly two intended writes")
                if "--overtime-only" in sys.argv:
                    # Deterministic mid-preflight invalidation: a synthetic
                    # personnel refresh changes readiness AFTER the authoritative
                    # date read, before the guarded mutation. No production data.
                    adjustment.click()
                    check(page.locator("#overtimeEarlyTime").text_content().strip()=="30분",
                          "synthetic overtime draft prepared for mid-read guard")
                    # Five fail-closed entry cases: no permission bypass, no live DB.
                    classifications=[
                        ("personnel-loading","state.personnelBackendReady=null","인사이력을 다시 불러오는 중"),
                        ("personnel-failed","state.personnelBackendReady=false","최신 인사이력을 확인하지 못해"),
                        ("overtime-loading","state.overtimeBackendReady=null","초과근무 기록을 다시 불러오는 중"),
                        ("overtime-failed","state.overtimeBackendReady=false","최신 초과근무 기록을 확인하지 못해"),
                        ("foreground-loading","pageLifecycleFreshnessPending=true","앱 복귀 후 데이터 동기화")
                    ]
                    for reason, set_state, expected in classifications:
                        page.evaluate("""()=>{
                           state.personnelBackendReady=true;
                           state.overtimeBackendReady=true;
                           pageLifecycleFreshnessPending=false;
                        }""")
                        page.evaluate(set_state)
                        page.evaluate("async()=>await saveOvertimeDay()")
                        message=page.locator("#overtimeDetailError").text_content()
                        check(expected in message and "작성 중 내용은 보존" in message,
                              "classified overtime preflight reason: "+reason)
                        check(page.locator("#overtimeEarlyTime").text_content().strip()=="30분" and
                              len(OVERTIME_HITS)==2 and
                              br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==20,
                              "preflight "+reason+" preserves draft and original PG without mutation")
                    page.evaluate("""()=>{
                       state.personnelBackendReady=true;
                       state.overtimeBackendReady=true;
                       pageLifecycleFreshnessPending=false;
                       document.getElementById('overtimeDetailError').textContent='';
                    }""")
                    page.evaluate("""()=>{
                       window.__qaOriginalCurrentOvertimeDay=fetchCurrentOvertimeDay;
                       fetchCurrentOvertimeDay=async (...args)=>{
                         const rows=await window.__qaOriginalCurrentOvertimeDay(...args);
                         state.personnelBackendReady=null;
                         return rows;
                       };
                    }""")
                    prior_write_count=len(OVERTIME_HITS)
                    page.locator("#saveOvertimeBtn").click()
                    page.wait_for_function("""()=>!overtimeDaySavePending
                       && document.getElementById('overtimeDetailError')?.textContent.includes('인사이력을 다시 불러오는 중')""",
                       timeout=12000)
                    check(len(OVERTIME_HITS)==prior_write_count and
                          br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==20,
                          "personnel readiness changed during preflight: aborts before write and protects PG 20")
                    check(page.locator("#overtimeEarlyTime").text_content().strip()=="30분",
                          "aborted save preserves unsaved 30-minute input")
                    page.evaluate("""()=>{
                        fetchCurrentOvertimeDay=window.__qaOriginalCurrentOvertimeDay;
                        state.personnelBackendReady=true;
                        syncOpenDetailPermissionsPreservingDraft();
                    }""")
                    check(page.locator("#saveOvertimeBtn").is_enabled() and len(OVERTIME_HITS)==2,
                          "authoritative readiness restored without automatic retry or duplicate save")
                if "--list-overlap-probe" in sys.argv:
                    # Overlap two authoritative reads in the browser. The first
                    # response is held AFTER real disposable-PG fetch, then released
                    # only after a newer response has rendered. No write or live DB.
                    page.get_by_role("button",name="날짜 상세 닫기").click()
                    page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=6000)
                    page.locator("#overtimeSummaryMain").click()
                    # One atomic settled-state predicate: a background authoritative refresh
                    # may safely hide Edit between two separate Python/Chromium observations.
                    page.wait_for_function("""()=>!state.refreshing && !refreshPendingOwner &&
                        overtimeListBackendReady===true &&
                        document.querySelectorAll('#overtimeListBody button[data-overtime-list-edit]').length===1""",
                        timeout=20000)
                    check(page.evaluate("""()=>!state.refreshing && !refreshPendingOwner &&
                          overtimeListBackendReady===true &&
                          document.querySelectorAll('#overtimeListBody button[data-overtime-list-edit]').length===1"""),
                          "list opening authoritatively loaded real synthetic PG row")
                    pre_read_hit_count=sum(x=="list_overtime_entries" for x in br.HITS)
                    # Suppress unrelated scheduled Realtime work inside THIS
                    # synthetic race experiment, not in the application source.
                    page.evaluate("""()=>{
                      window.__qaOriginalRefresh=refresh;
                      if(realtimeRefreshTimer){clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=null;}
                      refresh=async()=>false;
                    }""")
                    page.evaluate("""()=>{
                      window.__qaListOriginalRpc=rpc;
                      window.__qaListSeen=0;
                      window.__qaListFirstHeld=false;
                      window.__qaListReleaseFirst=null;
                      rpc=async (...args)=>{
                        if(args[0]!=='list_overtime_entries')return window.__qaListOriginalRpc(...args);
                        const n=++window.__qaListSeen;
                        const rows=await window.__qaListOriginalRpc(...args);
                        if(n===1){
                          window.__qaListFirstHeld=true;
                          await new Promise(resolve=>{window.__qaListReleaseFirst=resolve;});
                        }
                        return rows;
                      };
                      window.__qaOlderList=loadOvertimeList(false);
                    }""")
                    page.wait_for_function("()=>window.__qaListFirstHeld===true",timeout=15000)
                    check(page.evaluate("overtimeListBackendReady===null") and
                          page.locator('#overtimeListBody button[data-overtime-list-edit]').count()==0,
                          "pending older read cannot expose editable row from unverified snapshot")
                    second=page.evaluate("async()=>await loadOvertimeList(false)")
                    second_state=page.evaluate("""()=>({
                       backend:overtimeListBackendReady,seq:overtimeListLoadSeq,
                       requestCount:window.__qaListSeen,refreshing:state.refreshing,
                       refreshOwner:!!refreshPendingOwner,context:overtimeListContextKey,
                       target:overtimeListTargetEmployeeId,year:state.year,month:state.month
                    })""")
                    if not (second is True and second_state["backend"] is True and
                            page.locator('#overtimeListBody button[data-overtime-list-edit]').count()==1):
                        print("QA_OVERTIME_TWO_READ_SECOND_DIAG="+repr({
                          "returned":second,"state":second_state,
                          "network":overtime_list_network[-12:],
                          "bridgeReads":sum(x=="list_overtime_entries" for x in br.HITS)-pre_read_hit_count,
                          "html":page.locator("#overtimeListBody").text_content()[:160]
                        }),flush=True)
                    check(second is True and second_state["backend"] is True and
                          page.locator('#overtimeListBody button[data-overtime-list-edit]').count()==1,
                          "newer request completes and safely re-enables Edit while older request is held")
                    first=page.evaluate("""async()=>{
                      const finish=window.__qaListReleaseFirst;
                      if(finish)finish();
                      return await window.__qaOlderList;
                    }""")
                    check(first is False and page.evaluate("overtimeListBackendReady===true") and
                          page.locator('#overtimeListBody button[data-overtime-list-edit]').count()==1,
                          "late obsolete read is discarded without relocking loaded latest list")
                    page.evaluate("rpc=window.__qaListOriginalRpc;refresh=window.__qaOriginalRefresh")
                    overlap_read_hits=sum(x=="list_overtime_entries" for x in br.HITS)-pre_read_hit_count
                    intercepted_reads=page.evaluate("window.__qaListSeen")
                    print("QA_OUT_OF_ORDER_LIST_READ_COUNT="+repr({
                       "bridgeReads":overlap_read_hits,"explicitIntercepted":intercepted_reads,
                       "writeHits":OVERTIME_HITS[:],
                       "listNetworkTail":overtime_list_network[-10:]
                    }),flush=True)
                    check(overlap_read_hits>=2 and intercepted_reads>=2 and
                          OVERTIME_HITS==[10,20] and
                          br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==20,
                          "out-of-order list requests are read-only, no overtime duplicate write")
                    print("OVERTIME_LIST_OUT_OF_ORDER_READS_SYNTHETIC_PG_PASS",flush=True)
                    return
                # Separate real user path: month overtime summary -> existing row's
                # visible "수정" button -> date detail -> update saved record.
                page.get_by_role("button",name="날짜 상세 닫기").click()
                page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=6000)
                page.locator("#overtimeSummaryMain").click()
                page.locator("#overtimeListBackdrop.open").wait_for(timeout=12000)
                list_edit=page.locator('#overtimeListBody button[data-overtime-list-edit]')
                list_edit.first.wait_for(state="visible",timeout=12000)
                # Natural Realtime read can briefly disable Edit; do not click
                # until the UI genuinely permits editing. No forced enable.
                try:
                    page.wait_for_function("""()=>overtimeListBackendReady===true &&
                      !state.refreshing && !refreshPendingOwner &&
                      [...document.querySelectorAll('#overtimeListBody button[data-overtime-list-edit]')]
                      .length===1 &&
                      !document.querySelector('#overtimeListBody button[data-overtime-list-edit]').disabled""",
                      timeout=14000)
                except Exception:
                    pass
                if list_edit.count()!=1 or not list_edit.first.is_enabled():
                    list_diag=page.evaluate("""()=>({
                      date:state.selectedDate,view:state.view,year:state.year,month:state.month,
                      personnelReady:personnelMutationReady(),accountReadOnly:accountReadOnly(),
                      listBackendReady:overtimeListBackendReady,monthBackendReady:state.overtimeBackendReady,
                      freshness:pageLifecycleWriteFreshnessReady(),refreshing:state.refreshing,
                      pending:overtimeDaySavePending,loadSeq:overtimeListLoadSeq,
                      listContext:overtimeListContextKey,target:overtimeListTargetEmployeeId,
                      listCount:overtimeListRows.length,monthSeq:monthDataLoadSeq,
                      refreshOwner:!!refreshPendingOwner,needCatchup:realtimeNeedsCatchup,
                      buttons:[...document.querySelectorAll(
                        '#overtimeListBody button[data-overtime-list-edit]')].map(el=>({
                          disabled:el.disabled,visible:getComputedStyle(el).display!='none'
                        })),
                      listSummary:document.getElementById('overtimeListBody')?.textContent?.slice(0,180)
                    })""")
                    print("QA_ONLY_OVERTIME_LIST_EDIT_DIAG="+repr({
                       "ui":list_diag,
                       "network_tail":overtime_list_network[-18:],
                       "total_list_requests":overtime_list_network.count("request"),
                       "total_list_responses":sum(x.startswith("response:") for x in overtime_list_network),
                       "bridge_list_hits":sum(x=="list_overtime_entries" for x in br.HITS),
                       "jsErrors":js_errors[-2:]
                    }),flush=True)
                    page.wait_for_timeout(1200)
                    print("QA_ONLY_OVERTIME_LIST_LATE_STATE="+repr({
                        "backend":page.evaluate("overtimeListBackendReady"),
                        "seq":page.evaluate("overtimeListLoadSeq"),
                        "editing_buttons":list_edit.count(),
                        "network_tail":overtime_list_network[-12:]
                    }),flush=True)
                check(list_edit.count()==1 and list_edit.first.is_enabled(),
                      "real month overtime list displays enabled existing-row Edit button")
                list_edit.first.click()
                page.locator("#overtimeListBackdrop.open").wait_for(state="hidden",timeout=6000)
                page.locator("#detailBackdrop.open").wait_for(timeout=6000)
                check(page.evaluate("state.selectedDate")==OT_DATE and
                      page.locator("#overtimeEarlyTime").text_content().strip()=="20분",
                      "overtime list Edit opens original 20-minute date and protects record context")
                if not page.locator("#saveOvertimeBtn").is_visible():
                    page.locator("#overtimeDetailToggleBtn").click()
                page.locator('[data-overtime-slot="early"] button[data-overtime-adjust="10"]').click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="30분",
                      "actual list Edit detail controls revise existing plan to 30 minutes")
                previous_calls=len(OVERTIME_HITS)
                page.locator("#saveOvertimeBtn").click()
                page.wait_for_timeout(900)
                if len(OVERTIME_HITS)==previous_calls:
                    status=page.evaluate("""()=>({
                      date:state.selectedDate,view:state.view,
                      detailsOpen:document.getElementById('detailBackdrop')?.classList.contains('open'),
                      draftMinutes:overtimeDetailMinutes.early,
                      serverReady:state.overtimeBackendReady,
                      personnelReady:state.personnelBackendReady,
                      mutationAllowed:personnelMutationReady(),
                      dateWritable:overtimeDetailDateWritable(state.selectedDate),
                      accountReadOnly:accountReadOnly(),
                      pending:overtimeDaySavePending,
                      lifecycleFresh:pageLifecycleWriteFreshnessReady(),
                      baselineKey:detailRecordBaseline.key,
                      baseline:detailRecordBaseline.overtime,
                      localSnapshot:overtimeDaySourceSnapshot(state.selectedDate),
                      displayError:document.getElementById('overtimeDetailError')?.textContent,
                      enabled:!document.getElementById('saveOvertimeBtn')?.disabled
                    })""")
                    print("QA_OVERTIME_LIST_EDIT_SAVE_NO_RPC_STATE="+str(status),flush=True)
                check(len(OVERTIME_HITS)>previous_calls,
                      "list Edit click reaches protected overtime RPC without preflight rejection")
                check(OVERTIME_HITS[-1]==30,"list Edit save receives HTTP success")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                  state.overtimeEntries.some(r=>r.work_date==='2027-05-13' && r.minutes===30)""",
                  timeout=20000)
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==30,
                      "list Edit 20-to-30 modification persisted in real isolated PostgreSQL")
                check(OVERTIME_HITS==[10,20,30],
                      "three real user actions each produce exactly one intended mutation")
                # Simulate a second tab writing newer data AFTER this tab captured
                # its 30-minute baseline. The stale first tab must NOT overwrite it.
                page.locator('[data-overtime-slot="early"] button[data-overtime-adjust="10"]').click()
                stale_ui=page.evaluate("""()=>({
                  draft:overtimeDetailMinutes.early,
                  text:document.getElementById('overtimeEarlyTime')?.textContent?.trim(),
                  dirty:detailDirtyFlags().overtime,
                  baseline:detailDraftBaseline.overtime,
                  disabled:document.getElementById('saveOvertimeBtn')?.disabled,
                  hidden:document.getElementById('saveOvertimeBtn')?.classList.contains('hidden'),
                  refreshing:state.refreshing,refreshOwner:!!refreshPendingOwner,
                  backend:state.overtimeBackendReady,
                  personnel:state.personnelBackendReady,
                  source:overtimeDaySourceSnapshot(state.selectedDate)
                })""")
                if stale_ui["text"]!="40분":
                    print("QA_STALE_TAB_DRAFT_DIAG="+repr(stale_ui),flush=True)
                check(stale_ui["text"]=="40분",
                      "stale-tab draft remains editable before conflicting server change")
                another_tab_minutes=br.value("""UPDATE public.qa_browser_overtime
                  SET minutes=50,
                  updated_at=GREATEST(clock_timestamp(),updated_at + INTERVAL '1 microsecond')
                  WHERE employee_id=2 AND work_date=%s::date AND slot='early'
                  RETURNING minutes""",(OT_DATE,))
                check(another_tab_minutes==50,
                      "second synthetic tab has newer 50-minute PG record")
                before_stale_mutation_count=len(OVERTIME_HITS)
                stale_preflight_before=sum(x=="list_overtime_entries" for x in br.HITS)
                page.locator("#saveOvertimeBtn").click()
                try:
                    page.wait_for_function("""()=>!overtimeDaySavePending
                       && document.getElementById('overtimeDetailError')?.textContent.includes('다른 창')""",
                       timeout=6000)
                except Exception as e:
                    check_state=page.evaluate("""()=>({
                      pending:overtimeDaySavePending,
                      message:document.getElementById('overtimeDetailError')?.textContent,
                      date:state.selectedDate,view:state.view,
                      draft:overtimeDetailMinutes.early,
                      baseline:detailRecordBaseline.overtime,
                      liveCache:overtimeDaySourceSnapshot(state.selectedDate),
                      backendReady:state.overtimeBackendReady,
                      personnelReady:personnelMutationReady(),
                      writeFresh:pageLifecycleWriteFreshnessReady(),
                      buttonDisabled:document.getElementById('saveOvertimeBtn')?.disabled,
                      buttonHidden:document.getElementById('saveOvertimeBtn')?.classList.contains('hidden'),
                      refreshing:state.refreshing,refreshOwner:!!refreshPendingOwner
                    })""")
                    print("QA_ONLY_STALE_OVERTIME_DIAG="+repr({
                      "errorType":type(e).__name__,
                      "preflight_delta":sum(x=="list_overtime_entries" for x in br.HITS)-stale_preflight_before,
                      "write_delta":len(OVERTIME_HITS)-before_stale_mutation_count,
                      "pg_minutes":br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,)),
                      "recentMethods":br.HITS[-12:],
                      "ui":check_state,
                      "jsErrors":js_errors[-3:]
                    }),flush=True)
                    safe_cancel=(len(OVERTIME_HITS)==before_stale_mutation_count and
                                 br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==50 and
                                 "저장을 중단" in (check_state.get("message") or ""))
                    if not safe_cancel:
                        raise
                    page.wait_for_function("""()=>personnelMutationReady() &&
                       pageLifecycleWriteFreshnessReady() && state.overtimeBackendReady===true &&
                       !state.refreshing && !refreshPendingOwner && !overtimeDaySavePending""",
                       timeout=12000)
                    page.locator("#saveOvertimeBtn").click()
                    page.wait_for_function("""()=>!overtimeDaySavePending &&
                       document.getElementById('overtimeDetailError')?.textContent.includes('다른 창')""",
                       timeout=12000)
                    check(len(OVERTIME_HITS)==before_stale_mutation_count,
                          "cancelled stale preflight followed by explicit user retry rejects conflict")
                check(len(OVERTIME_HITS)==before_stale_mutation_count,
                      "stale overtime draft rejected before outgoing protected save RPC")
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==50,
                      "other-tab newer overtime value preserved in synthetic PostgreSQL")
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="40분",
                      "failed stale save preserves current user's unsaved 40-minute draft")
                check(not any(".supabase.co" in x for x in external) and not js_errors,
                      "remote Supabase traffic blocked and no page JS exceptions")
                print("FINGERPRINT_OVERTIME_BROWSER_TO_SYNTHETIC_POSTGRES_SCOPED_PASS",flush=True)
            finally:browser.close()
    finally:
        site.terminate()
        try:site.communicate(timeout=4)
        except br.subprocess.TimeoutExpired:site.kill()
        server.shutdown();server.server_close()

if __name__=="__main__":main()

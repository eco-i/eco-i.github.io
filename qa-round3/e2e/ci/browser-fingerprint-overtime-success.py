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
                external=[];js_errors=[]
                page.on("pageerror",lambda e:js_errors.append(str(e)[:100]))
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
                with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=15000) as resp:
                    page.locator("#saveOvertimeBtn").click()
                check(resp.value.status==200,"real overtime Save HTTP success")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                  state.overtimeEntries.some(r=>r.work_date==='2027-05-13' && r.minutes===10)""",
                  timeout=20000)
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==10,
                      "Save button committed synthetic overtime in PostgreSQL")
                check(OVERTIME_HITS==[10],"one overtime write, no duplicated mutation")
                adjustment.click()
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="20분",
                      "existing 10-minute plan edited through actual +10 control")
                with page.expect_response(lambda x:urlsplit(x.url).path.endswith("/rest/v1/rpc/save_my_overtime_day_v2"),timeout=15000) as resp:
                    page.locator("#saveOvertimeBtn").click()
                check(resp.value.status==200,"actual overtime modification HTTP success")
                page.wait_for_function("""()=>!overtimeDaySavePending &&
                  state.overtimeEntries.some(r=>r.work_date==='2027-05-13' && r.minutes===20)""",
                  timeout=20000)
                check(br.value("SELECT minutes FROM public.qa_browser_overtime WHERE work_date=%s::date AND slot='early'",(OT_DATE,))==20,
                      "overtime second Save committed modification, not just first insertion")
                check(OVERTIME_HITS==[10,20],"exactly two intended writes")
                # Separate real user path: month overtime summary -> existing row's
                # visible "수정" button -> date detail -> update saved record.
                page.get_by_role("button",name="날짜 상세 닫기").click()
                page.locator("#detailBackdrop.open").wait_for(state="hidden",timeout=6000)
                page.locator("#overtimeSummaryMain").click()
                page.locator("#overtimeListBackdrop.open").wait_for(timeout=12000)
                list_edit=page.locator('#overtimeListBody button[data-overtime-list-edit]')
                list_edit.first.wait_for(state="visible",timeout=12000)
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
                check(page.locator("#overtimeEarlyTime").text_content().strip()=="40분",
                      "stale-tab draft remains editable before conflicting server change")
                another_tab_minutes=br.value("""UPDATE public.qa_browser_overtime
                  SET minutes=50,
                  updated_at=GREATEST(clock_timestamp(),updated_at + INTERVAL '1 microsecond')
                  WHERE employee_id=2 AND work_date=%s::date AND slot='early'
                  RETURNING minutes""",(OT_DATE,))
                check(another_tab_minutes==50,
                      "second synthetic tab has newer 50-minute PG record")
                before_stale_mutation_count=len(OVERTIME_HITS)
                page.locator("#saveOvertimeBtn").click()
                page.wait_for_function("""()=>!overtimeDaySavePending
                   && document.getElementById('overtimeDetailError')?.textContent.includes('다른 창')""",
                   timeout=14000)
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

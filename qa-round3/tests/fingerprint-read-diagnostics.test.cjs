'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function fingerprintReadFailureText(');
const end=html.indexOf('async function loadFingerprintRecords(',start);
assert.ok(start>=0&&end>start);
const ctx={};
vm.runInNewContext(html.slice(start,end),ctx,{timeout:1500});
const classify=ctx.fingerprintReadFailureText;
const cases=[
 [{message:'Could not find the function public.list_my_fingerprint_records in schema cache'},'서버 스키마'],
 [{message:'지문 기록 응답 형식이 올바르지 않습니다.'},'형식'],
 [{message:'SESSION_EXPIRED'},'로그인 세션'],
 [{message:'TimeoutError'},'네트워크'],
 [{message:'permission denied for table fingerprint_punch_records'},'권한'],
 [{message:'SOME_UNKNOWN_INTERNAL_ERROR'},'서버 조회']
];
cases.forEach(([input,match],i)=>test('safe fingerprint read diagnostic #'+(i+1),()=>{
 const result=classify(input);
 assert.ok(result.includes(match),result);
 assert.ok(!result.includes(input.message));
}));
test('no raw server text or photo/token visible',()=>{
 const sensitive='TOP_SECRET_TOKEN_EMPLOYEE_PHOTO_BYTES';
 const result=classify({message:'Invalid error '+sensitive});
 assert.ok(!result.includes(sensitive));
});
test('actual metadata catch displays categorized error only on current opened date',()=>{
 const fn=html.slice(end,html.indexOf('function fingerprintBase64FromDataUrl(',end));
 assert.match(fn,/if\(!stillCurrent\(\)\)return false;/);
 assert.match(fn,/state\.fingerprintBackendReady=false/);
 assert.match(fn,/fingerprintReadFailureText\(e\)/);
 assert.match(fn,/state\.view!=='mine'/);
 assert.ok(!fn.includes('textContent=String(e'));
});
test('diagnostics never weaken actual photo write CAS',()=>{
 const fn=html.slice(html.indexOf('async function handleFingerprintPhotoInput('),html.indexOf('async function ',html.indexOf('async function handleFingerprintPhotoInput(')+8));
 assert.ok(fn.includes("rpc('save_my_fingerprint_photo'"));
 assert.ok(fn.includes('p_expected_updated_at:expectedUpdatedAt'));
});
console.log('QA_FINGERPRINT_METADATA_FAILURE_DIAGNOSTICS_SCOPED_PASS');

test('fatal month prerequisite failure clears orphaned fingerprint loading without write', async()=>{
 const monthSource=html.slice(html.indexOf('async function loadMonthData('),html.indexOf('// authoritative 전체 동기화 경로',html.indexOf('async function loadMonthData(')));
 assert.ok(monthSource.includes('fingerprintStepStarted'));
 const label={textContent:''};
 let renderCount=0;
 const scenario={
  sessionContextEpoch:0,monthDataLoadSeq:0,fingerprintLoadSeq:8,fingerprintReadFailureMessage:'',attendanceMonthContextKey:'',
  state:{me:{employee_id:2},sessionToken:'synthetic',year:2026,month:10,selectedDate:'2026-10-21',
   fingerprintBackendReady:null,view:'mine',refreshing:false,attendance:[]},
  sharedSessionContextCurrent:()=>true,
  monthBounds:()=>({from:'2026-10-01',to:'2026-10-31'}),
  loadMaintenanceSchedule:async()=>true,
  configured:()=>true,
  listAttendanceWithAnnualLeave:async()=>{throw new Error('QA_SYNTHETIC_UPSTREAM_READ_FAILURE')},
  renderFingerprintDetail:()=>{renderCount++},
  handleConfirmedSessionExpiryAfterRpc:async()=>false,
  $:id=>id==='statusLine'?label:{classList:{contains:()=>id==='detailBackdrop'}}
 };
 vm.runInNewContext(monthSource,scenario,{timeout:1500});
 const ok=await scenario.loadMonthData();
 assert.equal(ok,false);
 assert.equal(scenario.state.fingerprintBackendReady,false);
 assert.match(scenario.fingerprintReadFailureMessage,/지문 기록 조회를 시작하지 못했습니다/);
 assert.equal(scenario.state.refreshing,false);
 assert.ok(renderCount>0);
 assert.ok(!scenario.fingerprintReadFailureMessage.includes('QA_SYNTHETIC'));
});
test('do not clobber a concurrent or previously successful fingerprint read on prefix failure',async()=>{
 const monthSource=html.slice(html.indexOf('async function loadMonthData('),html.indexOf('// authoritative 전체 동기화 경로',html.indexOf('async function loadMonthData(')));
 for(const priorReady of [null,true]){
  const status={textContent:''};
  const scenario={
   sessionContextEpoch:0,monthDataLoadSeq:0,fingerprintLoadSeq:8,fingerprintReadFailureMessage:'',attendanceMonthContextKey:'',
   state:{me:{employee_id:2},sessionToken:'synthetic',year:2026,month:10,
    fingerprintBackendReady:priorReady,view:'mine',refreshing:false,attendance:[],selectedDate:null},
   sharedSessionContextCurrent:()=>true,monthBounds:()=>({from:'2026-10-01',to:'2026-10-31'}),
   loadMaintenanceSchedule:async()=>true,configured:()=>true,
   listAttendanceWithAnnualLeave:async()=>{scenario.fingerprintLoadSeq++;throw new Error('QA_SYNTHETIC_UPSTREAM_READ_FAILURE')},
   handleConfirmedSessionExpiryAfterRpc:async()=>false,
   $:()=>status
  };
  vm.runInNewContext(monthSource,scenario,{timeout:1500});
  assert.equal(await scenario.loadMonthData(),false);
  assert.equal(scenario.state.fingerprintBackendReady,priorReady);
  assert.equal(scenario.fingerprintReadFailureMessage,'');
 }
});
test('fingerprint already synced but whole-page freshness pending is not mislabeled as fingerprint read',()=>{
 const start=html.indexOf('function renderFingerprintDetail('),end=html.indexOf('async function resyncFingerprintAfterMutation(',start);
 const dom={};
 const el=id=>dom[id]||(dom[id]={textContent:'',disabled:false,checked:false,setAttribute(){},classList:{toggle(){}}});
 const scenario={
  state:{fingerprintBackendReady:true,personnelBackendReady:true,refreshing:false},
  pageLifecycleFreshnessPending:true,refreshPendingOwner:0,fingerprintPickerFlowActive:false,
  fingerprintPhotoPending:false,fingerprintConfirmPending:false,fingerprintViewPending:false,
  fingerprintReadFailureMessage:'',
  configured:()=>true,pageLifecycleWriteFreshnessReady:()=>false,
  accountReadOnly:()=>false,fingerprintRecordForDate:()=>null,fingerprintPersonnelReady:()=>true,
  fingerprintDateNotFuture:()=>true,fingerprintDateOperational:()=>true,fingerprintKindHas:()=>false,
  fingerprintKindLabel:kind=>kind, $:el
 };
 vm.runInNewContext(html.slice(start,end),scenario,{timeout:1500});
 scenario.renderFingerprintDetail('2026-10-21');
 assert.match(el('fingerprintDetailError').textContent,/다른 최신 데이터 동기화/);
 assert.doesNotMatch(el('fingerprintDetailError').textContent,/지문 기록을 불러오는 중/);
 assert.equal(el('fingerprintClockInUploadBtn').disabled,true);
 scenario.state.fingerprintBackendReady=false;
 scenario.fingerprintReadFailureMessage='분류된 지문 조회 오류';
 scenario.renderFingerprintDetail('2026-10-21');
 assert.equal(el('fingerprintDetailError').textContent,'분류된 지문 조회 오류');
 assert.equal(el('fingerprintClockInUploadBtn').disabled,true);
 scenario.state.fingerprintBackendReady=null;
 scenario.renderFingerprintDetail('2026-10-21');
 assert.match(el('fingerprintDetailError').textContent,/지문 기록을 불러오는 중/);
});

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');

function extract(begin,end){
  const i=html.indexOf(begin),j=html.indexOf(end,i);
  assert.ok(i>0&&j>i&&html.indexOf(begin,i+1)<0,'unique QA source anchor: '+begin);
  return html.slice(i,j);
}
const reader=extract('async function loadHolidayWorkEligibility(', '\nasync function loadEmployees(){');
const writer=extract('async function changeHolidayWorkEligibility(', '\nfunction openResetCurrentPins(){');
new vm.Script(reader+'\n'+writer,'holiday-eligibility-qa-v2-parse');

function scenario({online=true,rows=null,readFailure=false,write='success',revision=7,hasVersion=true}={}){
  const employee={id:2,display_name:'가상 직원',holiday_work_enabled:false};
  if(hasVersion)employee.holiday_work_eligibility_revision=revision;
  const serverRows=rows??[{employee_id:2,holiday_work_enabled:false,eligibility_revision:7}];
  const state={me:{employee_id:1,is_admin:true},employees:[employee],
    sessionToken:'QA_SYNTHETIC_ONLY',personnelBackendReady:true,
    holidayWorkEligibilityReady:true};
  const requests=[],toasts=[],changes=[],local=[],render=[];
  const elements={};
  const input={dataset:{holidayWorkEnabled:'2'},checked:true,disabled:false,isConnected:true};
  const env={
    state,console,
    document:{hidden:false},sessionContextEpoch:1,fingerprintPageLifecycleEpoch:1,
    holidayEligibilityLoadSeq:0,holidayWorkEligibilityPendingIds:new Set(),
    realtimeNeedsCatchup:false,
    configured:()=>online,localEmployees:()=>[{id:2,holiday_work_enabled:false}],
    activeAdminMode:()=>true,personnelMutationReady:()=>true,
    todayKey:()=> '2026-10-22',
    isHolidayWorkEmployee:()=>true,employeeOperationalOn:()=>true,
    pageLifecycleWriteFreshnessReady:()=>true,
    sharedSessionContextCurrent:()=>true,sessionContextCurrent:()=>true,
    showToast:(msg,kind)=>toasts.push({msg,kind}),
    showLoading:(v)=>changes.push(['loading',v]),
    renderEmployeeManager:()=>render.push('manager'),
    confirmMutationWithSessionGuard:()=>true,
    strictTrueMutationResultRpc:(v)=>{if(v!==true)throw Error('BAD_BOOLEAN')},
    scheduleRealtimeRefresh:()=>{},userSafeServiceError:(e)=>String(e?.message||e),
    mutationResultUncertainAfterResyncText:()=> 'uncertain',
    errorText:(e)=>String(e?.message||e),
    localEmployees:()=>[{id:2,holiday_work_enabled:false}],
    saveLocalEmployees:(rows)=>local.push(rows),
    pushLocalAudit:()=>{},
    validRpcObjectRowList:(rows)=>Array.isArray(rows)&&rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r)),
    rpc:async(name,payload)=>{
      requests.push({name,payload});
      if(name==='list_holiday_work_eligibility_v2'){
        if(readFailure)throw Error('QA_SERVER_READ_500');
        return serverRows;
      }
      if(name==='admin_set_holiday_work_enabled_v2'){
        if(write==='stale')throw Object.assign(new Error('STALE_HOLIDAY_ELIGIBILITY'),{rpcCode:'PT409',httpStatus:409});
        if(write==='failed')throw Error('QA_WRITE_FAILED');
        return true;
      }
      throw Error('QA_UNEXPECTED_RPC:'+name);
    }
  };
  let ctx=vm.createContext(env);
  env.loadEmployees=async()=>{
    const read=await vm.runInContext('loadHolidayWorkEligibility(new Map([[2,false]]))',ctx);
    changes.push(['refreshed',read]);
    return read;
  };
  env.loadEmployeesBestEffortForAccountSync=env.loadEmployees;
  vm.runInContext(reader+'\n'+writer,ctx);
  return {ctx,employee,state,requests,toasts,input,changes,render,local,};
}

function driveReader({rows=null,readFailure=false,online=true}={}){
 const w=scenario({rows,readFailure,online});
 return {w,run:()=>vm.runInContext('loadHolidayWorkEligibility(new Map([[2,false]]))',w.ctx)};
}
test('versioned read accepts boolean + monotonic integer revision, stores both',async()=>{
 const {w,run}=driveReader();
 assert.equal(await run(),true);
 assert.deepEqual(w.requests.map(x=>x.name),['list_holiday_work_eligibility_v2']);
 assert.equal(w.state.holidayWorkEligibilityReady,true);
 assert.equal(w.employee.holiday_work_enabled,false);
 assert.equal(w.employee.holiday_work_eligibility_revision,7);
});
test('missing, negative, string or unsafe revision fails closed',async()=>{
 for(const value of [undefined,-1,'7',2**53,null,1.5]){
  const row={employee_id:2,holiday_work_enabled:true};
  if(value!==undefined)row.eligibility_revision=value;
  const {w,run}=driveReader({rows:[row]});
  assert.equal(await run(),false,'should reject '+value);
  assert.equal(w.state.holidayWorkEligibilityReady,false);
  assert.equal(w.employee.holiday_work_enabled,false,'last known display remains');
 }
});
test('missing or duplicate employee row cannot enable writes',async()=>{
 for(const rows of [[],[{employee_id:2,holiday_work_enabled:true,eligibility_revision:7},{employee_id:2,holiday_work_enabled:true,eligibility_revision:7}],[{employee_id:9,holiday_work_enabled:true,eligibility_revision:7}]]){
  const {w,run}=driveReader({rows});
  assert.equal(await run(),false);
  assert.equal(w.state.holidayWorkEligibilityReady,false);
 }
});
test('valid confirmed toggle sends four args including exact cached revision and re-reads',async()=>{
 const w=scenario();
 await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
 const call=w.requests.find(x=>x.name==='admin_set_holiday_work_enabled_v2');
 assert.ok(call,'write RPC must be dispatched');
 assert.deepEqual(JSON.parse(JSON.stringify(call.payload)),{
  p_token:'QA_SYNTHETIC_ONLY',p_employee_id:2,p_enabled:true,p_expected_revision:7
 });
 assert.ok(w.requests.some(x=>x.name==='list_holiday_work_eligibility_v2'));
 assert.equal(w.state.holidayWorkEligibilityReady,true);
 assert.equal(w.input.disabled,false);
 assert.ok(w.toasts.some(x=>x.kind==='success'));
});
test('missing or unsafe cached revision prevents write before confirmation',async()=>{
 for(const revision of [undefined,-1,'0',Infinity]){
  const w=scenario({revision,hasVersion:revision!==undefined});
  await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
  assert.equal(w.requests.filter(x=>x.name==='admin_set_holiday_work_enabled_v2').length,0);
  assert.equal(w.state.holidayWorkEligibilityReady,false);
  assert.ok(w.toasts.some(x=>x.msg.includes('최신 버전')));
 }
});
test('PT409 stale rejection: exactly one write, fresh read, no false success or retry',async()=>{
 const w=scenario({write:'stale',rows:[{employee_id:2,holiday_work_enabled:true,eligibility_revision:8}]});
 await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
 assert.equal(w.requests.filter(x=>x.name==='admin_set_holiday_work_enabled_v2').length,1);
 assert.equal(w.requests.filter(x=>x.name==='list_holiday_work_eligibility_v2').length,1);
 assert.equal(w.employee.holiday_work_enabled,true);
 assert.equal(w.employee.holiday_work_eligibility_revision,8);
 assert.ok(w.toasts.some(x=>x.msg.includes('다른 관리자')&&x.kind==='error'));
 assert.ok(!w.toasts.some(x=>x.kind==='success'));
 assert.equal(w.input.disabled,false);
});
test('stale rejection with failed authoritative re-read locks future writes',async()=>{
 const w=scenario({write:'stale',readFailure:true});
 await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
 assert.equal(w.state.holidayWorkEligibilityReady,false);
 assert.equal(w.requests.filter(x=>x.name==='admin_set_holiday_work_enabled_v2').length,1);
 assert.ok(w.toasts.some(x=>x.msg.includes('새로고침')&&x.kind==='error'));
 assert.equal(w.input.disabled,true);
 await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
 assert.equal(w.requests.filter(x=>x.name==='admin_set_holiday_work_enabled_v2').length,1);
});
test('generic server failure never treated as stale or as successful mutation',async()=>{
 const w=scenario({write:'failed'});
 await vm.runInContext('changeHolidayWorkEligibility(qaInput)',Object.assign(w.ctx,{qaInput:w.input}));
 assert.equal(w.requests.filter(x=>x.name==='list_holiday_work_eligibility_v2').length,0);
 assert.ok(!w.toasts.some(x=>x.kind==='success'));
});
test('offline preview does not try server v2 endpoints',async()=>{
 const {w,run}=driveReader({online:false});
 assert.equal(await run(),true);
 assert.equal(w.requests.length,0);
 assert.equal(w.employee.holiday_work_eligibility_revision,0);
});

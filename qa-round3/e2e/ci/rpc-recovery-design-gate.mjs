#!/usr/bin/env node
// PUBLIC SAFE DESIGN GATE ONLY. No SQL creation, DB/API calls, auth tokens, or deployment.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const CONTRACT='qa-round3/e2e/ci/missing-rpc-recovery-contracts.json';
const MATRIX='qa-round3/e2e/ci/rpc-recovery-acceptance-matrix.json';
const fail=(message)=>{throw new Error('RPC_RECOVERY_DESIGN_BLOCKED: '+message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const uniq=(a)=>[...new Set(a)];
const expectedCases=[
 'VALIDATE_SERVER_SESSION','DENY_INACTIVE_OR_REVOKED_SESSION',
 'EXECUTE_AND_RLS_POLICY_REVIEW','RESPONSE_TYPE_AND_ERROR_CONTRACT'
];
const domainTests={
 personnel:['PERSONNEL_HISTORY_PRESERVED','EFFECTIVE_DATE_BOUNDARY','ADMIN_ROLE_RACE_PROTECTION'],
 pin:['PIN_CONFIRMATION_AND_LAST_ADMIN','SESSION_REVOCATION_ON_RESET','PREVIEW_APPLY_REVISION_RECHECK'],
 global_restore:['PREVIEW_APPLY_REVISION_RECHECK','DATA_REFERENTIAL_INTEGRITY','WHOLE_OPERATION_ROLLBACK','INVALID_PAYLOAD_NO_WRITES'],
 self_restore:['SELF_ONLY_RESTORE_BOUNDS','PREVIEW_APPLY_REVISION_RECHECK','INVALID_PAYLOAD_NO_WRITES'],
 holiday:['SHIFT_DAY_ELIGIBILITY','HOLIDAY_SCHEDULE_RACE','EMPLOYEE_SCOPE_AND_TIME_VALIDATION'],
 events:['EVENT_ROW_VERSION_AND_RANGE','AUDIT_ATOMIC_WITH_WRITE'],
 memo:['SELF_ONLY_ROW_SCOPE','DRAFT_PRESERVED_ON_REJECT','MULTI_DELETE_ALL_OR_NONE'],
 annual:['YEAR_AND_MINUTE_RANGE','LEAVE_BALANCE_INVARIANT'],
 long_service:['SERVICE_DATE_AND_EXCLUSION_VALIDATION','LEAVE_BALANCE_INVARIANT']
};
const readOnlyNames=new Set([
 'get_personnel_restore_revision_v1','preview_admin_reset_data_v2',
 'preview_current_personnel_pin_reset_v1','preview_data_restore_v2',
 'preview_safety_backup_restore_v2'
]);
const allowedTop=['schemaVersion','sourceManifest','sourceMainHeadSha','purpose',
 'sourceSqlRecovered','releaseAllowed','independentQaBackendAvailable',
 'isolatedFullE2eVerified','lastOfficialBlock','nextBlock','round3ProductDefects',
 'acceptanceStatus','counts','items'];
const allowedItem=['name','domain','riskTier','operation','requiredServerAuthorization',
 'clientExpectedKeys','serverConflictContract','requiredIsolatedE2ECases',
 'designStage','serverImplementationSource','verifiedIndependentQAE2E'];
function keysExact(obj,allowed,label){
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||
    !same(Object.keys(obj).sort(),[...allowed].sort()))fail(label+': unexpected/missing fields');
}
function requireCases(actual,required,label){
 if(!Array.isArray(actual)||uniq(actual).length!==actual.length||
   !actual.every(x=>typeof x==='string'&&/^[A-Z0-9_]+$/.test(x))||
   !required.every(x=>actual.includes(x)))fail(label+': missing mandatory QA failure scenarios');
}
function validate(contract,matrix){
 keysExact(matrix,allowedTop,'matrix');
 if(contract.schemaVersion!==1||contract.releaseAllowed!==false||
    contract.items?.length!==26||contract.counts?.directProductionCallsites!==31)
    fail('original call contract is no longer the locked 26/31 unapproved snapshot');
 if(matrix.schemaVersion!==1||matrix.sourceManifest!==CONTRACT||
   matrix.sourceMainHeadSha!==contract.mainHeadSha||
   matrix.purpose!=='SAFE_PUBLIC_TEST_REQUIREMENTS_NOT_PRIVATE_SQL_OR_IMPL'||
   matrix.sourceSqlRecovered!==false||matrix.releaseAllowed!==false||
   matrix.independentQaBackendAvailable!==false||matrix.isolatedFullE2eVerified!==false||
   matrix.lastOfficialBlock!=='3-8-53'||matrix.nextBlock!=='3-8-54_BLOCKED'||
   matrix.round3ProductDefects!==37||
   matrix.acceptanceStatus!=='DESIGN_DRAFT_IMPLEMENTATION_BLOCKED')
   fail('unsafe design / release / E2E assertion');
 if(!Array.isArray(matrix.items)||matrix.items.length!==26)fail('missing function designs');
 const src=new Map(contract.items.map(i=>[i.name,i]));
 const observed=new Set();
 let mutations=0,reads=0,p0=0,p1=0;
 const noExpected=[];
 for(const item of matrix.items){
   keysExact(item,allowedItem,item?.name||'item');
   const lock=src.get(item.name);
   if(!lock||observed.has(item.name))fail('unknown or duplicate RPC name');
   observed.add(item.name);
   if(!Object.hasOwn(domainTests,item.domain))fail(item.name+': unknown domain');
   const readOnly=readOnlyNames.has(item.name);
   const tier=lock.releaseImpact==='high_consequence_review'?'P0':'P1';
   if(item.riskTier!==tier)fail(item.name+': severity downgraded');
   if(item.operation!==(readOnly?'READ_ONLY':'MUTATION'))fail(item.name+': wrong write scope');
   if(item.designStage!=='ACCEPTANCE_SPEC_ONLY'||
      item.serverImplementationSource!=='NOT_AVAILABLE'||
      item.verifiedIndependentQAE2E!==false)fail(item.name+': unproven implementation asserted');
   const cas=lock.clientPayloadKeys.filter(x=>/^p_expected/.test(x));
   if(!same(item.clientExpectedKeys,cas))fail(item.name+': source client CAS inventory drift');
   const strategy=readOnly?'READ_ONLY_NO_MUTATION':
     cas.length?'ATOMIC_SERVER_COMPARE_REQUIRED_UNVERIFIED':
     'NO_CLIENT_EXPECTED_ARGUMENT_DESIGN_UNRESOLVED';
   if(item.serverConflictContract!==strategy)fail(item.name+': invalid concurrency design state');
   if(!['ADMIN_SERVER_CHECK','SELF_SERVER_OWNER_CHECK','CONTEXTUAL_ROLE_REVIEW_REQUIRED'].includes(item.requiredServerAuthorization))
     fail(item.name+': missing server-side authorization plan');
   if(item.name.startsWith('admin_')&&item.requiredServerAuthorization!=='ADMIN_SERVER_CHECK')
     fail(item.name+': admin authorization skipped');
   if(item.name==='preview_data_restore_v2'&&item.requiredServerAuthorization!=='CONTEXTUAL_ROLE_REVIEW_REQUIRED')
     fail(item.name+': contextual preview access unreviewed');
   const tests=[...expectedCases,...domainTests[item.domain]];
   if(item.requiredServerAuthorization==='ADMIN_SERVER_CHECK')
     tests.push('DENY_NONADMIN_AT_SERVER','ADMIN_PERMISSION_RECHECK_INSIDE_TX');
   if(item.requiredServerAuthorization==='SELF_SERVER_OWNER_CHECK')
     tests.push('DENY_OTHER_EMPLOYEE_DATA');
   if(item.requiredServerAuthorization==='CONTEXTUAL_ROLE_REVIEW_REQUIRED')
     tests.push('CONFIRM_PREVIEW_SELF_OR_ADMIN_SCOPE');
   if(readOnly){
     reads++;tests.push('PREVIEW_OR_QUERY_READ_ONLY','NO_SIDE_EFFECT_ON_DENIED_READ');
   }else{
     mutations++;
     tests.push('DENY_INVALID_INPUT_WITHOUT_WRITE','FAILURE_ROLLBACK_NO_PARTIAL_COMMIT',
       'REAL_TWO_SESSION_RACE','SUCCESS_READBACK_MATCHES_COMMIT','REPLAY_NO_UNINTENDED_SECOND_WRITE');
     if(cas.length)tests.push('CLIENT_EXPECTED_CAS_ATOMIC_COMPARE','STALE_EXPECTED_CONFLICT_NO_WRITE');
     else{
       noExpected.push(item.name);
       tests.push('NO_CLIENT_CAS_INTEGRITY_DESIGN_BLOCKER','CONCURRENT_STALE_REQUEST_NO_UNINTENDED_WRITE');
     }
   }
   requireCases(item.requiredIsolatedE2ECases,tests,item.name);
   if(tier==='P0')p0++;else p1++;
 }
 if(observed.size!==src.size)fail('not all client RPCs have designs');
 const counts={total:26,mutations,reads,withoutExpected:noExpected,P0:p0,P1:p1};
 if(!same(matrix.counts,counts))fail('matrix summary mismatches actual 26 items');
 if(noExpected.length!==2||
    !noExpected.includes('admin_cancel_personnel_batch_v2')||
    !noExpected.includes('admin_set_holiday_work_enabled_v2'))
    fail('server-side missing CAS-input blockers changed');
 return {scope:'SAFE_PUBLIC_DESIGN_MATRIX_STATIC_ONLY',status:'DESIGN_MATRIX_VALIDATED',
   ...counts,implementationReady:false,isolatedQAE2ePassed:false,
   productionServerNamesRestored:false,officialBlock53Completed:true,
   block54Started:false,releaseApproved:false};
}
const source=JSON.parse(fs.readFileSync(CONTRACT,'utf8'));
const plan=JSON.parse(fs.readFileSync(MATRIX,'utf8'));
function negativeTest(change){
 const altered=structuredClone(plan);change(altered);
 assert.throws(()=>validate(source,altered),/RPC_RECOVERY_DESIGN_BLOCKED/);
}
if(process.argv[2]==='--self-test'){
 assert.equal(validate(source,plan).total,26);
 negativeTest(p=>p.items.pop());
 negativeTest(p=>p.releaseAllowed=true);
 negativeTest(p=>p.items[0].verifiedIndependentQAE2E=true);
 negativeTest(p=>p.items[0].clientExpectedKeys=[]);
 negativeTest(p=>p.items.find(x=>x.name==='admin_cancel_personnel_batch_v2').requiredIsolatedE2ECases=[]);
 negativeTest(p=>p.items.find(x=>x.name==='save_my_memo_v2').riskTier='P0');
 negativeTest(p=>p.items[0].rawSql='FORBIDDEN');
 console.log('RPC_RECOVERY_DESIGN_SELF_TEST_PASS: 7 fail-closed mutants rejected');
}else if(process.argv[2]==='audit'){
 const result=validate(source,plan);
 const out=path.join(process.env.RUNNER_TEMP||process.cwd(),'rpc-recovery-design-static-only.json');
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log('RPC_RECOVERY_DESIGN_STATIC_PASS: 26 functions, 21 mutations, 5 read-only, 2 unresolved no-CAS-input designs');
 console.log('RPC_RECOVERY_BACKEND_NOT_READY: no vetted SQL source, no real isolated E2E, no production changes');
 if(process.env.GITHUB_STEP_SUMMARY){
   fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
     '## 26 missing RPCs — safe acceptance design audit only\n\n'+
     '- **26/26** behavior contracts accounted for; P0 14 / P1 12, 21 mutations / 5 read-only.\n'+
     '- **2** mutation RPCs lack a client expected-state argument; server design remains unresolved.\n'+
     '- **No vetted SQL, independent authenticated E2E, Supabase API call or installation.**\n'+
     '- **3-8-54 NOT STARTED / overall NOT CLEAN / release BLOCKED.**\n');
 }
}else fail('usage: node rpc-recovery-design-gate.mjs --self-test | audit');

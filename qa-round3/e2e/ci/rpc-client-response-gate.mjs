#!/usr/bin/env node
// QA CLIENT response contract verification only; NO SQL, backend calls, or data mutation.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const INPUT='qa-round3/e2e/ci/missing-rpc-recovery-contracts.json';
const LOCK='qa-round3/e2e/ci/rpc-recovery-client-response-contracts.json';
const fail=s=>{throw new Error('FAIL_CLOSED_RPC_RESPONSE_CONTRACT: '+s);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function git(dir,...args){return execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();}
function getFunction(source,name){
 const lines=source.split('\n');
 const at=lines.findIndex(s=>s.startsWith('function '+name+'('));
 if(at<0)fail('client validator/helper absent: '+name);
 let end=at;
 if(!lines[at].trimEnd().endsWith('}')){
   end=lines.findIndex((s,i)=>i>at&&s==='}');
   if(end<0)fail('unclosed source function '+name);
 }
 return lines.slice(at,end+1).join('\n');
}
function requireThrows(fn,description){
 let rejected=false;try{fn();}catch(e){rejected=true;}
 if(!rejected)fail('invalid browser response accepted: '+description);
}
function validatorRuntime(main){
 const names=['lsParseISO','strictRpcInteger','strictRpcTimestamp',
 'validDataRpcTimestamp','dataRpcPlainObject','dataRpcExactSections','dataRpcRevision',
 'dataRpcCountMap','strictDataRestorePreviewRpc','strictDataResetPreviewRpc',
 'strictSafetyRestorePreviewRpc','strictPinResetPreviewRpc',
 'strictPersonnelRestoreRevisionRpc','strictTrueMutationResultRpc',
 'strictPositiveIdMutationResultRpc','strictPersonnelTrueMutationResultRpc',
 'strictPersonnelBatchMutationResultRpc','strictDataMutationResultRpc',
 'strictPinResetResultRpc'];
 const adminLine=main.split('\n').find(s=>s.startsWith('const ADMIN_DATA_SECTION_KEYS='));
 if(!adminLine||!adminLine.endsWith(';'))fail('client data section constants missing');
 const code=[adminLine,...names.map(n=>getFunction(main,n)),
 'globalThis.browserValidators={'+names.map(x=>x+':'+x).join(',')+'};'].join('\n');
 const sandbox=Object.create(null);
 vm.runInNewContext(code,sandbox,{timeout:1500});
 return sandbox.browserValidators;
}
const VALID_CLASSES=new Map([
 ['boolean_true','strictTrueMutationResultRpc'],
 ['positive_id_matching_existing_if_update','strictPositiveIdMutationResultRpc'],
 ['batch_id_and_count','strictPersonnelBatchMutationResultRpc'],
 ['integer_matches_preview_target_count','strictPinResetResultRpc'],
 ['hex32_revision','strictPersonnelRestoreRevisionRpc'],
 ['section_array_and_hex32_revision','strictDataResetPreviewRpc'],
 ['target_count_and_hex32_revision','strictPinResetPreviewRpc'],
 ['per_scope_section_counts_and_hex32_revision','strictDataRestorePreviewRpc'],
 ['data_reset_summary_with_safety_backup','strictDataMutationResultRpc'],
 ['data_restore_summary_with_safety_backup','strictDataMutationResultRpc'],
 ['safety_restore_summary_with_source_id','strictDataMutationResultRpc'],
 ['data_restore_summary_personal','strictDataMutationResultRpc']
]);
const revision='a'.repeat(32);
const section='attendance';
const counts={attendance:2};
const restorePreview=scope=>({backup_type:scope,exported_at:'2026-10-21T10:00:00Z',
 sections:{attendance:{backup_count:3,current_count:2,change_estimate:1}},current_revision:revision});
function fixtureTest(v,item){
 const name=item.name,fmt=item.responseShapeClass;
 const assertPass=(fn,desc)=>{try{fn();}catch(e){fail(name+' valid '+desc+' rejected: '+String(e));}};
 switch(fmt){
  case 'boolean_true':{
    const fn=v[item.clientSuccessValidator];
    assertPass(()=>fn(true),'true');
    requireThrows(()=>fn(false),name+' false');
    requireThrows(()=>fn(null),name+' null');
    break;
  }
  case 'positive_id_matching_existing_if_update':{
    const fn=v.strictPositiveIdMutationResultRpc;
    assertPass(()=>fn(42,{expectedId:42}),name);
    assertPass(()=>fn(42),name);
    requireThrows(()=>fn(0),name+' zero');
    requireThrows(()=>fn('42'),name+' string');
    requireThrows(()=>fn(43,{expectedId:42}),name+' stale id');
    break;
  }
  case 'batch_id_and_count':
    assertPass(()=>v.strictPersonnelBatchMutationResultRpc({batch_id:8,count:2},2),name);
    requireThrows(()=>v.strictPersonnelBatchMutationResultRpc({batch_id:8,count:1},2),name+' wrong count');
    requireThrows(()=>v.strictPersonnelBatchMutationResultRpc({batch_id:0,count:2},2),name+' invalid id');
    break;
  case 'integer_matches_preview_target_count':
    assertPass(()=>v.strictPinResetResultRpc(4,4),name);
    requireThrows(()=>v.strictPinResetResultRpc(3,4),name+' count mismatch');
    requireThrows(()=>v.strictPinResetResultRpc('4',4),name+' string');
    break;
  case 'hex32_revision':
    assertPass(()=>v.strictPersonnelRestoreRevisionRpc(revision),name);
    requireThrows(()=>v.strictPersonnelRestoreRevisionRpc('nonsense'),name+' bad revision');
    break;
  case 'section_array_and_hex32_revision':{
    const fn=item.clientSuccessValidator==='strictSafetyRestorePreviewRpc'?
       v.strictSafetyRestorePreviewRpc:v.strictDataResetPreviewRpc;
    assertPass(()=>fn({sections:[section],current_revision:revision},[section]),name);
    requireThrows(()=>fn({sections:[section],current_revision:'not-a-revision'},[section]),name+' stale revision shape');
    requireThrows(()=>fn({sections:[section,section],current_revision:revision},[section]),name+' duplicate section');
    break;
  }
  case 'target_count_and_hex32_revision':
    assertPass(()=>v.strictPinResetPreviewRpc({target_count:0,target_revision:revision}),name);
    requireThrows(()=>v.strictPinResetPreviewRpc({target_count:-1,target_revision:revision}),name+' negative');
    requireThrows(()=>v.strictPinResetPreviewRpc({target_count:1,target_revision:'bad'}),name+' revision');
    break;
  case 'per_scope_section_counts_and_hex32_revision':
    for(const scope of ['personal','admin']){
      assertPass(()=>v.strictDataRestorePreviewRpc(restorePreview(scope),scope,[section]),name+scope);
      requireThrows(()=>v.strictDataRestorePreviewRpc(restorePreview(scope),scope==='admin'?'personal':'admin',[section]),name+' cross-role scope '+scope);
      const invalid=restorePreview(scope);invalid.sections.attendance.change_estimate=-1;
      requireThrows(()=>v.strictDataRestorePreviewRpc(invalid,scope,[section]),name+' invalid section count '+scope);
    }
    break;
  case 'data_reset_summary_with_safety_backup':{
    const fn=v.strictDataMutationResultRpc,opts={safetyBackup:true};
    assertPass(()=>fn({reset:true,section_counts:counts,safety_backup_id:9},'reset',[section],opts),name);
    requireThrows(()=>fn({reset:false,section_counts:counts,safety_backup_id:9},'reset',[section],opts),name+' false');
    requireThrows(()=>fn({reset:true,section_counts:counts},'reset',[section],opts),name+' missing backup id');
    break;
  }
  case 'data_restore_summary_with_safety_backup':{
    const fn=v.strictDataMutationResultRpc,opts={safetyBackup:true};
    assertPass(()=>fn({restored:true,section_counts:counts,safety_backup_id:9},'restore',[section],opts),name);
    requireThrows(()=>fn({restored:false,section_counts:counts,safety_backup_id:9},'restore',[section],opts),name+' false');
    requireThrows(()=>fn({restored:true,section_counts:{} ,safety_backup_id:9},'restore',[section],opts),name+' count mismatch');
    break;
  }
  case 'safety_restore_summary_with_source_id':{
    const fn=v.strictDataMutationResultRpc,opts={safetyBackup:true,safetySourceId:7};
    const good={restored:true,section_counts:counts,sections:[section],safety_backup_id:9,restored_safety_backup_id:7};
    assertPass(()=>fn(good,'safety_restore',[section],opts),name);
    requireThrows(()=>fn({...good,restored_safety_backup_id:6},'safety_restore',[section],opts),name+' wrong source');
    requireThrows(()=>fn({...good,sections:['overtime']},'safety_restore',[section],opts),name+' wrong section');
    break;
  }
  case 'data_restore_summary_personal':{
    const fn=v.strictDataMutationResultRpc;
    assertPass(()=>fn({restored:true,section_counts:counts},'restore',[section]),name);
    requireThrows(()=>fn({restored:false,section_counts:counts},'restore',[section]),name+' false');
    requireThrows(()=>fn({restored:true,section_counts:{attendance:-1}},'restore',[section]),name+' negative count');
    break;
  }
  default:fail('unknown client response class '+fmt);
 }
}
function mainAudit(root,prod){
 const lock=JSON.parse(fs.readFileSync(path.join(root,INPUT),'utf8'));
 const spec=JSON.parse(fs.readFileSync(path.join(root,LOCK),'utf8'));
 const main=fs.readFileSync(path.join(prod,'index.html'),'utf8');
 if(lock.mainHeadSha!==git(prod,'rev-parse','HEAD')||lock.mainBlobSha!==git(prod,'hash-object','index.html'))
   fail('production main source moved since source manifest');
 if(spec.schemaVersion!==1||spec.scope!=='PUBLIC_CLIENT_SUCCESS_RESPONSE_CONTRACT_ONLY'||
  spec.sourceOfTruth!=='main/index.html at frozen mainBlobSha'||
  spec.sourceManifest!==INPUT||spec.mainHeadSha!==lock.mainHeadSha||
  spec.mainBlobSha!==lock.mainBlobSha||spec.sourceValidatorsInspected!==11||
  spec.rpcCount!==26||spec.directCallsites!==31||
  spec.actualBackendSQLRecovered!==false||spec.liveRpcNamesStillMissing!==26||
  spec.realAuthenticatedBackendE2ECompleted!==false||spec.releaseAllowed!==false||
  !same(spec.previewDataRestoreSplit,{personalCallsites:2,adminCallsites:2})||
  spec.items?.length!==26)fail('unverified server readiness or incomplete client response inventory');
 const validators=validatorRuntime(main),src=main.split('\n');
 const locked=new Map(lock.items.map(i=>[i.name,i])),seen=new Set();
 let checked=0,personal=0,admin=0;
 for(const item of spec.items){
   const baseline=locked.get(item.name);
   if(!baseline||seen.has(item.name))fail('duplicate/missing RPC response name '+item.name);
   seen.add(item.name);
   if(item.clientValidationObserved!==true||item.serverConformanceProven!==false||
     item.acceptanceStatus!=='CLIENT_ONLY_SOURCE_CONFIRMED')fail(item.name+' claimed live server validation');
   if(!same(item.mainCallsiteLines,baseline.directCallsites.map(x=>x.line)))fail(item.name+' source callsite drift');
   if(!VALID_CLASSES.has(item.responseShapeClass))fail(item.name+' unknown success shape');
   const expectedFn=VALID_CLASSES.get(item.responseShapeClass);
   if(item.responseShapeClass==='boolean_true'&&
      !['strictTrueMutationResultRpc','strictPersonnelTrueMutationResultRpc'].includes(item.clientSuccessValidator))
      fail(item.name+' incorrect boolean validator');
   else if(item.responseShapeClass!=='boolean_true'&&item.responseShapeClass!=='section_array_and_hex32_revision'&&
      item.clientSuccessValidator!==expectedFn)fail(item.name+' validator does not match expected response class');
   else if(item.responseShapeClass==='section_array_and_hex32_revision'&&
      !['strictDataResetPreviewRpc','strictSafetyRestorePreviewRpc'].includes(item.clientSuccessValidator))
      fail(item.name+' invalid preview validator');
   if(typeof validators[item.clientSuccessValidator]!=='function')fail(item.name+' validator absent');
   if(item.name!=='preview_data_restore_v2'&&item.scopeSpecificCallsites.length!==0)
      fail(item.name+' unexpected scope proof');
   for(const site of baseline.directCallsites){
     const line=site.line;
     if(!src[line-1]?.includes("rpc('"+item.name+"'"))fail(item.name+' call no longer matches anchored production line');
     const context=src.slice(line-1,line+32).join('\n');
     if(!context.includes(item.clientSuccessValidator+'('))fail(item.name+' browser validator disconnected from RPC result');
     checked++;
   }
   if(item.name==='preview_data_restore_v2'){
     if(item.scopeSpecificCallsites.length!==4)fail('dual-scope previews missing');
     for(const {line,scope} of item.scopeSpecificCallsites){
       if(![ 'personal','admin'].includes(scope)||!baseline.directCallsites.some(s=>s.line===line))
         fail('unrecognized preview scope');
       if(!src.slice(line-1,line+4).join('\n').includes("strictDataRestorePreviewRpc(preview,'"+scope+"'"))
         fail('personal/admin preview scope drift');
       if(scope==='personal')personal++;else admin++;
     }
   }
   fixtureTest(validators,item);
 }
 if(checked!==31||seen.size!==26||personal!==2||admin!==2)fail('source coverage incomplete');
 return {scope:'ACTUAL_BROWSER_VALIDATORS_SYNTHETIC_INPUTS',status:'CLIENT_RESPONSE_CONTRACT_PASS',
  rpcNamesChecked:26,callSitesChecked:checked,uniqueSuccessValidatorsChecked:11,
  personalPreviewPaths:personal,adminPreviewPaths:admin,
  clientFixtureTestsPassed:true,liveBackendContacted:false,
  actualSupabaseAuthRlsCasE2e:false,newServerSqlInstalled:false,
  block54Started:false,fullClean:false,releaseAllowed:false};
}
const mode=process.argv[2];
if(mode==='--self-test'){
 const livePath=process.argv[3];if(!livePath)fail('expected production source root');
 const src=fs.readFileSync(path.join(livePath,'index.html'),'utf8'),v=validatorRuntime(src);
 assert.equal(typeof v.strictDataRestorePreviewRpc,'function');
 assert.equal(v.strictPersonnelRestoreRevisionRpc(revision),revision);
 requireThrows(()=>v.strictPersonnelRestoreRevisionRpc('x'),'revision selftest');
 requireThrows(()=>v.strictTrueMutationResultRpc(1),'boolean selftest');
 console.log('RPC_RESPONSE_VALIDATOR_EXTRACTION_SELF_TEST_PASS');
}else if(mode==='audit'){
 const result=mainAudit(path.resolve(process.argv[3]||'qa'),path.resolve(process.argv[4]||'live-main'));
 fs.writeFileSync(path.join(process.env.RUNNER_TEMP||process.cwd(),'workmoa-client-response-validation.json'),JSON.stringify(result,null,2)+'\n');
 console.log('RPC_CLIENT_RESPONSE_CONTRACT_PASS: 26 names, 31 callsites, 11 original browser validators, personal/admin preview 2+2');
 console.log('BACKEND_RECOVERY_STILL_BLOCKED: missing 26 exact server SQL / actual Auth-RLS-CAS E2E incomplete');
 if(process.env.GITHUB_STEP_SUMMARY){
   fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   '## Actual application response validators — scoped synthetic tests only\n\n'+
   '- Client-side source: **26 RPC names / 31 callsites / 11 browser success validators**.\n'+
   '- Preview restore endpoint has **2 personal + 2 administrator callsites**; wrong scope responses rejected.\n'+
   '- **NO new SQL, no live Supabase contact, no real backend Auth/RLS/CAS E2E, no release.**\n');
 }
}else fail('usage: --self-test MAIN_ROOT or audit QA_ROOT MAIN_ROOT');

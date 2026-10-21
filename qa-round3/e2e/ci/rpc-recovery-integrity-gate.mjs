#!/usr/bin/env node
// Workmoa QA-only static RPC contract integrity gate.
// DOES NOT reconstruct SQL, run RPCs, contact Supabase, or authorize release.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const LOCK_FILE='qa-round3/e2e/ci/missing-rpc-recovery-contracts.json';
const expectedTotalNames=26,expectedTotalCallsites=31;

function fail(msg){throw new Error('FAIL_CLOSED_RPC_RECOVERY_CONTRACT: '+msg);}
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();}

function balancedObjectEnd(code,opening){
  let depth=0,q=null,escaped=false;
  for(let j=opening;j<Math.min(code.length,opening+20000);j++){
    const c=code[j];
    if(q){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===q){q=null;continue;}
      continue;
    }
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return j;
  }
  fail('unbalanced or excessively long RPC payload at position '+opening);
}
export function collectRpcCalls(code,names){
  const out=new Map([...names].map(n=>[n,[]]));
  const pattern=/\brpc\s*\(\s*(['"\x60])([a-z][a-z0-9_]*)\1\s*,\s*\{/gi;
  for(const m of code.matchAll(pattern)){
    const name=m[2];
    if(!out.has(name))continue;
    const opening=code.indexOf('{',m.index+m[0].length-1);
    if(opening<0||opening!==m.index+m[0].length-1)fail('RPC payload parse start mismatch: '+name);
    const end=balancedObjectEnd(code,opening);
    const segment=code.slice(opening,end+1);
    const fields=[...new Set([...segment.matchAll(/\b(p_[a-z0-9_]+)\s*:/gi)].map(x=>x[1]))].sort();
    out.get(name).push({line:code.slice(0,m.index).split('\n').length,fields});
  }
  return out;
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

function checkLockedContract(root,prodRoot){
  const lock=JSON.parse(fs.readFileSync(path.join(root,LOCK_FILE),'utf8'));
  if(lock.schemaVersion!==1||lock.releaseAllowed!==false||lock.liveProductionModified!==false||
     lock.identityAndPermissionValidated!==false||lock.correctnessAndCASValidated!==false||
     lock.realBackendE2eValidated!==false||lock.items?.length!==expectedTotalNames||
     lock.counts?.missingExactFunctions!==expectedTotalNames||
     lock.counts?.directProductionCallsites!==expectedTotalCallsites||
     lock.counts?.matchingOlderNameExists!==22||
     lock.counts?.olderNameWithDifferingArgumentNames!==19||
     lock.counts?.olderNameWithMatchingArgumentNamesOnly!==3||
     lock.counts?.olderNameMissing!==4)fail('metadata is incomplete, or has been marked approved without actual E2E');
  if(lock.mainHeadSha!==git(prodRoot,'rev-parse','HEAD'))fail('production main commit drift');
  if(lock.mainBlobSha!==git(prodRoot,'hash-object','index.html'))fail('production main index blob drift');
  const names=lock.items.map(item=>item.name);
  if(new Set(names).size!==26)fail('duplicate RPC names');
  const main=collectRpcCalls(fs.readFileSync(path.join(prodRoot,'index.html'),'utf8'),names);
  const qa=collectRpcCalls(fs.readFileSync(path.join(root,'index.html'),'utf8'),names);
  let total=0;
  const found=[];
  for(const item of lock.items){
    if(item.installedInPublic!==false||item.replacementApproved!==false||
       item.serverImplementationProvenance!=='not_available'||
       item.executedProductionMutation!==false||item.qaBackendE2eVerified!==false)
       fail(item.name+': unsafe assertion in recovery manifest');
    const wanted=[...item.clientPayloadKeys].sort();
    if(new Set(wanted).size!==wanted.length||!wanted.every(s=>/^p_[a-z0-9_]+$/.test(s))||
       !wanted.includes('p_token'))fail(item.name+': expected argument inventory invalid');
    if(item.sameBaseInstalled?.some(v=>v.name===item.name))fail(item.name+': latest name mistakenly marked installed');
    for(const [label,foundCallsites] of [['main',main.get(item.name)],['QA',qa.get(item.name)]]){
      if(foundCallsites.length!==item.directCallsites.length)
        fail(item.name+': '+label+' callsite count changed ('+foundCallsites.length+')');
      for(const call of foundCallsites){
        if(!same(call.fields,wanted))fail(item.name+': '+label+
          ' changed RPC payload keys; prior='+wanted.join(',')+' actual='+call.fields.join(','));
      }
      if(label==='main'&&!same(foundCallsites.map(c=>c.line),item.directCallsites.map(c=>c.line)))
        fail(item.name+': production main source line drift');
    }
    total+=main.get(item.name).length;
    found.push({rpc:item.name,calls:main.get(item.name).length,qaMatches:true,casKeys:wanted.filter(x=>/expected|revision/.test(x))});
  }
  if(total!==31)fail('main RPC callsite total drift');
  return {schemaVersion:1,scope:'STATIC_CONTRACT_ONLY_NOT_SERVER_SQL',
   mainCommit:lock.mainHeadSha,absentLiveNameSnapshotCount:26,
   namesInspected:26,directCallsInspected:total,qaDirectCallPayloadsMatch:true,
   generatedSql:false,actualSupabaseApiContact:false,serverImplementationProvenance:false,
   authenticatedE2e:false,releaseApproved:false,
   blockingLiveRpcNameMismatchUnresolved:true,contracts:found};
}

function selfTest(){
  const sample="rpc('save_a',{p_token:'x',p_expected:{revision:1},p_text:'ok'})\n"+
    "rpc('save_a',{p_token:'x',p_text:'ok',p_expected:null})";
  const out=collectRpcCalls(sample,['save_a']);
  assert.equal(out.get('save_a').length,2);
  assert.deepEqual(out.get('save_a')[0].fields,['p_expected','p_text','p_token']);
  assert.deepEqual(out.get('save_a')[1].fields,['p_expected','p_text','p_token']);
  const dropped=collectRpcCalls(sample.replace('p_expected:null','p_wrong:null'),['save_a']);
  assert.notDeepEqual(dropped.get('save_a')[1].fields,out.get('save_a')[0].fields);
  const renamed=collectRpcCalls(sample.replaceAll("rpc('save_a'","rpc('save_a_v1'"),['save_a']);
  assert.equal(renamed.get('save_a').length,0);
  console.log('RECOVERY_RPC_STATIC_PARSER_SELF_TEST_PASS: dropped CAS key and legacy swap detected');
}

const mode=process.argv[2];
if(mode==='--self-test'){selfTest();process.exit(0);}
if(mode!=='audit')fail('USAGE: audit QA_ROOT MAIN_ROOT (or --self-test)');
const qaRoot=path.resolve(process.argv[3]||'qa');
const prodRoot=path.resolve(process.argv[4]||'live-main');
const output=checkLockedContract(qaRoot,prodRoot);
const reportPath=path.join(process.env.RUNNER_TEMP||qaRoot,'workmoa-rpc-recovery-contract-integrity.json');
fs.writeFileSync(reportPath,JSON.stringify(output,null,2)+'\n');
console.log('STATIC_RECOVERY_CONTRACT_PASS: 26 RPC names/31 callsites; CAS payload names unchanged');
console.log('REAL_LIVE_RPC_GATE_REMAINS_BLOCKED: 26 missing server RPC implementations; NO E2E');
if(process.env.GITHUB_STEP_SUMMARY){
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   '## Recovery-contract static integrity ONLY — PASS\n\n'+
   '- Verified main unchanged and QA retains all **26 missing-name contracts / 31 direct callsites**.\n'+
   '- Static contract fields and expected/revision argument names unchanged.\n'+
   '- **NOT a SQL implementation, no Supabase connection, no validation of ACL/RLS/CAS behavior.**\n'+
   '- **Deployment still BLOCKED** by separate live server mismatch gate (RED).\n');
}

#!/usr/bin/env node
// Names/locations-only source provenance search across the PUBLIC repo refs.
// Never emits SQL bodies, private secrets, employee data, or executable SQL.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const manifestRelative='qa-round3/e2e/ci/missing-rpc-recovery-contracts.json';
const extensions=new Set(['.sql','.md','.markdown','.txt','.js','.mjs','.cjs','.ts','.html','.htm','.json','.yml','.yaml']);
const createPattern=/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(?:"?public"?|public)\s*\.\s*)?"?([a-z][a-z0-9_]*)"?\s*\(/gi;
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:8*1024*1024}).trim();}
function scanString(s,wanted){
  const found=[];
  for(const m of s.matchAll(createPattern)){
    const n=m[1].toLowerCase();
    if(wanted.has(n))found.push({name:n,line:s.slice(0,m.index).split('\n').length});
  }
  return found;
}
function scan(root,branch,names) {
  if(git(root,'branch','--show-current')!==branch)throw Error('CHECKOUT_REF_MISMATCH '+branch);
  const list=git(root,'ls-files','-z').split('\0').filter(Boolean);
  const hits=[];let inspected=0;
  for(const filename of list) {
    const ext=path.extname(filename).toLowerCase();
    if(!extensions.has(ext))continue;
    const full=path.join(root,filename);
    const st=fs.lstatSync(full);
    if(!st.isFile()||st.size>15*1024*1024)continue;
    const data=fs.readFileSync(full,'utf8');
    inspected++;
    for(const m of scanString(data,names)){
      // A textual claim in a report isn't automatically verified executable SQL.
      hits.push({name:m.name,ref:branch,file:filename,line:m.line,
       sourceKind:ext==='.sql'?'tracked_sql_file':'textual_definition_candidate',
       eligibleAsVerifiedImplementation:false});
    }
  }
  return {branch,filesInspected:inspected,allTrackedFiles:list.length,hits};
}
function selfTest(){
  const names=new Set(['save_my_memo_v2','admin_restore_data_v2']);
  assert.deepEqual(scanString('CREATE OR REPLACE FUNCTION public.save_my_memo_v2(p_token text)',names),[{name:'save_my_memo_v2',line:1}]);
  assert.deepEqual(scanString('create function "public"."admin_restore_data_v2"\n (a text)',names),[{name:'admin_restore_data_v2',line:1}]);
  assert.equal(scanString("SELECT rpc('save_my_memo_v2')",names).length,0);
  assert.equal(scanString("create function public.unrelated(p text)",names).length,0);
  console.log('SOURCE_SCAN_PARSER_SELF_TEST_PASS: definitions only, rejects client RPC references');
}
if(process.argv[2]==='--self-test'){selfTest();process.exit(0);}
if(process.argv[2]!=='scan')throw Error('USAGE: scan QA_ROOT MAIN_ROOT QA2_ROOT');
const roots=[['qa-3-8',process.argv[3]],['main',process.argv[4]],['qa-2-8',process.argv[5]]];
if(roots.some(x=>!x[1]))throw Error('MISSING_CHECKOUT');
const qaRoot=path.resolve(roots[0][1]);
const manifest=JSON.parse(fs.readFileSync(path.join(qaRoot,manifestRelative),'utf8'));
if(manifest.schemaVersion!==1||manifest.items.length!==26||manifest.releaseAllowed!==false)
  throw Error('MANIFEST_INVALID');
const names=new Set(manifest.items.map(x=>x.name));
if(names.size!==26)throw Error('DUPLICATE_FUNCTION_NAME');
if(git(path.resolve(roots[1][1]),'rev-parse','HEAD')!==manifest.mainHeadSha)
  throw Error('PRODUCTION_COMMIT_CHANGED');
const results=roots.map(([branch,root])=>scan(path.resolve(root),branch,names));
const found=[...new Set(results.flatMap(r=>r.hits.map(x=>x.name)))].sort();
const unmatched=[...names].filter(n=>!found.includes(n)).sort();
const summary={schemaVersion:1,sourceScope:'PUBLIC_BRANCH_HEADS_ONLY_NO_GIT_HISTORY_BODY_RECOVERY',
 scannedRefs:roots.map(x=>x[0]),referencesInspected:3,totalTrackedFilesInspected:results.reduce((a,r)=>a+r.allTrackedFiles,0),
 totalTextFilesInspected:results.reduce((a,r)=>a+r.filesInspected,0),
 missingExactRpcNames:26,claimedDefinitionCandidateNames:found.length,
 noDefinitionTextFoundNames:unmatched.length,
 allCandidatesUnverified:true,productionUnmodified:true,noSqlBodyPublished:true,
 noServerCalls:true,serverImplementationRecovered:false,releaseAllowed:false,
 candidateNames:found,noDefinitionTextFound:unmatched,
 perRef:results.map(x=>({branch:x.branch,filesInspected:x.filesInspected,candidateCount:x.hits.length})),
 matches:results.flatMap(x=>x.hits)};
const out=path.join(process.env.RUNNER_TEMP||qaRoot,'workmoa-public-repo-function-definition-search.json');
fs.writeFileSync(out,JSON.stringify(summary,null,2)+'\n');
console.log('PUBLIC_REPO_SOURCE_SCAN_DONE refs=3 textFiles='+summary.totalTextFilesInspected+
 ' names='+found.length+'/26 candidateHits='+summary.matches.length);
if(found.length)console.log('CANDIDATE_NAMES_ONLY '+found.join(','));
if(!found.length)console.log('NO_EXACT_26_FUNCTION_DEFINITIONS_FOUND_IN_TRACKED_TEXT: not proof for unreachable Git history/private sources');
console.log('LIVE_RPC_26_MISSING_REMAINS_RELEASE_BLOCKED; NO SQL RECOVERED OR DEPLOYED');
if(process.env.GITHUB_STEP_SUMMARY)
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '## Missing-RPC implementation provenance discovery (read-only)\n\n'+
    '- Scanned **qa-3-8, qa-2-8, main** public branch HEAD tracked text files for actual CREATE FUNCTION declarations.\n'+
    '- Candidate function names '+found.length+'/26; **all candidates require source/auth/RLS/CAS verification**.\n'+
    '- No SQL bodies are copied into the artifact. No production server/database was touched.\n'+
    '- Release is still **BLOCKED** by separate runtime RPC catalog mismatch.\n');

'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const base=fs.readFileSync('qa-handoff/index.before-2-8-258.html','utf8');
const working=fs.readFileSync('qa-handoff/index.working-2-8-258.html','utf8');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const old='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9';
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
let pass=0;
const check=(name,yes)=>{assert(yes,name);pass++;console.log('QA258_INTEGRITY_PASS',name);};
check('baseline SHA256 pinned',digest(base)===old);
check('candidate SHA256 pinned',digest(working)===expected);
check('unchanged APP_VERSION',working.includes("const APP_VERSION = 'ver20260927-0944';"));
check('version schema fix retained',working.includes('if(payload.backup_schema_version!==1)'));
check('candidate UTF8 delta 522',Buffer.byteLength(working)-Buffer.byteLength(base)===522);
let reverse=working;
for(const scope of ['personal','admin']){
const previous="const payload=parseDataBackupText(await file.text(),'"+scope+"');if(!stillCurrent()||!pageStillCurrent())return;";
const guarded="const payload=parseDataBackupText(await file.text(),'"+scope+"');\n    // QA 2-8-258: cross-renderer localStorage events can arrive after the peer tab finishes logout.\n    // Yield a short ownership-settle window before sending any sensitive backup preview payload.\n    await new Promise(resolve=>setTimeout(resolve,220));\n    if(!stillCurrent()||!pageStillCurrent())return;";
check('exact guarded settle '+scope,reverse.split(guarded).length===2);
reverse=reverse.replace(guarded,previous);
}
check('entire product code delta limited to two restore guards',reverse===base);
const scriptTags=[...working.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
check('two valid inline scripts',scriptTags.length===2);
for(const code of scriptTags){new vm.Script(code);pass++;}
const ids=[...working.slice(0,working.indexOf('<script async src=')).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('no DOM id duplication',ids.length===457&&ids.length===new Set(ids).size);
const rpcs=[...new Set([...working.matchAll(/\brpc\(\s*['"`]{1}([a-zA-Z0-9_]+)['"`]/g)].map(m=>m[1]))];
check('RPC endpoints still present',rpcs.length>=65);
console.log('QA258_SOURCE_DELTA_SUMMARY',JSON.stringify({pass,fail:0,baseline_sha:old,candidate_sha:expected,bytes_before:Buffer.byteLength(base),bytes_after:Buffer.byteLength(working),dom_ids:ids.length,rpc_names:rpcs.length}));

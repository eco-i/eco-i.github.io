'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert'),vm=require('vm');
const before=fs.readFileSync('qa-handoff/index.before-2-8-243.html');
const after=fs.readFileSync('qa-handoff/index.working-2-8-243.html');
const b=before.toString('utf8'),a=after.toString('utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const original='c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082';
const final='09fc064af8a08efe0f8d518bdf6f3f6d23c491c45bfa19626708871730428f5a';
assert.strictEqual(hash(before),original);assert.strictEqual(before.length,1165913);
assert.strictEqual(hash(after),final);assert.strictEqual(after.length,1166925);
const substitutions=[
[
"  if(responseGuardedRpc){\n    await new Promise(resolve=>setTimeout(resolve,0));\n    guardSensitiveDataRpcSession(name,payload);",
"  if(responseGuardedRpc){\n    await new Promise(resolve=>setTimeout(resolve,0));\n    // The same login token can survive a security-context reset, including\n    // a forced initial-PIN gate. An old in-flight request must not cross the\n    // epoch boundary merely because its token and shared storage still match.\n    if(responseOwnerEpoch!==sessionContextEpoch){\n      const err=new Error('SHARED_SESSION_CHANGED');\n      err.sharedSessionChanged=true;err.rpcMutation=mutationRpc;err.rpcName=String(name||'');\n      throw err;\n    }\n    guardSensitiveDataRpcSession(name,payload);"
],
[
"function guardSensitiveDataRpcSession(name,payload={}){\n  if(!SESSION_SENSITIVE_DATA_RPCS.has(String(name||'')))return;",
"function guardMandatoryInitialPinGateRpc(name){\n  // Once the server requires a PIN reset, protected writes and sensitive\n  // exports must stop even when the old authenticated token remains valid.\n  // Only the actual own-PIN change RPC may proceed through this gate.\n  if(!state.initialPinRequired||String(name||'')==='change_own_pin_v2')return;\n  const err=new Error('INITIAL_PIN_CHANGE_REQUIRED');\n  err.initialPinRequired=true;err.rpcName=String(name||'');\n  throw err;\n}\nfunction guardSensitiveDataRpcSession(name,payload={}){\n  if(!SESSION_SENSITIVE_DATA_RPCS.has(String(name||'')))return;\n  guardMandatoryInitialPinGateRpc(name);"
],
[
"function guardMutationRpcSession(name,payload={},options={}){\n  if(!SESSION_GUARDED_MUTATION_RPCS.has(String(name||'')))return;",
"function guardMutationRpcSession(name,payload={},options={}){\n  if(!SESSION_GUARDED_MUTATION_RPCS.has(String(name||'')))return;\n  guardMandatoryInitialPinGateRpc(name);"
]
];
let expected=b;
for(const [source,target] of substitutions){assert.strictEqual(expected.split(source).length,2,'exactly one source anchor');expected=expected.replace(source,target);}
assert.strictEqual(a,expected,'Only approved three source locations differ');
assert(a.includes('ver20260927-0944'));
const scripts=[...a.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(Boolean);
assert(scripts.length>=2);for(const code of scripts)new vm.Script(code);
const ids=[...a.slice(0,a.indexOf('<script async src=')).matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.strictEqual(ids.length,new Set(ids).size);
console.log('QA243_INTEGRITY_PASS',JSON.stringify({before_sha:hash(before),after_sha:hash(after),before_bytes:before.length,after_bytes:after.length,exact_source_substitutions:substitutions.length,product_defect_categories:2,inline_scripts:scripts.length,unique_dom_ids:ids.length}));

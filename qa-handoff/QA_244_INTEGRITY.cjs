'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const bfile='qa-handoff/index.before-2-8-244.html',cfile='qa-handoff/index.working-2-8-244.html';
const before=fs.readFileSync(bfile),after=fs.readFileSync(cfile);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const original='fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4';
const expected='9bfce02ca8be15ae1a59eebec2d3b05d1563784719ebec6308b7537e8fb9d9ab';
assert.strictEqual(sha(before),original);assert.strictEqual(before.length,1167315);
assert.strictEqual(sha(after),expected);assert.strictEqual(after.length,1168824);
const content=after.toString('utf8');
assert(content.includes('ver20260927-0944'));
for(const key of ['PIN_GATE_IDENTITY_READ_RPCS','function guardAdminPrivilegeRpcSession','ADMIN_PRIVILEGED_SENSITIVE_RPCS',
 'guardMandatoryInitialPinGateRpc(name);','guardAdminPrivilegeRpcSession(name,options);',
 'guardAdminPrivilegeRpcSession(name);','if(err?.adminPermissionRevoked)throw err;']){
  assert(content.includes(key),'Missing '+key);
}
const scripts=[...content.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
assert(scripts.length>=2);for(const code of scripts)new vm.Script(code);
const ids=[...content.slice(0,content.indexOf('<script async src=')).matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.strictEqual(ids.length,new Set(ids).size,'duplicated static DOM ids');
const diff=cp.spawnSync('git',['diff','--no-index','--unified=0','--',bfile,cfile],{encoding:'utf8',maxBuffer:8000000});
assert.strictEqual(diff.status,1,'Git diff expected to find source changes');
const lines=diff.stdout.split('\n');
const hunks=lines.filter(l=>l.startsWith('@@'));
const removed=lines.filter(l=>l.startsWith('-')&&!l.startsWith('---')).map(l=>l.slice(1));
const approvedRemoved=[
"  // Once the server requires a PIN reset, protected writes and sensitive",
"  // exports must stop even when the old authenticated token remains valid.",
"  // Only the actual own-PIN change RPC may proceed through this gate.",
"  if(!state.initialPinRequired||String(name||'')==='change_own_pin_v2')return;",
"    if(ownerStillCurrent&&!sharedChanged)return true;",
"    if(responseGuardedRpc&&!err?.sharedSessionChanged)assertRpcResponseOwnerCurrent();"
];
assert.strictEqual(removed.length,approvedRemoved.length,'unexpected original code removed');
for(const line of removed)assert(approvedRemoved.includes(line),'disallowed removed line: '+line);
assert(hunks.length>=4&&hunks.length<=9,'Unexpected scope count');
console.log('QA244_INTEGRITY_PASS',JSON.stringify({baseline_sha256:sha(before),final_sha256:sha(after),baseline_bytes:before.length,final_bytes:after.length,source_hunks:hunks,original_lines_removed:removed.length,inline_scripts:scripts.length,unique_dom_ids:ids.length,app_version:'ver20260927-0944'}));

'use strict';
const fs=require('fs'),crypto=require('crypto');
const paths=['index.html','qa-handoff/index.working-2-8-239.html'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(fs.readFileSync('qa-handoff/index.before-2-8-239.html'))!=='1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360')throw Error('Immutable 239 baseline changed');
const from="  if(matched)return;\n  // 토큰을 식별할 수 없는 복구 실패 상황에서는 현재 탭의 임시 상태만 정리한다.",to="  // A delayed cleanup with a known *old* token must never delete a\n  // newer independent PC tab login just because the old token is gone.\n  if(matched||current)return;\n  // 토큰을 식별할 수 없는 복구 실패 상황에서는 현재 탭의 임시 상태만 정리한다.";
for(const p of paths){
 let code=fs.readFileSync(p,'utf8');
 if(code.includes(to)){console.log('QA239_PC_PATCH_ALREADY_APPLIED',p);continue;}
 if(code.split(from).length!==2)throw Error('Ambiguous cleanup edit '+p);
 code=code.replace(from,to);
 if(!code.includes('ver20260927-0944'))throw Error('version changed');
 fs.writeFileSync(p,code);
 console.log('QA239_PC_PATCHED',JSON.stringify({path:p,sha256:sha(code),bytes:Buffer.byteLength(code)}));
}
if(!fs.readFileSync(paths[0]).equals(fs.readFileSync(paths[1])))throw Error('QA files differ');

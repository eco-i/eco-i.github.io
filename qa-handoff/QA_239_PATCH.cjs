'use strict';
const fs=require('fs'),crypto=require('crypto');
const paths=['index.html','qa-handoff/index.working-2-8-239.html'];
const expected='1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(fs.readFileSync('qa-handoff/index.before-2-8-239.html'))!==expected)throw Error('239 immutable baseline changed');
const from="      const token=localToken||temporaryToken;\n      if(token){",to="      // A completed newer shared logout is a trust boundary. Mobile\n      // sessionStorage is legacy-only: never re-promote its stale token (or\n      // stale admin unlock) after the newer shared login was logged out.\n      const loggedOutShared=storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);\n      if(loggedOutShared&&(!localToken||localToken===loggedOutShared)){\n        storageRemove(sessionStorage,SESSION_KEY);\n        storageRemove(sessionStorage,ADMIN_UNLOCK_KEY);\n        storageRemove(localStorage,PC_REMEMBER_KEY);\n        return true;\n      }\n      const token=localToken||temporaryToken;\n      if(token){";
for(const p of paths){
 let content=fs.readFileSync(p,'utf8');
 if(content.includes(to)){console.log('QA239_PATCH_ALREADY_APPLIED',p);continue;}
 if(content.split(from).length!==2)throw Error('Ambiguous migration scope '+p);
 content=content.replace(from,to);
 if(!content.includes('ver20260927-0944'))throw Error('APP_VERSION changed');
 fs.writeFileSync(p,content);
 console.log('QA239_PATCHED',JSON.stringify({path:p,sha256:sha(content),bytes:Buffer.byteLength(content)}));
}
if(!fs.readFileSync(paths[0]).equals(fs.readFileSync(paths[1])))throw Error('QA root/working mismatch');

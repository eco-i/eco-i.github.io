'use strict';
const fs=require('fs'),crypto=require('crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const original='53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34';
if(sha(fs.readFileSync('qa-handoff/index.before-2-8-241.html'))!==original)throw Error('Official 241 immutable baseline changed');
const find="function storedSessionTombstoned(token){\n  token=String(token||'');if(!token)return false;";
const replace="function storedSessionTombstoned(token){\n  token=String(token||'');if(!token)return false;\n  // Mobile/remembered shared logout suppression remains authoritative even\n  // when another sleeping tab missed its storage event or Web Locks failed.\n  // A fresh successful login clears the exact-token suppression marker.\n  if(storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===token)return true;";
for(const file of ['index.html','qa-handoff/index.working-2-8-241.html']){
 let c=fs.readFileSync(file,'utf8');
 if(c.includes(replace)){console.log('QA241_ALREADY_PATCHED',file);continue;}
 if(c.split(find).length!==2)throw Error('Ambiguous security fix in '+file);
 c=c.replace(find,replace);
 if(!c.includes("ver20260927-0944"))throw Error('APP_VERSION unexpectedly modified');
 fs.writeFileSync(file,c);
 console.log('QA241_PATCHED',JSON.stringify({path:file,sha256:sha(c),bytes:Buffer.byteLength(c)}));
}
if(!fs.readFileSync('index.html').equals(fs.readFileSync('qa-handoff/index.working-2-8-241.html')))throw Error('QA root and working candidate differ');

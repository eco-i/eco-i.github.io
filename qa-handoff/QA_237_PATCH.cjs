'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const anchor="function handleSharedSessionStorageChange(e){\n  if(e.storageArea!==localStorage)return;\n";
const insertion="function handleSharedSessionStorageChange(e){\n  if(e.storageArea!==localStorage)return;\n  // A different tab's localStorage.clear() emits key===null without a\n  // separate SESSION_KEY removal event. Revoke the stale shared role/UI.\n  // A desktop tab-only login is isolated from shared localStorage changes.\n  if(e.key===null){\n    const current=String(state.sessionToken||'');\n    const isolatedPcSession=!MOBILE_SESSION_DEVICE&&current&&storageGet(sessionStorage,SESSION_KEY)===current;\n    if(current&&!isolatedPcSession&&storageGet(localStorage,SESSION_KEY)!==current){\n      clearDeferredAdminDraftUnlockProof();\n      void logout(false);\n    }\n    return;\n  }\n";
for(const file of ['index.html','qa-handoff/index.working-2-8-237.html']){
  const original=fs.readFileSync(file,'utf8');
  if(original.includes("if(e.key===null){\n    const current=String(state.sessionToken||'');")){
    console.log('already-patched',file);continue;
  }
  if(original.split(anchor).length!==2)throw Error('Refusing ambiguous source: '+file);
  const patched=original.replace(anchor,insertion);
  if(!patched.includes("ver20260927-0944"))throw Error('APP_VERSION must not change');
  fs.writeFileSync(file,patched,'utf8');
  console.log('qa237-patched',file,'sha256',crypto.createHash('sha256').update(patched).digest('hex'),'bytes',Buffer.byteLength(patched));
}

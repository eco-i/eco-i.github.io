'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const anchor="function handleSharedSessionStorageChange(e){\n  if(e.storageArea!==localStorage)return;\n",firstPatch="function handleSharedSessionStorageChange(e){\n  if(e.storageArea!==localStorage)return;\n  // A different tab's localStorage.clear() emits key===null without a\n  // separate SESSION_KEY removal event. Revoke the stale shared role/UI.\n  // A desktop tab-only login is isolated from shared localStorage changes.\n  if(e.key===null){\n    const current=String(state.sessionToken||'');\n    const isolatedPcSession=!MOBILE_SESSION_DEVICE&&current&&storageGet(sessionStorage,SESSION_KEY)===current;\n    if(current&&!isolatedPcSession&&storageGet(localStorage,SESSION_KEY)!==current){\n      clearDeferredAdminDraftUnlockProof();\n      void logout(false);\n    }\n    return;\n  }\n";
const legacyGuard="if(current&&current===String(e.newValue||'')&&storageGet(sessionStorage,SESSION_KEY)!==current){",mobileGuard="if(current&&current===String(e.newValue||'')&&(MOBILE_SESSION_DEVICE||storageGet(sessionStorage,SESSION_KEY)!==current)){";
for(const file of ['index.html','qa-handoff/index.working-2-8-237.html']){
  const original=fs.readFileSync(file,'utf8');
  let changed=original;
  if(!changed.includes("if(e.key===null){\n    const current=String(state.sessionToken||'');")){
    if(changed.split(anchor).length!==2)throw Error('Refusing ambiguous site-clear patch: '+file);
    changed=changed.replace(anchor,firstPatch);
  }
  if(changed.includes(legacyGuard)){
    if(changed.split(legacyGuard).length!==2)throw Error('Refusing ambiguous mobile marker patch: '+file);
    changed=changed.replace(legacyGuard,mobileGuard);
  }else if(!changed.includes(mobileGuard))throw Error('Mobile marker guard not found: '+file);
  if(!changed.includes('ver20260927-0944'))throw Error('APP_VERSION must not change');
  if(changed!==original)fs.writeFileSync(file,changed,'utf8');
  console.log('qa237-source',file,changed===original?'unchanged':'patched','sha256',crypto.createHash('sha256').update(changed).digest('hex'),'bytes',Buffer.byteLength(changed));
}

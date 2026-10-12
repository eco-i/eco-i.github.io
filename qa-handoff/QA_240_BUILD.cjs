'use strict';
const fs=require('fs'),crypto=require('crypto');const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5';
const original=fs.readFileSync('qa-handoff/index.before-2-8-240.html');
const official=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
if(sha(original)!==expected||original.length!==1164059||official.last_completed_block!=='2-8-239'||official.next_block!=='2-8-240'||official.cumulative_defects!==515)throw Error('Official 240 handoff mismatch');
fs.writeFileSync('qa-handoff/index.working-2-8-240.html',original);
let test=fs.readFileSync('qa-handoff/QA_239_SMOKE.cjs','utf8')
 .replaceAll('index.before-2-8-239.html','index.before-2-8-240.html')
 .replaceAll('index.working-2-8-239.html','index.working-2-8-240.html')
 .replaceAll('QA239_','QA240_').replaceAll('__qa239_','__qa240_')
 .replaceAll('qa239-','qa240-').replaceAll('QA 239','QA 240')
 .replaceAll('1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360',expected)
 .replaceAll('1161777','1164059')
 .replaceAll('0133b3a889fcb7ecb9f571a187e3fe1d367e44cf608a3cf00acba231e0773b25',expected);
const anchor='  // Browser navigation with possible BFCache restoration: password inputs';
if(test.split(anchor).length!==2)throw Error('QA browser insertion anchor ambiguous');
test=test.replace(anchor,"\n  // 240: A cross-tab exact-token logout tombstone is a revocation signal\n  // even if the suppression marker or shared-key deletion was blocked.\n  const crossRevokedCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});\n  const sharedVictim=await crossRevokedCtx.newPage(),logoutPeer=await crossRevokedCtx.newPage();\n  for(const tab of [sharedVictim,logoutPeer]){\n    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());\n    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});\n  }\n  await sharedVictim.waitForTimeout(300);\n  await sharedVictim.evaluate(()=>{\n    const token='qa240-explicit-shared-revoked-A';\n    localStorage.setItem(SESSION_KEY,token);\n    state.sessionToken=token;\n    state.me={employee_id:240,is_admin:true,display_name:'QA Shared Administrator'};\n    document.getElementById('appView').classList.remove('hidden');\n    document.getElementById('loginView').classList.add('hidden');\n  });\n  await logoutPeer.evaluate(()=>markUpdateHandoffLoggedOut('qa240-explicit-shared-revoked-A'));\n  await sharedVictim.waitForTimeout(350);\n  const crossRevoked=await sharedVictim.evaluate(()=>{\n    const token='qa240-explicit-shared-revoked-A';\n    const oldUiVisible=!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden');\n    const shared=localStorage.getItem(SESSION_KEY);\n    const tombstoned=storedSessionTombstoned(token);\n    const ownershipAccepted=!fingerprintCurrentSharedSessionMismatch();\n    return {mobile:MOBILE_SESSION_DEVICE,oldUiVisible,shared,token:state.sessionToken,tombstoned,ownershipAccepted};\n  });\n  console.log('QA240_CROSSTAB_TOKEN_TOMBSTONE',JSON.stringify(crossRevoked));\n  check('Cross-tab exact-token logout tombstone invalidates old mobile admin UI despite shared key residue',\n    ()=>crossRevoked.mobile&&crossRevoked.tombstoned&&!crossRevoked.oldUiVisible);\n  check('Cross-tab exact-token logout tombstone invalidates stale mobile ownership fence',\n    ()=>!crossRevoked.ownershipAccepted);\n  await crossRevokedCtx.close();\n\n"+anchor);
test=test.replaceAll('239 mobile migration and per-token tombstone candidate pinned','240 start product SHA pinned');
fs.writeFileSync('qa-handoff/QA_240_SMOKE.cjs',test);
console.log('QA240_BUILT',JSON.stringify({sha256:sha(original),bytes:original.length,test_chars:test.length}));

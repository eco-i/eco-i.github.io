'use strict';
const fs=require('fs'),crypto=require('crypto');
const official='f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const b=fs.readFileSync('qa-handoff/index.before-2-8-238.html');
if(hash(b)!==official||b.length!==1161672)throw Error('238 baseline corrupt');
const officialState=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
if(officialState.last_completed_block!=='2-8-237'||officialState.next_block!=='2-8-238')throw Error('Official handoff changed');
fs.writeFileSync('qa-handoff/index.working-2-8-238.html',b);
let s=fs.readFileSync('qa-handoff/QA_237_SMOKE.cjs','utf8')
  .replaceAll('index.before-2-8-237.html','index.before-2-8-238.html')
  .replaceAll('index.working-2-8-237.html','index.working-2-8-238.html')
  .replaceAll('QA237_','QA238_').replaceAll('__qa237_','__qa238_')
  .replaceAll('qa237-','qa238-')
  .replaceAll('QA 237','QA 238')
  .replaceAll('5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a',official)
  .replaceAll('1161068', '1161672');
const old1="html!==baseline&&html.includes('if(e.key===null)')";
if(!s.includes(old1))throw Error('missing 237 expected diff check');
s=s.replace(old1,"html.includes('if(e.key===null)')");
const label="check('237 two-defect repaired candidate SHA pinned'";
if(!s.includes(label))throw Error('missing original final sha check label');
s=s.replace(label,"check('238 candidate matches official baseline before any repairs'");
const insertAt='  // Browser navigation with possible BFCache restoration: password inputs';
const extra="\n  // 238: A mobile tab with legacy duplicate sessionStorage must not treat\n  // itself as a PC tab-only session after a different mobile tab replaces\n  // the shared login token.\n  const legacySwitchCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});\n  const legacyOld=await legacySwitchCtx.newPage(),legacyNew=await legacySwitchCtx.newPage();\n  for(const tab of [legacyOld,legacyNew]){\n    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());\n    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});\n  }\n  await legacyOld.waitForTimeout(300);\n  await legacyOld.evaluate(()=>{\n    const token='qa238-legacy-shared-A';\n    localStorage.setItem(SESSION_KEY,token);\n    sessionStorage.setItem(SESSION_KEY,token);\n    state.sessionToken=token;\n    state.me={employee_id:238,is_admin:true,display_name:'Legacy shared admin'};\n    document.getElementById('appView').classList.remove('hidden');\n    document.getElementById('loginView').classList.add('hidden');\n  });\n  await legacyNew.evaluate(()=>localStorage.setItem(SESSION_KEY,'qa238-new-shared-B'));\n  await legacyOld.waitForTimeout(500);\n  const switched=await legacyOld.evaluate(()=>({\n    mobile:MOBILE_SESSION_DEVICE,\n    oldActor:state.me?.employee_id??null,\n    oldUiVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),\n    currentToken:state.sessionToken,\n    sharedToken:localStorage.getItem(SESSION_KEY),\n    tabToken:sessionStorage.getItem(SESSION_KEY),\n    mismatch:sharedPersistentSessionMismatch(),\n    sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()\n  }));\n  console.log('QA238_MOBILE_LEGACY_SHARED_REPLACEMENT',JSON.stringify(switched));\n  check('Mobile legacy duplicate shared login is revoked after another tab replaces the token',\n    ()=>switched.mobile&&switched.sharedToken==='qa238-new-shared-B'&&!switched.oldUiVisible);\n  check('Mobile legacy duplicate cannot bypass shared-session action guard',\n    ()=>!switched.oldUiVisible||switched.sensitiveMismatch);\n  await legacySwitchCtx.close();\n\n";
if(s.split(insertAt).length!==2)throw Error('target anchor ambiguous');
s=s.replace(insertAt,extra+insertAt);
fs.writeFileSync('qa-handoff/QA_238_SMOKE.cjs',s);
console.log('QA238_BUILT',JSON.stringify({bytes:b.length,sha256:hash(b),testBytes:Buffer.byteLength(s),checks:(s.match(/check\('/g)||[]).length}));

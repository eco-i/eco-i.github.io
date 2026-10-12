'use strict';
const fs=require('fs'),crypto=require('crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360';
const base=fs.readFileSync('qa-handoff/index.before-2-8-239.html');
const s=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
if(sha(base)!==expected||base.length!==1161777||s.last_completed_block!=='2-8-238'||s.next_block!=='2-8-239'||s.cumulative_defects!==512)throw Error('239 official baseline mismatch');
fs.writeFileSync('qa-handoff/index.working-2-8-239.html',base);
let test=fs.readFileSync('qa-handoff/QA_238_SMOKE.cjs','utf8')
  .replaceAll('index.before-2-8-238.html','index.before-2-8-239.html')
  .replaceAll('index.working-2-8-238.html','index.working-2-8-239.html')
  .replaceAll('QA238_','QA239_').replaceAll('__qa238_','__qa239_')
  .replaceAll('qa238-','qa239-')
  .replaceAll('QA 238','QA 239')
  .replaceAll('f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f',expected)
  .replaceAll('1161672','1161777');
const old="  // Browser navigation with possible BFCache restoration: password inputs";
if(test.split(old).length!==2)throw Error('QA test anchor not unique');
test=test.replace(old,"\n  // 239: Treat a completed logout marker as a hard boundary for mobile\n  // migration. A stale sessionStorage token must not be written back into\n  // localStorage simply because the newer shared session was deleted.\n  const migrationCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});\n  const migrationPage=await migrationCtx.newPage();\n  await migrationPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());\n  await migrationPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});\n  const migration=await migrationPage.evaluate(()=>{\n    const before=()=>{\n      localStorage.removeItem(SESSION_KEY);\n      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa239-newer-B');\n      sessionStorage.setItem(SESSION_KEY,'qa239-stale-A');\n      sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa239-stale-A');\n    };\n    before();\n    const initial=storedSessionToken(),ran=migrateLegacySessionForDevice(),\n      after=storedSessionToken(),shared=localStorage.getItem(SESSION_KEY),\n      currentAdmin=localStorage.getItem(ADMIN_UNLOCK_KEY);\n    return {mobile:MOBILE_SESSION_DEVICE,initial,ran,after,shared,currentAdmin,\n      temporary:sessionStorage.getItem(SESSION_KEY)};\n  });\n  console.log('QA239_MOBILE_STALE_MIGRATION',JSON.stringify(migration));\n  check('Mobile logged-out newer shared session cannot be resurrected by legacy migration',\n    ()=>migration.mobile&&!migration.initial&&!migration.after&&!migration.shared);\n  check('Mobile stale legacy admin unlock not promoted after newer logout',\n    ()=>migration.currentAdmin!=='qa239-stale-A');\n  await migrationCtx.close();\n"+old);
test=test.replaceAll('238 complete stale-token suppression candidate pinned','239 initial candidate pinned before fixes');
if(test.includes('133 PASS'))throw Error('invalid old evidence');
fs.writeFileSync('qa-handoff/QA_239_SMOKE.cjs',test);
console.log('QA239_BUILT',JSON.stringify({sha256:sha(base),product_bytes:base.length,test_bytes:Buffer.byteLength(test),checks:(test.match(/check\('/g)||[]).length}));

'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const before=fs.readFileSync('qa-handoff/index.working-2-8-255.html');if(crypto.createHash('sha256').update(before).digest('hex')!=='b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2')throw Error('255 candidate SHA mismatch');
const html=fs.readFileSync('qa-handoff/index.working-2-8-255.html','utf8');
(async()=>{let browser,server;const items=[];try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [true,false]){
 const ctx=await browser.newContext({viewport:{width:mobile?390:1024,height:800},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
 const page=await ctx.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
 const data=await page.evaluate(()=>{
  const token='QA248-policy-T',unrelated='QA248-policy-U',values=['',token,unrelated];
  const outcome={tested:0,unexpected:[],tombstone_pass:0,independent_persistent:0,independent_temporary:0};
  const put=(storage,key,value)=>{if(value)storage.setItem(key,value);else storage.removeItem(key)};
  for(const sharedS of values)for(const tabS of values)for(const sharedA of values)for(const tabA of values)for(const remember of ['', '1']){
   // Each matrix tuple is an independent browser-start fixture.
   sessionStorage.removeItem(PC_SHARED_AUTHORITY_HISTORY_KEY);
   put(localStorage,SESSION_KEY,sharedS);put(sessionStorage,SESSION_KEY,tabS);
   put(localStorage,ADMIN_UNLOCK_KEY,sharedA);put(sessionStorage,ADMIN_UNLOCK_KEY,tabA);
   put(localStorage,PC_REMEMBER_KEY,remember);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
   state.sessionToken=token;
   const mobile=MOBILE_SESSION_DEVICE,shared=sharedS===token,tab=tabS===token,persistent=shared&&remember==='1';
   let expected;
   if(mobile)expected=shared?sharedA===token:(!sharedS&&tab&&tabA===token);
   else expected=tab&&shared&&!persistent?tabA===token&&sharedA===token:(tab&&!persistent?tabA===token:(shared&&sharedA===token));
   const seen=adminUnlockMatches(token);
   outcome.tested++;
   if(Boolean(seen)!==Boolean(expected))outcome.unexpected.push({sharedS,tabS,sharedA,tabA,remember,mobile,seen,expected});
   put(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
   if(adminUnlockMatches(token)===false)outcome.tombstone_pass++;
   else outcome.unexpected.push({sharedS,tabS,sharedA,tabA,remember,mobile,type:'revoked-token-accepted'});
  }
  return outcome;
 });
 const pass=data.unexpected.length===0&&data.tested===162&&data.tombstone_pass===162;
 items.push(pass);
 console.log('QA255_MATRIX_'+(pass?'PASS':'FAIL'),JSON.stringify({mode:mobile?'mobile':'desktop',...data,unexpected:data.unexpected.slice(0,10)}));
 await ctx.close();
}
}catch(e){console.error('QA255_MATRIX_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
const total=items.filter(Boolean).length;console.log('QA255_MATRIX_SUMMARY',JSON.stringify({passed:total,failed:items.length-total,scope_combinations_per_device:162,tombstone_checks_per_device:162}));if(total!==2)process.exitCode=1;
})();
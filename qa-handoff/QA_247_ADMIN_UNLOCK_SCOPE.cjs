'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const src=fs.readFileSync('qa-handoff/index.before-2-8-247.html');
if(crypto.createHash('sha256').update(src).digest('hex')!=='8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d'||src.length!==1169644)throw Error('Official immutable 247 baseline mismatch');
const html=fs.readFileSync('qa-handoff/index.working-2-8-247.html','utf8');
(async()=>{let server,browser;const results=[];try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mode of ['mobile-shared','desktop-remembered','desktop-tab-only']){
 const mobile=mode==='mobile-shared';
 const ctx=await browser.newContext({viewport:{width:mobile?390:1024,height:800},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
 const page=await ctx.newPage();await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(250);
 const obs=await page.evaluate(async mode=>{
  const token='qa247-locked-'+mode;const oldFetch=window.fetch,oldConfigured=window.configured,calls=[];
  window.configured=()=>true;state.sessionToken=token;state.me={employee_id:247,is_admin:true,is_read_only:false,personnel_account_status:'active'};state.accountStatusPersonnelAuthoritative=true;state.initialPinRequired=false;
  localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
  localStorage.removeItem(ADMIN_UNLOCK_KEY);sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
  localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);
  if(mode==='mobile-shared'||mode==='desktop-remembered'){
   localStorage.setItem(SESSION_KEY,token);localStorage.setItem(PC_REMEMBER_KEY,'1');
   localStorage.setItem(ADMIN_UNLOCK_KEY,token);
   // Legacy stale tab marker survives even if another tab revokes shared admin unlock.
   sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
  }else{
   sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
   localStorage.setItem(SESSION_KEY,'unrelated-shared-user');
   localStorage.setItem(ADMIN_UNLOCK_KEY,'unrelated-shared-user');
  }
  const before=activeAdminMode();
  if(mode==='desktop-tab-only')localStorage.removeItem(ADMIN_UNLOCK_KEY);else localStorage.removeItem(ADMIN_UNLOCK_KEY);
  const after=activeAdminMode();
  window.fetch=async(url,opts)=>{if(String(url).includes('/rest/v1/rpc/')){calls.push(String(url).split('/').pop());return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(url,opts)};
  let error='';try{await rpc('list_recent_audit_page',{p_token:token})}catch(e){error=String(e.message||e)}
  window.configured=oldConfigured;window.fetch=oldFetch;
  return {mode,mobile:MOBILE_SESSION_DEVICE,before,after,error,sent:calls.length,tabSession:sessionStorage.getItem(SESSION_KEY),sharedSession:localStorage.getItem(SESSION_KEY)};
 },mode);
 const expected=mode==='desktop-tab-only';
 const ok=obs.before===true&&obs.after===expected&&obs.sent===(expected?1:0);
 results.push({...obs,ok});
 console.log('QA247_SCOPE_'+(ok?'PASS':'FAIL'),JSON.stringify(obs));
 await ctx.close();
}
}catch(e){console.log('QA247_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
console.log('QA247_SCOPE_SUMMARY',JSON.stringify({passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,source_sha:crypto.createHash('sha256').update(src).digest('hex')}));
if(results.some(x=>!x.ok)||results.length!==3)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.before-2-8-248.html');
if(crypto.createHash('sha256').update(source).digest('hex')!=='2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776'||source.length!==1170255)throw Error('Official 248 source mismatch');
const html=fs.readFileSync('qa-handoff/index.working-2-8-248.html','utf8'),results=[];
console.log('QA248_CANDIDATE_SHA',crypto.createHash('sha256').update(html).digest('hex'),'bytes',Buffer.byteLength(html));
(async()=>{let server,browser;try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mode of ['desktop','mobile']){
  const mobile=mode==='mobile';const ctx=await browser.newContext({viewport:{width:mobile?390:1024,height:800},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
  const page=await ctx.newPage();await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(300);
  const obs=await page.evaluate(async mode=>{
    const token='qa248-revoke-'+mode,oldFetch=window.fetch,oldConfigured=window.configured,network=[];
    window.configured=()=>true;window.fetch=async(url,opts)=>{if(String(url).includes('/rest/v1/rpc/')){network.push(String(url).split('/').pop());return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(url,opts)};
    state.sessionToken=token;state.me={employee_id:248,is_admin:true,is_read_only:false,personnel_account_status:'active'};state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;
    localStorage.setItem(SESSION_KEY,token);localStorage.setItem(PC_REMEMBER_KEY,'1');localStorage.setItem(ADMIN_UNLOCK_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    const initiallyAllowed=adminUnlockMatches(token);
    // Interrupted remember-session cleanup: shared unlock already revoked;
    // persistent flag vanished, but stale tab tokens still exist.
    localStorage.removeItem(ADMIN_UNLOCK_KEY);
    const afterSharedRevoke=adminUnlockMatches(token);
    localStorage.removeItem(PC_REMEMBER_KEY);
    const afterRememberLost=adminUnlockMatches(token);
    let error='',sent=0;const at=network.length;
    try{await rpc('list_recent_audit_page',{p_token:token})}catch(e){error=String(e?.message||e)}
    sent=network.length-at;
    window.configured=oldConfigured;window.fetch=oldFetch;
    return {mode,initiallyAllowed,afterSharedRevoke,afterRememberLost,sent,error,shared:localStorage.getItem(SESSION_KEY),tab:sessionStorage.getItem(SESSION_KEY)};
  },mode);
  const ok=obs.initiallyAllowed===true&&obs.afterSharedRevoke===false&&obs.afterRememberLost===false&&obs.sent===0;
  results.push({ok,...obs});console.log('QA248_REMEMBER_'+(ok?'PASS':'FAIL'),JSON.stringify({ok,...obs}));
  await ctx.close();
 }
 }catch(e){console.log('QA248_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA248_REMEMBER_SUMMARY',JSON.stringify({passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length}));
 if(results.some(x=>!x.ok))process.exitCode=1;
})();
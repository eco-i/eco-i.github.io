'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');
const {chromium}=require('playwright-core');
const base=fs.readFileSync('qa-handoff/index.before-2-8-246.html');
if(crypto.createHash('sha256').update(base).digest('hex')!=='be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da')throw Error('Immutable source SHA mismatch');
const html=fs.readFileSync('qa-handoff/index.working-2-8-246.html','utf8');
console.log('QA246_CANDIDATE',crypto.createHash('sha256').update(html).digest('hex'),Buffer.byteLength(html));
(async()=>{let srv,browser;const results=[];
try{
srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mode of ['mobile','desktop']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:mode==='mobile',hasTouch:mode==='mobile',...(mode==='mobile'?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
 const first=await ctx.newPage(),second=await ctx.newPage();
 await first.route('https://cdn.jsdelivr.net/**',r=>r.abort());await second.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await Promise.all([first.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'}),second.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'})]);
 await first.waitForTimeout(500);await second.waitForTimeout(500);
 const tok='qa246-cap-native-dialog-'+mode;
 await first.evaluate(token=>{window.configured=()=>true;state.sessionToken=token;state.me={employee_id:246,is_admin:true,is_read_only:false,personnel_account_status:'active'};state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;state.employees=[];localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);},tok);
 await second.waitForTimeout(250);
 let dialogSeen=false,removed=false,handlerError='';
 first.once('dialog',async dialog=>{dialogSeen=true;try{removed=await second.evaluate(()=>{localStorage.removeItem(ADMIN_UNLOCK_KEY);return localStorage.getItem(ADMIN_UNLOCK_KEY)===null});}catch(e){handlerError=String(e)}finally{await dialog.accept().catch(()=>{})}});
 const result=await Promise.race([first.evaluate(async()=>{
  const oldFetch=window.fetch;const calls=[];
  window.fetch=async(url,opts)=>{if(String(url).includes('/rest/v1/rpc/')){calls.push({name:String(url).split('/').pop(),unlockAtFetch:adminUnlockMatches(state.sessionToken),localUnlock:localStorage.getItem(ADMIN_UNLOCK_KEY),tabUnlock:sessionStorage.getItem(ADMIN_UNLOCK_KEY)});return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(url,opts)};
  const confirmation=confirmMutationWithSessionGuard('QA246 native Chrome administrator confirmation');
  let error='';try{if(confirmation)await rpc('get_company_event_capacity',{p_token:state.sessionToken})}catch(e){error=String(e.message||e)}
  window.fetch=oldFetch;
  return {confirmation,calls,error,currentUnlock:adminUnlockMatches(state.sessionToken)};
 }),new Promise((_,reject)=>setTimeout(()=>reject(Error('Native dialog scenario timed out')),12000))]);
 const ok=dialogSeen&&removed&&result.calls.length===0&&result.error==='ADMIN_PERMISSION_REVOKED'&&!handlerError;
 results.push({mode,dialogSeen,removed,handlerError,ok,...result});
 console.log('QA246_CAPACITY_CROSS_TAB_'+(ok?'PASS':'FAIL'),JSON.stringify(results.at(-1)));
 await ctx.close();
}
}catch(e){console.error('QA246_CAPACITY_CROSS_TAB_ERROR',String(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();if(srv)await new Promise(resolve=>srv.close(resolve))}
const passed=results.filter(x=>x.ok).length;console.log('QA246_CAPACITY_CROSS_TAB_SUMMARY',JSON.stringify({passed,failed:results.length-passed}));if(passed!==2)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-251.html','utf8');
const expected='4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef';
if(crypto.createHash('sha256').update(html).digest('hex')==='aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841')throw Error('251 unmodified source');
(async()=>{let server,browser;let passed=0,failed=0;
const check=(name,okay,details)=>{(okay?passed++:failed++);console.log('QA251_'+(okay?'PASS':'FAIL'),name,JSON.stringify(details));};
try{
server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url==='/blank'?'<!doctype html><title>Passive sibling</title>':html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const variant of ['quota-full-clear','quota-token-remove','normal-full-clear','independent-tab']){
 const ctx=await browser.newContext({viewport:{width:1200,height:820}});
 const owner=await ctx.newPage(),peer=await ctx.newPage(),errors=[];owner.on('pageerror',e=>errors.push(String(e)));
 await owner.route('https://cdn.jsdelivr.net/**',r=>r.abort());await peer.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const url='http://127.0.0.1:'+server.address().port+'/';
 await Promise.all([owner.goto(url,{waitUntil:'domcontentloaded'}),peer.goto(url+'blank',{waitUntil:'domcontentloaded'})]);await owner.waitForTimeout(400);
 const token='qa250-bootstrap-'+variant;
 const initial=await owner.evaluate(({token,variant})=>{
   const related=variant!=='independent-tab',shared=related?token:'unrelated-other-account';
   state.sessionToken=token;state.me=null;
   sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
   sessionStorage.removeItem(PC_SHARED_AUTHORITY_HISTORY_KEY);
   if(variant.startsWith('quota-')){const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===sessionStorage&&k===PC_SHARED_AUTHORITY_HISTORY_KEY)throw new DOMException('Cannot store value','QuotaExceededError');return native.call(this,k,v)};}
   localStorage.setItem(SESSION_KEY,shared);localStorage.setItem(ADMIN_UNLOCK_KEY,shared);
   localStorage.setItem(PC_REMEMBER_KEY,'1');
   localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
   window.initialPinStatus=async()=>false;
   window.rpcPreferPersonnel=async()=>[{employee_id:250,display_name:'QA250 bootstrap',category:'B조',group_code:'B',is_admin:true}];
   window.__restoreHits=[];
   window.enterApp=async me=>{window.__restoreHits.push({me,token:state.sessionToken});return true};
   return {token:storedSessionToken(),admin:adminUnlockMatches(token),authorityHistory:sessionStorage.getItem(PC_SHARED_AUTHORITY_HISTORY_KEY),me:state.me,remembered:sessionIsPersistent(token)};
 },{token,variant});
 await peer.evaluate(variant=>{
   if(variant==='quota-token-remove')localStorage.removeItem('staffAttendance_session_v1');
   else localStorage.clear();
 },variant);
 await owner.waitForTimeout(150);
 const snapshot=await owner.evaluate(async()=>{
   const before={session:state.sessionToken,stored:storedSessionToken(),history:sessionStorage.getItem(PC_SHARED_AUTHORITY_HISTORY_KEY),admin:adminUnlockMatches(state.sessionToken),sharedMismatch:sharedPersistentSessionMismatch()};
   await restoreSession();
   const after={session:state.sessionToken,me:state.me,entered:window.__restoreHits||[],stored:storedSessionToken(),tabToken:sessionStorage.getItem(SESSION_KEY),history:sessionStorage.getItem(PC_SHARED_AUTHORITY_HISTORY_KEY)};
   return {before,after};
 });
 const related=variant!=='independent-tab';
 check(variant+':valid-bootstrap-setup',initial.token===token&&initial.me===null&&initial.authorityHistory===(variant==='normal-full-clear'?token:null)&&initial.admin===!variant.startsWith('quota-'),{initial,snapshot,errors});
 check(variant+':restoration-authority',related?snapshot.after.entered.length===0:snapshot.after.entered.length===1,{initial,snapshot,errors});
 check(variant+':no-page-error',errors.length===0,{errors});
 await ctx.close();
}
}catch(e){console.error('QA250_BOOT_HARNESS_ERROR',String(e.stack||e));failed++}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA251_QUOTA_GREEN_SUMMARY',JSON.stringify({passed,failed,source_sha256:crypto.createHash('sha256').update(html).digest('hex')}));if(failed)process.exitCode=1;
})();
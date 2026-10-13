'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const filename=process.env.QA251_SOURCE||'qa-handoff/index.working-2-8-251.html';
const html=fs.readFileSync(filename,'utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
const fixed=filename.includes('working');
if(![ '90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e','aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841'].includes(sha))throw Error('Wrong QA250 source SHA '+sha);
(async()=>{let srv,browser,passes=0,failures=0;
function check(name,okay,d){(okay?passes++:failures++);console.log('QA251_REALBOOT_'+(okay?'PASS':'FAIL'),name,JSON.stringify(d))}
try{
srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url==='/blank'?'<!doctype html><title>Passive tab</title>':html)});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const variant of ['shared-token-remove','shared-full-clear','quota-shared-token-remove','quota-shared-full-clear','independent-pc-tab']){
 const ctx=await browser.newContext({viewport:{width:1200,height:820}}),a=await ctx.newPage(),b=await ctx.newPage(),errors=[];
 a.on('pageerror',e=>errors.push(String(e)));
 const url='http://127.0.0.1:'+srv.address().port+'/';
 await Promise.all([a.goto(url+'blank'),b.goto(url+'blank')]);
 const token='qa251-realboot-'+variant;
 await a.evaluate(({token,variant})=>{
  const shared=variant==='independent-pc-tab'?'qa251-unrelated-shared':token;
  sessionStorage.setItem('staffAttendance_session_v1',token);
  sessionStorage.setItem('staffAttendance_admin2_ok_v1',token);
  sessionStorage.removeItem('staffAttendance_pcSharedAuthorityHistory_v1');
  localStorage.setItem('staffAttendance_session_v1',shared);
  localStorage.setItem('staffAttendance_admin2_ok_v1',shared);
  localStorage.setItem('staffAttendance_pcRemember_v1','1');
 },{token,variant});
 if(variant.startsWith('quota-'))await a.addInitScript(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===sessionStorage&&k==='staffAttendance_pcSharedAuthorityHistory_v1')throw new DOMException('Storage limit','QuotaExceededError');return native.call(this,k,v)}});
 await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 let release,started=false;const gate=new Promise(r=>{release=r});
 await a.route('https://fnzgjidzdazlodmjhmes.supabase.co/rest/v1/rpc/**',async route=>{
   const rpc=route.request().url().split('/').pop();
   if(rpc==='initial_pin_status_v1'){started=true;await gate;}
   const response=rpc==='initial_pin_status_v1'?false:rpc.startsWith('get_me')?[{employee_id:250,display_name:'QA250 Actual',category:'B조',group_code:'B',is_admin:true}]:[];
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)}).catch(()=>{});
 });
 await a.goto(url,{waitUntil:'domcontentloaded'});
 const bootReady=await a.waitForFunction(()=>{try{return typeof state==='object'&&!!state.sessionToken}catch(_){return false}},null,{timeout:2600}).then(()=>true,()=>false);
 if(!bootReady){
   check(variant+':baseline-startup-state-TDZ',!fixed&&errors.some(e=>/Cannot access 'state' before initialization|state is not defined|Cannot access 'state'/i.test(e)),{errors,bootReady,sha});
   await ctx.close();continue;
 }
 await a.waitForTimeout(350);
 const during=await a.evaluate(()=>{
  window.__restoreHits=[];
  window.enterApp=async me=>{window.__restoreHits.push({token:state.sessionToken,me});return true};
  return {session:state.sessionToken,me:state.me,history:sessionStorage.getItem('staffAttendance_pcSharedAuthorityHistory_v1'),stored:storedSessionToken(),persistent:sessionIsPersistent(state.sessionToken),tabToken:sessionStorage.getItem('staffAttendance_session_v1')};
 });
 await b.evaluate(variant=>{
   if(variant.endsWith('token-remove'))localStorage.removeItem('staffAttendance_session_v1');
   else localStorage.clear();
 },variant);
 await a.waitForTimeout(250);
 release();
 await a.waitForTimeout(750);
 const after=await a.evaluate(()=>({session:state.sessionToken,me:state.me,entered:window.__restoreHits||[],history:sessionStorage.getItem('staffAttendance_pcSharedAuthorityHistory_v1'),storage:storedSessionToken()}));
 const related=variant!=='independent-pc-tab';
 check(variant+':bootstrap-read-paused',started&&during.me===null&&during.session===token,{during,after,errors});
 check(variant+':auth-on-released-server-response',related? (fixed?after.entered.length===0:after.entered.length===1):after.entered.length===1,{during,after,errors});
 check(variant+':safe-JS',errors.length===0,{errors});
 if(variant.startsWith('quota-')){
   check(variant+':cold-boot-clears-stranded-tab',during.tabToken===null,{during,after});
   await a.reload({waitUntil:'domcontentloaded'});await a.waitForTimeout(300);
   const reload=await a.evaluate(()=>({token:state.sessionToken,admin:adminUnlockMatches(state.sessionToken)}));
   check(variant+':cannot-revive-on-reload',!reload.token&&!reload.admin,{reload,after,errors});
 }
 await ctx.close();
}
}catch(e){failures++;console.error('QA251_REALBOOT_ERROR',e.stack||String(e))}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA251_REALBOOT_SUMMARY',JSON.stringify({passed:passes,failed:failures,source_sha256:sha,candidate:fixed}));if(failures)process.exitCode=1;
})();
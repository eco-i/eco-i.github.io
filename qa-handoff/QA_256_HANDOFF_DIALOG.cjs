'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-256.html','utf8');
if(crypto.createHash('sha256').update(html).digest('hex')!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('254 patched candidate SHA differs');
(async()=>{let srv,browser,pass=0,fail=0;const check=(tag,ok,v)=>{(ok?pass++:fail++);console.log('QA256_'+(ok?'PASS':'FAIL'),tag,JSON.stringify(v));};
try{srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.url==='/blank'?'<!doctype html><title>Peer</title>':html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mode of ['clear','remove','replace','control']){
 const ctx=await browser.newContext({viewport:{width:1200,height:800}}),a=await ctx.newPage(),b=await ctx.newPage(),errs=[];
 a.on('pageerror',e=>errs.push(String(e)));await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const url='http://127.0.0.1:'+srv.address().port+'/';await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'blank',{waitUntil:'domcontentloaded'})]);await a.waitForTimeout(450);
 const token='qa256-old-'+mode,first='qa256-next-'+mode;
 const setup=await a.evaluate(({token,first})=>{
   window.configured=()=>true;state.sessionToken=token;state.me={employee_id:253,is_admin:false,is_read_only:false,personnel_account_status:'active'};
   state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;state.accountStatusBackendReady=true;
   localStorage.clear();sessionStorage.clear();localStorage.setItem(SESSION_KEY,first);localStorage.setItem(PC_REMEMBER_KEY,'1');
   window.appHasUnsavedChanges=()=>true;window.appHasPendingOperation=()=>false;window.syncDeferredAdminDraftPermissionSurfaces=()=>{};
   window.performSharedSessionReload=()=>{window.__didReload=true;};
   window.__saveCalls=[];window.__saveResult=null;window.__handoff=null;window.__didReload=false;
   window.fetch=async(u,o)=>{if(String(u).includes('/rest/v1/rpc/')){window.__saveCalls.push(String(u).split('/').pop());return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return new Response('',{status:200})};
   window.showToast=()=>{window.__handoff={pending:sharedSessionChangePending,deferred:sharedSessionUnsavedDeferred,target:sharedSessionDeferredTargetToken,local:localStorage.getItem(SESSION_KEY),settle:nativeDialogOwnershipSettleUntil};window.__saveResult='pending';void rpc('save_my_memo_v2',{p_token:token},{allowDeferredSession:true}).then(()=>window.__saveResult='success').catch(e=>window.__saveResult=String(e.message||e));};
   return {before:state.sessionToken,shared:localStorage.getItem(SESSION_KEY),mismatch:sharedPersistentSessionMismatch()};
 },{token,first});
 let dialogSeen=false,changed=false,dialogError='';
 a.once('dialog',async d=>{dialogSeen=true;try{changed=await b.evaluate(({mode,first})=>{if(mode==='clear')localStorage.clear();if(mode==='remove')localStorage.removeItem('staffAttendance_session_v1');if(mode==='replace')localStorage.setItem('staffAttendance_session_v1',first+'-other');return localStorage.getItem('staffAttendance_session_v1')!==first},{mode,first})}catch(e){dialogError=String(e)}finally{await d.dismiss().catch(()=>{})}});
 await a.evaluate(()=>scheduleSharedSessionReload(0));
 await a.waitForFunction(()=>window.__saveResult!==null,{timeout:12000});await a.waitForTimeout(350);
 const result=await a.evaluate(()=>({handoff:window.__handoff,result:window.__saveResult,calls:window.__saveCalls,local:localStorage.getItem(SESSION_KEY),reload:window.__didReload,guard:nativeDialogOwnershipSettleUntil,now:Date.now()}));
 check(mode+':setup',setup.before===token&&setup.shared===first&&setup.mismatch,{setup});
 check(mode+':actual-native-dialog',dialogSeen&&!dialogError,{dialogSeen,changed,dialogError});
 check(mode+':rpc-ownership',mode==='control'?result.calls.includes('save_my_memo_v2'):!result.calls.includes('save_my_memo_v2'),{result});
 check(mode+':no-browser-exception',errs.length===0,{errs});
 await ctx.close();
}
}catch(e){fail++;console.log('QA256_HARNESS_ERROR',String(e.stack||e));}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r));}
console.log('QA256_HANDOFF_SUMMARY',JSON.stringify({pass,fail,baseline_sha256:crypto.createHash('sha256').update(html).digest('hex')}));if(fail)process.exitCode=1;
})();
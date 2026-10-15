'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-256.html','utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('QA256 backup race candidate mismatch');
(async()=>{let srv,browser,pass=0,fail=0;const ck=(name,ok,detail={})=>{(ok?pass++:fail++);console.log('QA256_RESTORE_RACE_'+(ok?'PASS':'FAIL'),name,JSON.stringify(detail))};
try{srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(q.url==='/blank'?'<!doctype html>Peer':html)});await new Promise(done=>srv.listen(0,'127.0.0.1',done));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true])for(const mode of ['shared-removal','shared-replacement','control','invalid']){
 const label=(mobile?'mobile':'desktop')+':'+mode,ctx=await browser.newContext({viewport:{width:mobile?390:1100,height:mobile?830:850},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})}),a=await ctx.newPage(),b=await ctx.newPage(),errors=[];a.on('pageerror',e=>errors.push(String(e)));await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const url='http://127.0.0.1:'+srv.address().port+'/';await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'blank',{waitUntil:'domcontentloaded'})]);await a.waitForTimeout(200);
 const setup=await a.evaluate(({mode})=>{
 const token='qa256-restore-old-'+mode;window.configured=()=>true;state.me={employee_id:255,is_admin:false,is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;pageLifecycleFreshnessPending=false;
 sessionStorage.clear();localStorage.clear();localStorage.setItem(SESSION_KEY,token);window.showLoading=()=>{};window.performSharedSessionReload=()=>{};
 window.__rpcNames=[];window.rpc=async(name)=>{window.__rpcNames.push(name);throw new Error('mock backend disabled')};window.__done=false;window.__textResolver=null;
 const payload={format:'workmoa-data-backup',backup_schema_version:1,backup_type:'personal',included_sections:['attendance'],data:{attendance:[]}};
 if(mode==='invalid')payload.included_sections=['attendance','attendance'];
 const file={name:'backup.json',size:300,text:()=>new Promise(done=>{window.__textResolver=()=>done(JSON.stringify(payload))})};
 const ctx={target:'my',actor:255,token,contextEpoch:sessionContextEpoch};
 window.__contextOk=dataRestorePickerContextStillCurrent(ctx,'my');
 void prepareMyDataRestore(file,ctx).finally(()=>window.__done=true);
 return {contextOk:window.__contextOk,busy:dataManagementBusy,readerReady:typeof window.__textResolver==='function',mobile:MOBILE_SESSION_DEVICE};
 },{mode});
 let changeValue=null;if(mode==='shared-removal')changeValue=await b.evaluate(()=>{localStorage.removeItem('staffAttendance_session_v1');return localStorage.getItem('staffAttendance_session_v1')});
 if(mode==='shared-replacement')changeValue=await b.evaluate(()=>{localStorage.setItem('staffAttendance_session_v1','qa256-other-session');return localStorage.getItem('staffAttendance_session_v1')});
 await a.evaluate(()=>window.__textResolver?.());
 await a.waitForFunction(()=>window.__done===true,{timeout:10000});await a.waitForTimeout(200);
 const result=await a.evaluate(()=>({rpc:window.__rpcNames,busy:dataManagementBusy,session:state.sessionToken,shared:localStorage.getItem(SESSION_KEY),text:$('myDataError')?.textContent||'',pending:pendingMyDataRestore!==null}));
 const revoked=mode.startsWith('shared-'),invalid=mode==='invalid';const expectedRpc=revoked||invalid?0:1;
 ck(label+':reader-started',setup.contextOk&&setup.busy&&setup.readerReady,{setup});
 ck(label+':preview-before-network-fenced',result.rpc.filter(x=>x==='preview_data_restore_v2').length===expectedRpc,{result,changeValue,expectedRpc});
 ck(label+':busy-released',result.busy===false,{result});
 ck(label+':no-new-pending-restore',!revoked&&!invalid||!result.pending,{result});
 ck(label+':no-js-exceptions',errors.length===0,{errors});await ctx.close();
}
}catch(e){fail++;console.log('QA256_RESTORE_RACE_HARNESS_ERROR',String(e.stack||e))}finally{if(browser)await browser.close();if(srv)await new Promise(done=>srv.close(done))}
console.log('QA256_RESTORE_RACE_SUMMARY',JSON.stringify({pass,fail,sha256:hash}));if(fail)process.exitCode=1;
})();

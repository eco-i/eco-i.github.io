'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-249.html');
const src=fs.readFileSync('qa-handoff/index.working-2-8-249.html');
if(crypto.createHash('sha256').update(baseline).digest('hex')!=='9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0')throw Error('baseline changed');
if(crypto.createHash('sha256').update(src).digest('hex')!=='4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef')throw Error('candidate SHA drift');
const html=src.toString('utf8');
(async()=>{let server,browser;let pass=0,fail=0;
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.url==='/blank'?'<!doctype html><title>passive peer</title>':html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const op of ['shared-clear','shared-key-delete']){
  const ctx=await browser.newContext({viewport:{width:1200,height:820}});
  const a=await ctx.newPage(),b=await ctx.newPage(),errors=[];
  a.on('pageerror',e=>errors.push(String(e)));
  await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const addr='http://127.0.0.1:'+server.address().port+'/';
  await Promise.all([a.goto(addr,{waitUntil:'domcontentloaded'}),b.goto(addr+'blank',{waitUntil:'domcontentloaded'})]);await a.waitForTimeout(350);
  const token='qa249-native-'+op;
  const before=await a.evaluate(token=>{
    window.configured=()=>true;state.sessionToken=token;state.me={employee_id:249,is_admin:true,is_read_only:false,personnel_account_status:'active'};
    state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;
    sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);localStorage.setItem(PC_REMEMBER_KEY,'1');
    return {admin:activeAdminMode(),persistent:sessionIsPersistent(token),history:sessionStorage.getItem('staffAttendance_pcSharedAuthorityHistory_v1'),configured:configured(),nativeSnapshot:fingerprintBlockingPromptSessionSnapshot()};
  },token);
  let dialog=false,removed=false,dialogError='';
  a.once('dialog',async d=>{dialog=true;try{removed=await b.evaluate(op=>{
    if(op==='shared-clear')localStorage.clear();
    else localStorage.removeItem('staffAttendance_session_v1');
    return localStorage.getItem('staffAttendance_session_v1')===null;
  },op)}catch(e){dialogError=String(e)}finally{await d.accept().catch(()=>{})}});
  const result=await Promise.race([a.evaluate(async()=>{
    const oldFetch=window.fetch,calls=[];
    window.fetch=async(u,o)=>{if(String(u).includes('/rest/v1/rpc/')){calls.push(String(u).split('/').pop());return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(u,o)};
    const confirmation=confirmMutationWithSessionGuard('QA249 native dialog shared revocation');
    let failure='';try{await rpc('list_recent_audit_page',{p_token:state.sessionToken})}catch(e){failure=String(e.message||e)}
    window.fetch=oldFetch;
    return {confirmation,failure,calls,current:state.sessionToken,admin:activeAdminMode(),configured:configured(),afterSnapshot:fingerprintBlockingPromptSessionSnapshot()};
  }),new Promise((_,reject)=>setTimeout(()=>reject(Error('native confirm timeout')),12000))]);
  const checks={
    beganAdmin:before.admin&&before.persistent&&before.history===token,
    changedDuringDialog:dialog&&removed&&!dialogError,
    confirmationOrRpcRevoked:result.confirmation===false||(result.confirmation===true&&result.calls.length===0),
    privilegedRpcBlocked:result.calls.length===0&&['ADMIN_PERMISSION_REVOKED','SHARED_SESSION_CHANGED'].includes(result.failure),
    noPageErrors:errors.length===0
  };
  for(const [name,ok]of Object.entries(checks)){(ok?pass++:fail++);console.log('QA249_NATIVE_'+(ok?'PASS':'FAIL'),op,name,JSON.stringify({before,result,errors,dialogError}));}
  await ctx.close();
 }
}catch(e){console.error('QA249_NATIVE_HARNESS_ERROR',e.stack||String(e));fail++}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
console.log('QA249_NATIVE_SUMMARY',JSON.stringify({pass,fail}));if(fail)process.exitCode=1;
})();
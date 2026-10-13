'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const original=fs.readFileSync('qa-handoff/index.before-2-8-247.html');
if(crypto.createHash('sha256').update(original).digest('hex')!=='8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d')throw Error('Wrong official baseline');
const html=fs.readFileSync('qa-handoff/index.working-2-8-247.html','utf8');
(async()=>{let server,browser;const out=[];try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.url==='/blank'?'<!doctype html><title>QA247 passive shared-origin tab</title>':html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [true,false]){
  const label=mobile?'mobile':'desktop',ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:800},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
  const a=await ctx.newPage(),b=await ctx.newPage(),errors=[];a.on('pageerror',x=>errors.push(String(x)));
  await a.route('https://cdn.jsdelivr.net/**',route=>route.abort());await b.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const url='http://127.0.0.1:'+server.address().port+'/';
  await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'blank',{waitUntil:'domcontentloaded'})]);
  await a.waitForTimeout(350);
  const token='qa247-ui-secret-'+label,secret='QA247-SECRET-ADMIN-'+label;
  const initial=await a.evaluate(({token,secret})=>{
    state.sessionToken=token;state.me={employee_id:246,display_name:'QA247',category:'A',is_admin:true,is_read_only:false,personnel_account_status:'active'};state.accountStatusPersonnelAuthoritative=true;state.initialPinRequired=false;state.pinStatus={246:true};
    localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token); // Legacy stale tab unlock must not keep admin UI alive after shared revocation.
    if(!MOBILE_SESSION_DEVICE)localStorage.setItem(PC_REMEMBER_KEY,'1');
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    for(const id of ['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList']){const el=document.getElementById(id);if(el)el.textContent=secret;}
    return {admin:activeAdminMode(),panels:['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList'].map(id=>!!document.getElementById(id))};
  },{token,secret});
  await b.waitForFunction(token=>localStorage.getItem('staffAttendance_admin2_ok_v1')===token,token,{timeout:5000});
  const removal=await b.evaluate(({adminKey,sessionKey})=>{const prev=localStorage.getItem(adminKey);localStorage.removeItem(adminKey);return {prev,after:localStorage.getItem(adminKey),storedSession:localStorage.getItem(sessionKey)};},{adminKey:'staffAttendance_admin2_ok_v1',sessionKey:'staffAttendance_session_v1'});
  await a.waitForTimeout(500);
  const result=await a.evaluate(secret=>{
    const names=['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList'];const remaining=names.filter(id=>document.getElementById(id)?.textContent.includes(secret));
    return {adminActive:activeAdminMode(),remaining,oldPinStatus:state.pinStatus?.[246],localUnlock:localStorage.getItem(ADMIN_UNLOCK_KEY),tabUnlock:sessionStorage.getItem(ADMIN_UNLOCK_KEY),localSession:localStorage.getItem(SESSION_KEY),tabSession:sessionStorage.getItem(SESSION_KEY),adminToolsHidden:document.getElementById('adminTools')?.classList.contains('hidden'),sessionTokenStillThere:!!state.sessionToken};
  },secret);
  const checks={validSecondTabRemoval:removal.prev===token,startedAdmin:initial.admin,privilegedPanelsFound:initial.panels.every(Boolean),adminRevoked:!result.adminActive,domSecretPurged:result.remaining.length===0,pinCachePurged:result.oldPinStatus===undefined,adminToolsHidden:result.adminToolsHidden===true,sessionPreserved:result.sessionTokenStillThere,jsNoError:errors.length===0};
  for(const [name,pass] of Object.entries(checks)){out.push(pass);console.log('QA247_UI_PURGE_'+(pass?'PASS':'FAIL'),label,name,JSON.stringify({initial,removal,result,errors}));}
  await ctx.close();
 }
}catch(e){console.error('QA247_UI_PURGE_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
const passed=out.filter(Boolean).length;console.log('QA247_UI_PURGE_SUMMARY',JSON.stringify({passed,failed:out.length-passed}));if(passed!==out.length)process.exitCode=1;
})();
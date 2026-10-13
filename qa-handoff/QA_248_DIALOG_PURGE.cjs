'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const original=fs.readFileSync('qa-handoff/index.before-2-8-248.html');
if(crypto.createHash('sha256').update(original).digest('hex')!=='2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776')throw Error('Wrong official baseline');
const html=fs.readFileSync('qa-handoff/index.working-2-8-248.html','utf8');
(async()=>{let server,browser;const out=[];try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.url==='/blank'?'<!doctype html><title>QA248 passive shared-origin tab</title>':html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [true,false]){
  const label=mobile?'mobile':'desktop',ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:800},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})});
  const a=await ctx.newPage(),b=await ctx.newPage(),errors=[];a.on('pageerror',x=>errors.push(String(x)));
  await a.route('https://cdn.jsdelivr.net/**',route=>route.abort());await b.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const url='http://127.0.0.1:'+server.address().port+'/';
  await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'blank',{waitUntil:'domcontentloaded'})]);
  await a.waitForTimeout(350);
  const token='qa248-ui-secret-'+label,secret='QA248-SECRET-ADMIN-'+label;
  const initial=await a.evaluate(({token,secret})=>{
    state.sessionToken=token;state.me={employee_id:246,display_name:'QA248',category:'A',is_admin:true,is_read_only:false,personnel_account_status:'active'};state.accountStatusPersonnelAuthoritative=true;state.initialPinRequired=false;state.pinStatus={246:true};
    localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token); // Legacy stale tab unlock must not keep admin UI alive after shared revocation.
    if(!MOBILE_SESSION_DEVICE)localStorage.setItem(PC_REMEMBER_KEY,'1');
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    for(const id of ['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList']){const el=document.getElementById(id);if(el)el.textContent=secret;}
    return {admin:activeAdminMode(),panels:['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList'].map(id=>!!document.getElementById(id))};
  },{token,secret});
  let nativeDialogSeen=false,nativeError='';
  a.once('dialog',async dialog=>{nativeDialogSeen=true;try{await b.evaluate(key=>localStorage.removeItem(key),'staffAttendance_admin2_ok_v1');}catch(e){nativeError=String(e)}finally{await dialog.accept().catch(()=>{})}});
  await a.evaluate(()=>confirm('QA248 native Chrome sensitive-cache revocation'));

  await a.waitForTimeout(500);
  const result=await a.evaluate(secret=>{
    const names=['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList'];const remaining=names.filter(id=>document.getElementById(id)?.textContent.includes(secret));
    return {adminActive:activeAdminMode(),remaining,oldPinStatus:state.pinStatus?.[246],adminToolsHidden:document.getElementById('adminTools')?.classList.contains('hidden'),sessionTokenStillThere:!!state.sessionToken};
  },secret);
  const checks={nativeDialogReceived:nativeDialogSeen&&nativeError==='',startedAdmin:initial.admin,privilegedPanelsFound:initial.panels.every(Boolean),adminRevoked:!result.adminActive,domSecretPurged:result.remaining.length===0,pinCachePurged:result.oldPinStatus===undefined,adminToolsHidden:result.adminToolsHidden===true,sessionPreserved:result.sessionTokenStillThere,jsNoError:errors.length===0};
  for(const [name,pass] of Object.entries(checks)){out.push(pass);console.log('QA248_DIALOG_PURGE_'+(pass?'PASS':'FAIL'),label,name,JSON.stringify({initial,result,errors}));}
  await ctx.close();
 }
}catch(e){console.error('QA248_DIALOG_PURGE_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
const passed=out.filter(Boolean).length;console.log('QA248_DIALOG_PURGE_SUMMARY',JSON.stringify({passed,failed:out.length-passed}));if(passed!==out.length)process.exitCode=1;
})();
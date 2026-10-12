'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const bytes=fs.readFileSync('qa-handoff/index.before-2-8-244.html');
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
if(hash!=='fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4'||bytes.length!==1167315)throw Error('244 immutable baseline mismatch');
const html=fs.readFileSync('qa-handoff/index.working-2-8-244.html','utf8');
const results=[];
(async()=>{
 let server,browser;
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const mode of ['mobile','desktop']){
   const opts={viewport:{width:390,height:844},isMobile:mode==='mobile',hasTouch:mode==='mobile'};
   if(mode==='mobile')opts.userAgent='Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36';
   const context=await browser.newContext(opts),page=await context.newPage();
   await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(300);
   const observed=await page.evaluate(async(mode)=>{
     const oldConfigured=window.configured,oldFetch=window.fetch;const captured=[];
     const token='qa244-scope-'+mode;
     window.configured=()=>true;
     window.fetch=async(url,options)=>{if(String(url).includes('/rest/v1/rpc/')){const name=String(url).split('/').pop();captured.push(name);return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(url,options)};
     state.sessionToken=token;state.me={employee_id:244,is_admin:true,display_name:'QA244',category:'A',is_read_only:false,personnel_account_status:'active'};state.initialPinRequired=false;
     state.accountStatusPersonnelAuthoritative=true;
     localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
     if(mode==='desktop'){sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token)}
     const call=async(name,payload={})=>{let error='';try{await rpc(name,{p_token:token,...payload})}catch(e){error=String(e?.message||e)}return error};
     // Mandatory PIN gate while the user is in the forced reset dialog:
     state.initialPinRequired=true;
     const pinReadError=await call('list_my_memos');
     const sensitiveError=await call('export_my_data_v1');
     const checkError=await call('initial_pin_status_v1');
     const afterGate=[...captured];
     // Admin unlock is removed between initial request validation and final send.
     state.initialPinRequired=false;
     const adminReady=adminUnlockMatches(token);
     setTimeout(()=>{localStorage.removeItem(ADMIN_UNLOCK_KEY);sessionStorage.removeItem(ADMIN_UNLOCK_KEY)},0);
     const adminError=await call('admin_reset_data_v2');
     const afterLostAdmin=[...captured];
     // A legitimate admin with a newly re-established unlock must still be able
     // to use the protected admin operation (mock network only).
     if(mode==='desktop')sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);else localStorage.setItem(ADMIN_UNLOCK_KEY,token);
     const adminValidError=await call('admin_reset_data_v2');
     const all=[...captured];
     window.configured=oldConfigured;window.fetch=oldFetch;
     return {mode,adminReady,pinReadError,sensitiveError,checkError,adminError,adminValidError,afterGate,afterLostAdmin,all};
   },mode);
   const gatedBusinessRead=!observed.afterGate.includes('list_my_memos');
   const gatedSensitive=!observed.afterGate.includes('export_my_data_v1');
   const pinCheckAllowed=observed.afterGate.includes('initial_pin_status_v1');
   const adminRevokedBlocked=!observed.afterLostAdmin.includes('admin_reset_data_v2');
   const validAdminAllowed=observed.all.filter(x=>x==='admin_reset_data_v2').length===1;
   const checks={gatedBusinessRead,gatedSensitive,pinCheckAllowed,adminRevokedBlocked,validAdminAllowed,bootErrors:errors.length===0};
   for(const [check,pass] of Object.entries(checks)){const item={name:mode+' '+check,pass,observed};results.push(item);console.log('QA244_'+(pass?'PASS':'FAIL'),item.name,JSON.stringify(observed))}
   await context.close();
  }
 }catch(e){console.error('QA244_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
 const failed=results.filter(x=>!x.pass);
 console.log('QA244_SUMMARY',JSON.stringify({passed:results.length-failed.length,failed:failed.length,failed_names:failed.map(x=>x.name),baseline_sha256:hash}));
 if(failed.length)process.exitCode=1;
})();
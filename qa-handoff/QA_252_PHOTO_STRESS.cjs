'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.working-2-8-252.html','utf8');
const sha=crypto.createHash('sha256').update(source).digest('hex');
const immutable=crypto.createHash('sha256').update(fs.readFileSync('qa-handoff/index.before-2-8-252.html')).digest('hex');if(immutable!=='90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e'||sha===immutable)throw Error('baseline integrity or patch not applied');
(async()=>{let srv,browser,passed=0,failed=0;const check=(name,ok,detail)=>{(ok?passed++:failed++);console.log('QA252_'+(ok?'PASS':'FAIL'),name,JSON.stringify(detail||{}));};
try{
 srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.url==='/blank'?'<!doctype html><title>Sibling</title>':source)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(let cycle=0;cycle<6;cycle++)for(const op of ['clear','remove','control']){
  const context=await browser.newContext({viewport:{width:1200,height:820}}),a=await context.newPage(),b=await context.newPage(),errors=[];
  a.on('pageerror',e=>errors.push(String(e)));await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const url='http://127.0.0.1:'+srv.address().port+'/';await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'blank',{waitUntil:'domcontentloaded'})]);await a.waitForTimeout(400);
  const token='qa252-photo-stress-'+cycle+'-'+op;
  const setup=await a.evaluate(token=>{
    window.configured=()=>true;state.sessionToken=token;state.me={employee_id:252,display_name:'QA252',category:'A',is_admin:true,is_read_only:false,personnel_account_status:'active'};
    state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;state.accountStatusBackendReady=true;state.view='mine';state.selectedDate='2026-10-10';
    state.fingerprintBackendReady=true;state.personnelBackendReady=true;state.employees=[{id:252,category:'A',display_name:'QA252'}];document.getElementById('detailBackdrop').classList.add('open');
    localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);localStorage.setItem(PC_REMEMBER_KEY,'1');sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    window.compressFingerprintImage=async()=>({base64:'QUJD',dataUrl:'data:image/jpeg;base64,QUJD',mime:'image/jpeg',name:'qa252.jpg',bytes:3});
    window.fingerprintPersonnelReady=()=>true;window.fingerprintDateOperational=()=>true;window.fingerprintWorkday=()=>false;
    window.fingerprintWriteContextCatchupNeeded=()=>false;window.pageLifecycleWriteFreshnessReady=()=>true;
    return {owned:fingerprintPickerStillCurrent({actor:252,token,contextEpoch:sessionContextEpoch,key:'2026-10-10'}),persistent:sessionIsPersistent(token),admin:activeAdminMode()};
  },token);
  let dialogSeen=false,changed=false,handlerError='';
  a.once('dialog',async d=>{dialogSeen=true;try{changed=await b.evaluate(op=>{if(op==='clear')localStorage.clear();else if(op==='remove')localStorage.removeItem('staffAttendance_session_v1');return localStorage.getItem('staffAttendance_session_v1')===null},op)}catch(e){handlerError=String(e)}finally{await d.accept().catch(()=>{})}});
  const result=await Promise.race([a.evaluate(async()=>{
    const oldFetch=window.fetch,calls=[];window.fetch=async(u,o)=>{if(String(u).includes('/rest/v1/rpc/')){calls.push(String(u).split('/').pop());return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(u,o)};
    let err='';try{await handleFingerprintPhotoInput(new File(['qa'],'photo.jpg',{type:'image/jpeg'}),{actor:252,token:state.sessionToken,contextEpoch:sessionContextEpoch,key:'2026-10-10',kind:'clock_in'})}catch(e){err=String(e.stack||e)}
    return {calls,err,guard:nativeDialogOwnershipSettleUntil,now:Date.now(),message:document.getElementById('fingerprintDetailError')?.textContent||'',token:state.sessionToken};
  }),new Promise((_,reject)=>setTimeout(()=>reject(Error('native photo timeout')),16000))]);
  check(op+':valid-initial-setup',setup.owned&&setup.persistent,{setup});
  check(op+':actual-native-confirm',dialogSeen&&!handlerError,{dialogSeen,changed,handlerError,result});
  if(op==='control')check(op+':save-issued-under-valid-login',result.calls.includes('save_my_fingerprint_photo'),{result});
  else check(op+':revoked-token-prevents-save',changed&&!result.calls.includes('save_my_fingerprint_photo'),{result});
  check(op+':no-js-error',!result.err&&errors.length===0,{result,errors});
  await context.close();
 }
}catch(e){failed++;console.log('QA252_HARNESS_ERROR',String(e.stack||e));}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r));}
console.log('QA252_STRESS_SUMMARY',JSON.stringify({passed,failed,sha}));if(failed)process.exitCode=1;
})();
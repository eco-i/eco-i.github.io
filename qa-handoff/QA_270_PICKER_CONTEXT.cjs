'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-270.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('270 baseline mismatch');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true])for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles']){
  const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await p.evaluate(()=>{
   let pass=0,fail=0,issues=[];
   const ck=(s,b)=>{if(b)pass++;else{fail++;if(issues.length<15)issues.push(s)}};
   const token='qa270-picker-session';
   state.me={employee_id:270,is_admin:false,is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;
   state.view='mine';state.selectedDate='2026-10-15';
   // A genuine login writes the token to the authoritative shared storage before picker opening.
   localStorage.setItem(SESSION_KEY,token);
   const epoch=sessionContextEpoch,modal=document.getElementById('detailBackdrop');
   if(!modal)throw Error('detail modal missing');
   const previous=modal.classList.contains('open');modal.classList.add('open');
   const context={actor:270,token,contextEpoch:epoch,key:'2026-10-15',kind:'clock_in',changeSeen:false};
   ck('valid picker session',fingerprintPickerSessionCurrent(context)===true);
   ck('valid picker detail',fingerprintPickerStillCurrent(context)===true);
   ck('null picker rejected',fingerprintPickerSessionCurrent(null)===false);
   ck('other actor rejected',fingerprintPickerSessionCurrent({...context,actor:271})===false);
   ck('other token rejected',fingerprintPickerSessionCurrent({...context,token:'another-session'})===false);
   ck('stale epoch rejected',fingerprintPickerSessionCurrent({...context,contextEpoch:epoch-1})===false);
   ck('other key context rejected',fingerprintPickerStillCurrent({...context,key:'2026-10-14'})===false);
   state.selectedDate='2026-10-14';
   ck('changed selected date rejected',fingerprintPickerStillCurrent(context)===false);
   state.selectedDate='2026-10-15';state.view='admin';
   ck('changed tab rejected',fingerprintPickerStillCurrent(context)===false);
   state.view='mine';modal.classList.remove('open');
   ck('closed detail rejected',fingerprintPickerStillCurrent(context)===false);
   modal.classList.add('open');
   ck('restored modal accepted',fingerprintPickerStillCurrent(context)===true);
   state.sessionToken='new-session';
   ck('new login rejects old picker',fingerprintPickerSessionCurrent(context)===false);
   state.sessionToken=token;
   ck('original token active again',fingerprintPickerSessionCurrent(context)===true);
   // Cancel cleanup without a detail render; no camera/file picker is invoked by this test.
   modal.classList.remove('open');fingerprintPickerFlowActive=true;
   fingerprintPickerContext={...context};fingerprintPendingKind='clock_in';
   const input=document.getElementById('fingerprintPhotoInput');
   if(!input)throw Error('fingerprint photo input missing');
   finishFingerprintPickerWithoutSelectionEvent();
   ck('cancel clears busy',fingerprintPickerFlowActive===false);
   ck('cancel clears context',fingerprintPickerContext===null);
   ck('cancel clears kind',fingerprintPendingKind==='');
   ck('cancel clears input',input.value==='');
   finishFingerprintPickerWithoutSelectionEvent();
   ck('duplicate cancel is safe',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);
   localStorage.setItem('staffAttendance_sharedLoggedOutToken_v1',token);
   ck('logout marker revokes old picker',fingerprintPickerSessionCurrent(context)===false);
   localStorage.removeItem('staffAttendance_sharedLoggedOutToken_v1');
   if(previous)modal.classList.add('open');
   return {pass,fail,issues};
  });
  pass+=result.pass;fail+=result.fail+errors.length;contexts++;
  if(result.fail||errors.length)issues.push({tz,mobile,issues:result.issues,pageErrors:errors.slice(0,3)});
  await cx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA270_PICKER_CONTEXT_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));if(fail)process.exitCode=1;
})();
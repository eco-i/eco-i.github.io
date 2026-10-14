'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-254.html','utf8');if(crypto.createHash('sha256').update(html).digest('hex')!=='056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b')throw Error('bad 253 source');
(async()=>{let srv,browser,pass=0,fail=0;const check=(name,ok,info={})=>{(ok?pass++:fail++);console.log('QA254_PICKER_'+(ok?'PASS':'FAIL'),name,JSON.stringify(info));};
try{srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(res=>srv.listen(0,'127.0.0.1',res));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
 const label=mobile?'mobile':'desktop',ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0.0.0 Mobile Safari/537.36'}:{})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(380);
 const data=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=140;c.height=70;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,140,70);g.fillStyle='#123';g.fillText('TEST',20,35);return c.toDataURL('image/png').split(',')[1]});
 const token='local:253';
 const setup=await p.evaluate(({token,mobile})=>{
  window.configured=()=>false;state.sessionToken=token;state.me={employee_id:253,display_name:'QA',category:'A',is_admin:false,is_read_only:false,personnel_account_status:'active'};state.view='mine';state.selectedDate='2026-10-10';
  state.fingerprintBackendReady=true;state.personnelBackendReady=true;state.accountStatusBackendReady=true;state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;state.employees=[{id:253,category:'A',display_name:'QA'}];
  localStorage.clear();sessionStorage.clear();(mobile?localStorage:sessionStorage).setItem(SESSION_KEY,token);
  window.fingerprintPersonnelReady=()=>true;window.fingerprintDateOperational=()=>true;window.fingerprintWorkday=()=>true;window.fingerprintWriteContextCatchupNeeded=()=>false;
  window.pageLifecycleWriteFreshnessReady=()=>true;window.renderFingerprintDetail=()=>{};window.resyncFingerprintAfterMutation=async()=>true;window.showPostMutationResult=()=>{};window.showLoading=()=>{};
  document.getElementById('detailBackdrop').classList.add('open');
  fingerprintPendingKind='clock_in';fingerprintPickerFlowActive=true;fingerprintPickerContext={actor:253,token,contextEpoch:sessionContextEpoch,key:'2026-10-10',kind:'clock_in',changeSeen:false};
  return {ready:fingerprintPickerStillCurrent(fingerprintPickerContext),isMobile:MOBILE_SESSION_DEVICE,flow:fingerprintPickerFlowActive};
 },{token,mobile});
 await p.locator('#fingerprintPhotoInput').setInputFiles({name:'actual_picker_253.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
 await p.waitForFunction(()=>!fingerprintPickerFlowActive,{timeout:13000});
 const after=await p.evaluate(()=>({rows:localFingerprintRecords().map(r=>({date:r.record_date,hasIn:!!r.clock_in,mime:r.clock_in?.mime,size:r.clock_in?.data?.length,name:r.clock_in?.name})),flow:fingerprintPickerFlowActive,picker:fingerprintPickerContext,fileCount:document.getElementById('fingerprintPhotoInput')?.files?.length,error:document.getElementById('fingerprintDetailError')?.textContent||''}));
 const beforeLate=after.rows.length;await p.evaluate(()=>document.getElementById('fingerprintPhotoInput').dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(120);
 const afterLate=await p.evaluate(()=>({rows:localFingerprintRecords().length,flow:fingerprintPickerFlowActive,picker:fingerprintPickerContext}));
 check(label+':actual-file-event-context',setup.ready&&setup.flow&&setup.isMobile===mobile,{setup});
 check(label+':saved-photo-exactly-once',after.rows.length===1&&after.rows[0].hasIn&&after.rows[0].mime==='image/jpeg'&&after.rows[0].name==='actual_picker_253.jpg',{after});
 check(label+':file-and-context-cleared',!after.flow&&after.picker===null&&after.fileCount===0,{after});
 check(label+':late-duplicate-change-ignored',afterLate.rows===beforeLate&&!afterLate.flow&&afterLate.picker===null,{afterLate});
 const cancel=await p.evaluate(()=>{fingerprintPendingKind='clock_out';fingerprintPickerFlowActive=true;fingerprintPickerContext={actor:253,token:state.sessionToken,contextEpoch:sessionContextEpoch,key:'2026-10-10',kind:'clock_out',changeSeen:false};document.getElementById('fingerprintPhotoInput').dispatchEvent(new Event('cancel'));return {flow:fingerprintPickerFlowActive,context:fingerprintPickerContext}});
 check(label+':picker-cancel-releases-lock',!cancel.flow&&cancel.context===null,{cancel});
 check(label+':no-page-errors',errors.length===0,{errors});
 await ctx.close();
}
}catch(e){fail++;console.log('QA254_PICKER_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA254_PICKER_SUMMARY',JSON.stringify({pass,fail}));if(fail)process.exitCode=1;
})();
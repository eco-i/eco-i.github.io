'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-270.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('270 source mismatch');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true])for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles']){
const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?850:900},isMobile:mobile,hasTouch:mobile});
const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const r=await p.evaluate(async()=>{
let pass=0,fail=0,issues=[],calls=0;
const ck=(n,test)=>{if(test)pass++;else{fail++;if(issues.length<20)issues.push(n)}};
const token='qa270-picker-events';
state.me={employee_id:270,is_admin:false,is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;state.view='mine';state.selectedDate='2026-10-15';
localStorage.setItem(SESSION_KEY,token);realtimeNeedsCatchup=false;pageLifecycleFreshnessPending=false;
const detail=document.getElementById('detailBackdrop');detail.classList.add('open');
const input=document.getElementById('fingerprintPhotoInput');if(!input)throw Error('fingerprint input absent');
// Session ownership was independently asserted in QA270_PICKER_CONTEXT; keep this event-only fixture's owner stable while async timers fire.
const oldHandler=handleFingerprintPhotoInput,oldRender=renderFingerprintDetail,oldStill=fingerprintPickerStillCurrent,oldSession=fingerprintPickerSessionCurrent;
fingerprintPickerStillCurrent=()=>true;fingerprintPickerSessionCurrent=()=>true;
handleFingerprintPhotoInput=async()=>{calls++;clearFingerprintPickerContext()};
renderFingerprintDetail=()=>{};
const ctx=()=>({actor:270,token,contextEpoch:sessionContextEpoch,key:'2026-10-15',kind:'clock_in',changeSeen:false});
const fileList=()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array([255,216,255,217])],'image.jpg',{type:'image/jpeg'}));return dt.files};
const begin=(files)=>{fingerprintPickerFlowActive=true;fingerprintPickerContext=ctx();fingerprintPendingKind='clock_in';input.files=files};
begin(fileList());
input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
await new Promise(ok=>setTimeout(ok,380));
ck('duplicate change one handler call',calls===1);
ck('duplicate change unlocks picker',fingerprintPickerFlowActive===false);
ck('duplicate change clears context',fingerprintPickerContext===null);
ck('duplicate change clears type',fingerprintPendingKind==='');
const one=calls;begin(fileList());
scheduleFingerprintPickerReturnRecovery(500);
await new Promise(ok=>setTimeout(ok,850));
ck('lost change watchdog one handler',calls===one+1);
ck('lost change flow released',fingerprintPickerFlowActive===false);
ck('lost change context released',fingerprintPickerContext===null);
const beforeCancel=calls;begin(new DataTransfer().files);
scheduleFingerprintPickerReturnRecovery(500);
await new Promise(ok=>setTimeout(ok,680));
ck('cancel with no event invokes no handler',calls===beforeCancel);
ck('cancel cleanup releases flow',fingerprintPickerFlowActive===false);
ck('cancel cleanup clears context',fingerprintPickerContext===null);
ck('cancel cleanup clears pending kind',fingerprintPendingKind==='');
handleFingerprintPhotoInput=oldHandler;renderFingerprintDetail=oldRender;fingerprintPickerStillCurrent=oldStill;fingerprintPickerSessionCurrent=oldSession;
return {pass,fail,issues,calls};
});
pass+=r.pass;fail+=r.fail+errors.length;contexts++;if(r.fail||errors.length)issues.push({tz,mobile,issues:r.issues,pageErrors:errors.slice(0,3)});
await cx.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA270_PICKER_EVENTS_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
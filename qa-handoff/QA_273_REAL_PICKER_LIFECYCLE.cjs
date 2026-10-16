'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-273.html','utf8');
const digest=crypto.createHash('sha256').update(html).digest('hex');
if(digest!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('273 immutable source mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const timezone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:timezone,viewport:{width:mobile?390:1280,height:mobile?850:900},isMobile:mobile,hasTouch:mobile});
   try{
    const main=await cx.newPage(),peer=await cx.newPage(),errors=[];
    for(const p of [main,peer]){p.on('pageerror',e=>errors.push(String(e.message||e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());}
    await Promise.all([main,peer].map(p=>p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'})));
    // Real application startup needs Web Locks and local storage migration before event wire() is bound.
    await main.waitForTimeout(1700);
    const token='qa273-picker-'+(mobile?'m':'d')+'-'+timezone;
    const result=await main.evaluate(async token=>{
      let pass=0,fail=0,issues=[],calls=0;
      const ck=(label,yes)=>{if(yes)pass++;else{fail++;if(issues.length<30)issues.push(label)}};
      const input=document.getElementById('fingerprintPhotoInput'),modal=document.getElementById('detailBackdrop');
      ck('actual file input exists',input?.type==='file');
      ck('actual detail modal exists',!!modal);
      if(!input||!modal)throw Error('missing picker DOM');
      const oldHandler=handleFingerprintPhotoInput,oldRender=renderFingerprintDetail,oldEpoch=sessionContextEpoch;
      const tick=ms=>new Promise(done=>setTimeout(done,ms));
      const reset=()=>{
        clearFingerprintPickerContext();
        fingerprintPickerFlowActive=false;
        state.me={employee_id:273,display_name:'273 QA',group_code:'B',is_admin:false,is_read_only:false};
        state.sessionToken=token;state.initialPinRequired=false;state.view='mine';state.selectedDate='2026-10-15';
        localStorage.setItem(SESSION_KEY,token);
        localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
        sessionContextEpoch=oldEpoch;
        modal.classList.add('open');
        state.fingerprintBackendReady=true;
        state.refreshing=false;
        realtimeNeedsCatchup=false;
        pageLifecycleFreshnessPending=false;
      };
      const fileList=()=>{const d=new DataTransfer();d.items.add(new File([new Uint8Array([255,216,255,217])],'fingerprint.jpg',{type:'image/jpeg'}));return d.files};
      const arm=()=>{
        const ctx={actor:273,token,contextEpoch:sessionContextEpoch,key:'2026-10-15',kind:'clock_in',changeSeen:false};
        fingerprintPickerContext=ctx;fingerprintPickerFlowActive=true;fingerprintPendingKind='clock_in';
        input.files=fileList();
        return ctx;
      };
      // Instrument only the downstream upload boundary. Genuine wire() change/cancel listeners and
      // real ownership/tombstone checks run unmodified. No Supabase upload is claimed by this test.
      handleFingerprintPhotoInput=async(file,ctx)=>{calls++;ck('handler receives file',file instanceof File);ck('handler receives owner context',ctx?.actor===273);clearFingerprintPickerContext();};
      renderFingerprintDetail=()=>{};
      try{
        reset();arm();
        ck('valid starting picker session',fingerprintPickerSessionCurrent(fingerprintPickerContext));
        input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(300);
        ck('double change invokes one upload boundary',calls===1);
        ck('double change releases busy',!fingerprintPickerFlowActive);
        ck('double change clears picker context',fingerprintPickerContext===null);
        ck('double change clears pending kind',fingerprintPendingKind==='');
        ck('double change releases native input file',input.files.length===0);

        reset();arm();const previousDate=calls;
        state.selectedDate='2026-10-14';
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(180);
        ck('stale date cannot enter upload boundary',calls===previousDate);
        ck('stale date releases pending picker',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);

        reset();arm();const previousTab=calls;
        state.view='admin';
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(180);
        ck('stale view cannot enter upload boundary',calls===previousTab);
        ck('stale view releases picker',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);

        reset();arm();const previousActor=calls;
        state.me={...state.me,employee_id:999};
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(180);
        ck('stale actor cannot upload',calls===previousActor);
        ck('stale actor releases picker',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);

        reset();arm();const previousEpoch=calls;
        sessionContextEpoch++;
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(180);
        ck('stale epoch cannot upload',calls===previousEpoch);
        ck('stale epoch releases picker',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);

        reset();arm();const beforeCancel=calls;
        input.files=new DataTransfer().files;
        input.dispatchEvent(new Event('cancel',{bubbles:true}));
        input.dispatchEvent(new Event('cancel',{bubbles:true}));
        await tick(120);
        ck('duplicate cancel cannot upload',calls===beforeCancel);
        ck('duplicate cancel releases picker',!fingerprintPickerFlowActive);
        ck('duplicate cancel clears input',input.files.length===0);
        ck('duplicate cancel clears context',fingerprintPickerContext===null);

        reset();arm();const beforeWatchdog=calls;
        scheduleFingerprintPickerReturnRecovery(500);
        await tick(860);
        ck('watchdog recovers missing change once',calls===beforeWatchdog+1);
        ck('watchdog clears active flow',!fingerprintPickerFlowActive);
        ck('watchdog clears context',fingerprintPickerContext===null);

        reset();arm();const beforeToken=calls;
        localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
        ck('tombstone revokes picker session',fingerprintPickerSessionCurrent(fingerprintPickerContext)===false);
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await tick(180);
        ck('revoked token cannot upload',calls===beforeToken);
        ck('revoked token releases picker',!fingerprintPickerFlowActive&&fingerprintPickerContext===null);
      }finally{
        handleFingerprintPhotoInput=oldHandler;
        renderFingerprintDetail=oldRender;
        reset();
        modal.classList.remove('open');
      }
      return {pass,fail,issues,calls};
    },token);
    pass+=result.pass;fail+=result.fail+errors.length;contexts++;
    if(result.fail||errors.length)issues.push({timezone,mobile,details:result.issues,errors:errors.slice(0,4)});
    await cx.close();
   }catch(e){fail++;issues.push({timezone,mobile,harness:String(e.stack||e).slice(0,1600)});try{await cx.close()}catch(_){}}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1700)})}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
 console.log('QA273_REAL_PICKER_LIFECYCLE_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:digest,issues}));
 if(fail)process.exitCode=1;
})();

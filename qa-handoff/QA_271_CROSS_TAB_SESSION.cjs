'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-271.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('271 immutable baseline mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 const ck=(name,ok,scope)=>{if(ok)pass++;else{fail++;if(issues.length<50)issues.push({name,scope});}};
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const scope={tz,mobile},cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?850:900},isMobile:mobile,hasTouch:mobile});
   try{
    const a=await cx.newPage(),b=await cx.newPage(),errs=[];
    a.on('pageerror',e=>errs.push('A:'+e.message));b.on('pageerror',e=>errs.push('B:'+e.message));
    for(const p of [a,b])await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await Promise.all([a,b].map(p=>p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'})));
    // Wait for the real app startup/wire/Web Lock rather than replacing its session or event handlers.
    await a.waitForTimeout(1600);
    const token='qa271-shared-'+tz+'-'+(mobile?'mobile':'desktop');
    const boot=await a.evaluate(token=>{
      state.me={employee_id:271,display_name:'271 검수',group_code:'B',is_admin:false,is_read_only:false};
      state.sessionToken=token;state.initialPinRequired=false;state.view='mine';state.selectedDate='2026-10-15';
      localStorage.setItem(SESSION_KEY,token);
      const modal=document.getElementById('detailBackdrop');modal.classList.add('open');
      const ctx={actor:271,token,contextEpoch:sessionContextEpoch,key:'2026-10-15',kind:'clock_in',changeSeen:false};
      fingerprintPickerContext={...ctx};fingerprintPendingKind='clock_in';fingerprintPickerFlowActive=true;
      return {ctx,preSession:fingerprintPickerSessionCurrent(ctx),preDetail:fingerprintPickerStillCurrent(ctx),
        inputType:document.getElementById('fingerprintPhotoInput')?.type,
        appVersion:APP_VERSION,epoch:sessionContextEpoch};
    },token);
    ck('auth valid pre-logout',boot.preSession===true,scope);
    ck('picker owner valid pre-logout',boot.preDetail===true,scope);
    ck('native file input exists',boot.inputType==='file',scope);
    ck('APP_VERSION protected',boot.appVersion==='ver20260927-0944',scope);
    const bad=await a.evaluate(ctx=>({
      actor:fingerprintPickerSessionCurrent({...ctx,actor:999}),
      token:fingerprintPickerSessionCurrent({...ctx,token:'another'}),
      epoch:fingerprintPickerSessionCurrent({...ctx,contextEpoch:ctx.contextEpoch+1}),
      date:fingerprintPickerStillCurrent({...ctx,key:'2026-10-14'}),
      tab:(()=>{state.view='admin';let result=fingerprintPickerStillCurrent(ctx);state.view='mine';return result;})()
    }),boot.ctx);
    for(const [label,value] of Object.entries(bad))ck('stale '+label+' rejected',value===false,scope);
    // Distinct same-origin tab writes a normal logout suppression/tombstone signal.
    const signal=await b.evaluate(token=>{localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
      return localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===token;},token);
    ck('other tab sent suppression marker',signal===true,scope);
    await a.waitForTimeout(100);
    const revoked=await a.evaluate(ctx=>({
      rejected:!fingerprintPickerSessionCurrent(ctx),
      cannotUpload:!fingerprintPickerStillCurrent(ctx),
      // The legacy raw SESSION_KEY direct-removal test from 265 is deliberately NOT an oracle here.
      marker:storedSessionTombstoned(ctx.token)
    }),boot.ctx);
    ck('other-tab revocation rejects pending picker',revoked.rejected,scope);
    ck('other-tab revocation rejects detail upload',revoked.cannotUpload,scope);
    // No requirement on stale raw localStorage deletion. 265 exception retained.
    const relogin=await a.evaluate(old=>{
      const newer=old.token+'-renewed';
      state.me={employee_id:271,display_name:'271 재로그인',group_code:'B',is_admin:false,is_read_only:false};
      state.sessionToken=newer;state.initialPinRequired=false;state.view='mine';state.selectedDate='2026-10-15';
      localStorage.setItem(SESSION_KEY,newer);
      document.getElementById('detailBackdrop').classList.add('open');
      const next={...old,token:newer,contextEpoch:sessionContextEpoch};
      const result={oldRejected:!fingerprintPickerSessionCurrent(old),
        newAuthorized:fingerprintPickerSessionCurrent(next),newDetail:fingerprintPickerStillCurrent(next)};
      fingerprintPickerContext={...next};fingerprintPickerFlowActive=true;fingerprintPendingKind='clock_in';
      finishFingerprintPickerWithoutSelectionEvent();
      result.cancelReleased=!fingerprintPickerFlowActive;
      result.cancelClearsContext=fingerprintPickerContext===null;
      result.cancelClearsKind=fingerprintPendingKind==='';
      result.cancelClearsFile=document.getElementById('fingerprintPhotoInput').value==='';
      return result;
    },boot.ctx);
    ck('old context not revived by new token',relogin.oldRejected,scope);
    ck('new authorized context',relogin.newAuthorized,scope);
    ck('new detail context',relogin.newDetail,scope);
    for(const k of ['cancelReleased','cancelClearsContext','cancelClearsKind','cancelClearsFile'])ck(k,relogin[k],scope);
    // Local Seoul-day property must be invariant across device timezone at midnight.
    for(const instant of ['2026-10-15T14:59:59Z','2026-10-15T15:00:01Z','2026-12-31T14:59:59Z','2026-12-31T15:00:01Z']){
      await a.clock.setFixedTime(new Date(instant));
      const d=await a.evaluate(()=>({today:todayKey(),korea:koreaTodayKey()}));
      const expected=new Date(Date.parse(instant)+9*3600000).toISOString().slice(0,10);
      ck('KST turnover '+instant,d.today===expected&&d.korea===expected,{...scope,d,expected});
    }
    const grid=await a.evaluate(()=>({c:shiftForGroup('C',2026,9,15),a:shiftForGroup('A',2026,9,15),
      next:['A','B','C','D'].map(g=>shiftForGroup(g,2026,9,16)),width:document.documentElement.scrollWidth-innerWidth}));
    ck('15 Oct C-group special night',grid.c==='야',scope);
    ck('15 Oct A-group overhaul day',grid.a==='주2',scope);
    ck('16 Oct shift unique again',new Set(grid.next).size===4,scope);
    ck('viewport overflow acceptable',grid.width<=30,scope);
    ck('no uncaught page exceptions',errs.length===0,{...scope,errs:errs.slice(0,4)});
    contexts++;
   }catch(e){fail++;issues.push({scope,error:String(e.stack||e).slice(0,1800)});}
   finally{await cx.close();}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,2000)});}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
 console.log('QA271_CROSS_TAB_SESSION_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

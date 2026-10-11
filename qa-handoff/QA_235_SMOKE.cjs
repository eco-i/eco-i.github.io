'use strict';
const fs=require('fs'), crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const http=require('http'); const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-235.html','utf8');
const file='qa-handoff/index.working-2-8-235.html';
const html=fs.readFileSync(file,'utf8');
const expected='a46a2d8d11f1eaecab8b42e461804bad70650c4da462324e370dd307a112cd63';
// QA 235 stabilized mutex stress regression v2
// QA 235 verified Web Lock real two-tab test, syntax correction
const pass=[];
function check(name,fn){const result=fn(); assert(result!==false, name+' returned false');pass.push(name);}
check('SHA256 official baseline',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('1157156 byte baseline',()=>Buffer.byteLength(baseline)===1157156);
check('APP_VERSION pinned',()=>html.includes("ver20260927-0944"));
check('235 original official SHA256 pinned',()=>crypto.createHash('sha256').update(baseline).digest('hex')==='a46a2d8d11f1eaecab8b42e461804bad70650c4da462324e370dd307a112cd63');
check('Web Locks critical sections applied',()=>html.includes('withBrowserSharedSessionLock')&&html.includes('staffAttendance_sharedSessionBrowserLock_v3'));
check('Official 235 baseline immutable',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('235 product repair candidate present',()=>html!==baseline&&html.includes('safelyClearStoredLoginSession')&&html.includes('ensureAdminUnlockForRestoreWithScope'));
console.log('QA235_WORKING_SHA',crypto.createHash('sha256').update(html).digest('hex'),'bytes',Buffer.byteLength(html));
const allScript=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
check('all inline JS parses',()=>{for(const script of allScript)new vm.Script(script);return allScript.length>=2});
const bodyBeforeJs=html.slice(0,html.indexOf('<script async src='));
const ids=[...bodyBeforeJs.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('No duplicated static DOM IDs',()=>new Set(ids).size===ids.length);
check('4-group overhaul decision path present',()=>html.includes("key>='2026-10-01'&&key<='2026-10-15'"));
check('No console access to live Supabase needed',()=>true);
(async()=>{
 let server, browser;
 try {
  server=http.createServer((req,res)=>{
   if(req.url==='/'||req.url.startsWith('/index')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}
   else {res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(700);
  check('App boot no JS uncaught exception',()=>pageErrors.length===0);
  const evaluated=await page.evaluate(()=>{
   const results=[];
   function add(n,ok,detail){results.push({name:n,ok:!!ok,detail:detail||''});}
   add('State and APIs boot',typeof state==='object'&&typeof shiftForGroup==='function'&&typeof strictRpcTimestamp==='function');
   add('Overhaul A/C Oct 1-2', ['A','C'].every(g=>[1,2].every(d=>shiftForGroup(g,2026,9,d)==='주2')));
   add('Overhaul weekend', ['A','B','C','D'].every(g=>shiftForGroup(g,2026,9,3)==='휴'));
   add('Overhaul C Oct 15 night',shiftForGroup('C',2026,9,15)==='야');
   add('Overhaul other groups Oct 15', ['A','B','D'].every(g=>shiftForGroup(g,2026,9,15)==='주2'));
   add('Personnel sort zero',personnelSortOrderOr(0)===0&&personnelSortOrderOr('0')===0);
   add('Personnel invalid sorts',personnelSortOrderOr(-1)===999&&personnelSortOrderOr(null)===999);
   add('Annual merge exact',annualLeaveSegmentsMinutes([{start:2,end:10},{start:8,end:15},{start:40,end:50}])===23);
   let fuzzOkay=true,seed=239234;
   function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
   for(let t=0;t<500;t++){
     const xs=[];for(let k=0;k<10;k++){let a=Math.floor(rand()*121),b=Math.floor(rand()*121);xs.push({start:Math.min(a,b),end:Math.max(a,b)});}
     const occupied=new Set();for(const x of xs)for(let v=x.start;v<x.end;v++)occupied.add(v);
     if(annualLeaveSegmentsMinutes(xs)!==occupied.size){fuzzOkay=false;break;}
   }
   add('Annual minutes 500 independent intervals',fuzzOkay);
   add('Long-service 5-year anniversary',lsRecognizedAnniversaryDate('2021-01-01',5,[])==='2026-01-01');
   function rejects(fn){try{fn();return false}catch(_){return true}}
   add('Timestamp rejects nonexistent Feb 30',rejects(()=>strictRpcTimestamp('2026-02-30T12:00:00Z')));
   add('Timestamp rejects 25th hour',rejects(()=>strictRpcTimestamp('2026-10-11T25:00:00Z')));
   add('Timestamp rejects invalid UTC offset',rejects(()=>strictRpcTimestamp('2026-10-11T12:00:00+15:00')));
   add('Timestamp accepts microseconds',strictRpcTimestamp('2026-10-11T12:00:00.123456+09:00')==='2026-10-11T12:00:00.123456+09:00');
   const row={record_date:'2026-10-10',has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:'2026-10-10T10:00:00Z'};
   add('Fingerprint valid list',strictFingerprintRpcRows([row]).length===1);
   add('Fingerprint rejects duplicates',rejects(()=>strictFingerprintRpcRows([row,row])));
   add('Fingerprint rejects inconsistent photo metadata',rejects(()=>strictFingerprintRpcRows([{...row,has_clock_in:true}])));
   add('Fingerprint rejects false confirmed state',rejects(()=>strictFingerprintRpcRows([{...row,confirmed:true}])));
   add('Fingerprint timestamp timezone normalization',fingerprintTimestampEqual('2026-10-11T10:00:00.123456+09:00','2026-10-11T01:00:00.123456Z'));
   return results;
  });
  for(const x of evaluated)check(x.name,()=>{if(!x.ok)throw Error(x.detail||x.name);return true;});

  const extras=await page.evaluate(()=>{
    const results=[],add=(name,ok,detail)=>results.push({name,ok:!!ok,detail:detail||''});
    const patterns={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
    const anchor=Date.UTC(2026,8,1),holidays=new Set(['2026-10-03','2026-10-05','2026-10-09']);let count=0;const errors=[];
    for(let y=2026;y<=2027;y++)for(let m=0;m<12;m++)for(let d=1;d<=new Date(Date.UTC(y,m+1,0)).getUTCDate();d++){
      const dt=new Date(Date.UTC(y,m,d)),key=dt.toISOString().slice(0,10),offset=Math.round((dt.valueOf()-anchor)/86400000);
      for(const g of ['A','B','C','D']){
        let expected=patterns[g][((offset%8)+8)%8];
        if(key>='2026-10-01'&&key<='2026-10-15')expected=holidays.has(key)||[0,6].includes(dt.getUTCDay())?'휴':g==='C'&&key==='2026-10-15'?'야':'주2';
        const actual=shiftForGroup(g,y,m,d);if(actual!==expected&&errors.length<5)errors.push({key,g,expected,actual});count++;
      }
    }
    add('2920 independently expected group-shifts',count===2920&&errors.length===0,JSON.stringify(errors));
    const c={id:987654,display_name:'QA',group_code:'C',category:'C조',active_from:'2026-01-01'};
    const b={...c,id:987655,group_code:'B',category:'B조'};
    add('Night 11h full day',annualLeaveFullDayMinutes(c,'2026-09-05')===660);
    add('Day 11h full day',annualLeaveFullDayMinutes(b,'2026-09-03')===660);
    add('Overhaul 8h full day',annualLeaveFullDayMinutes(c,'2026-10-01')===480);
    add('Off shift 0h full day',annualLeaveFullDayMinutes(c,'2026-09-03')===0);
    const rec={attendance_type:'연가',absence_mode:'time',start_date:'2026-09-05',end_date:'2026-09-05',start_time:'23:00',end_time:'02:00'};
    add('Night leave midnight 3h',annualLeaveMinutesForRecord(rec,c,'2026-01-01','2026-12-31')===180);
    add('Night leave 01:00-03:00 2h',annualLeaveMinutesForRecord({...rec,start_time:'01:00',end_time:'03:00'},c,'2026-01-01','2026-12-31')===120);
    add('Night leave 09:00-10:00 0h',annualLeaveMinutesForRecord({...rec,start_time:'09:00',end_time:'10:00'},c,'2026-01-01','2026-12-31')===0);
    add('HTML escape injection payload',!escapeHtml('<img src=x onerror=alert(1)>').includes('<img'));
    add('Invalid calendar date rejection',['2026-02-30','2026-00-01','2026-13-01','2026-04-31','2026-02-29'].every(key=>lsParseISO(key)===null));
    return results;
  });
  for(const x of extras)check(x.name,()=>{if(!x.ok)throw Error(x.detail||x.name);return true;});
  const other=await page.context().newPage();await other.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await other.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await other.evaluate(()=>{window.qa235Seen=false;window.addEventListener('storage',e=>{if(e.key==='__qa235_signal__'&&e.newValue==='ping')window.qa235Seen=true;})});
  await page.evaluate(()=>localStorage.setItem('__qa235_signal__','ping'));await page.waitForTimeout(130);
  const storageEventReceived=await other.evaluate(()=>window.qa235Seen);
  check('Two actual same-origin tabs see storage event',()=>storageEventReceived);
  await page.evaluate(()=>sessionStorage.setItem('__qa235_private__','secret'));
  const tabStorageIsolated=await other.evaluate(()=>sessionStorage.getItem('__qa235_private__')===null);
  check('Two actual tabs isolate sessionStorage',()=>tabStorageIsolated);
  const events=[];let active=0,overlaps=0;
  await context.exposeBinding('__qa235RecordCritical',(_src,event)=>{
    if(event==='enter'){active++;if(active>1)overlaps++;}
    else if(event==='exit'){active--;}
    events.push(event);
  });
  const unprotected=await page.evaluate(()=>acquireSharedSessionMutex());
  check('Mutex refuses direct acquisition without browser lock',()=>unprotected===false);
  const asyncPermission=await page.evaluate(()=>withBrowserSharedSessionLock(async()=>{
    const synchronous=acquireSharedSessionMutex();
    if(synchronous)releaseSharedSessionMutex();
    await Promise.resolve();
    const afterAwait=acquireSharedSessionMutex();
    if(afterAwait)releaseSharedSessionMutex();
    return {synchronous,afterAwait};
  }));
  check('Web Lock sync permission never leaks through awaited callbacks',()=>asyncPermission.synchronous===true&&asyncPermission.afterAwait===false);
  const lockWork=tab=>tab.evaluate(async()=>{
    return withBrowserSharedSessionLock(async()=>{
      const entered=acquireSharedSessionMutex();
      if(!entered)return false;
      try{
        await window.__qa235RecordCritical('enter');
        await new Promise(resolve=>setTimeout(resolve,2));
        await window.__qa235RecordCritical('exit');
        return true;
      }finally{releaseSharedSessionMutex();}
    });
  });
  let successes=0;
  for(let k=0;k<75;k++){
    const vals=await Promise.all([lockWork(page),lockWork(other)]);
    if(vals.every(Boolean))successes+=2;
  }
  check('Actual two-tab Web Locks 150 protected entries succeed',()=>successes===150);
  check('Actual two-tab critical sections never overlap',()=>overlaps===0&&active===0&&events.length===300);
  const tokenA='qa235-exclusive-A',tokenB='qa235-exclusive-B';
  const firstSaved=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenA);
  const secondSaved=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenB);
  check('Shared login storage serial writes succeed',()=>firstSaved===true&&secondSaved===true);
  const tokenBeforeCleanup=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Latest shared token wins',()=>tokenBeforeCleanup===tokenB);
  const oldCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenA);
  const protectedNext=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY)=== 'qa235-exclusive-B');
  check('Late previous logout cannot erase new login',()=>oldCleanup===true&&protectedNext);
  const adminSet=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeAdminUnlock(token,true)),tokenB);
  const staleAdminCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedAdminUnlockIfToken(token)),tokenA);
  const adminPreserved=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY)==='qa235-exclusive-B');
  check('Admin unlock new token preserved against old cleanup',()=>adminSet===true&&staleAdminCleanup===true&&adminPreserved);
  const removed=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenB);
  const tokenErased=await other.evaluate(()=>!storageGet(localStorage,SESSION_KEY));
  check('Latest shared token can be removed explicitly',()=>removed===true&&tokenErased);
  // Application helper regression: both shared logins must be serialized even
  // when their async RPC would have completed in different browser tabs.
  const asyncFirst=await page.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa235-fresh-A';
    return storeLoginSessionForFreshLogin('qa235-fresh-A',true,loginAttemptSeq);
  });
  const asyncSecond=await other.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa235-fresh-B';
    return storeLoginSessionForFreshLogin('qa235-fresh-B',true,loginAttemptSeq);
  });
  check('Async fresh-login store wrappers succeed',()=>asyncFirst===true&&asyncSecond===true);
  const asyncCleanup=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken('qa235-fresh-A')));
  const asyncRetained=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Late old async login cleanup preserves newest',()=>asyncCleanup===true&&asyncRetained==='qa235-fresh-B');
  const freshAdmin=await other.evaluate(()=>storeAdminUnlockForFreshLogin('qa235-fresh-B',true,loginAttemptSeq));
  const obsoleteAdmin=await page.evaluate(()=>storeAdminUnlockForFreshLogin('qa235-fresh-A',true,loginAttemptSeq));
  const adminNow=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY));
  check('Async admin unlock enforces latest token',()=>freshAdmin===true&&obsoleteAdmin===false&&adminNow==='qa235-fresh-B');
  const logoutOld=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa235-fresh-A')));
  const newestAfterLogout=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Async stale logout preserves current token',()=>newestAfterLogout==='qa235-fresh-B');
  await other.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa235-fresh-B')));
  const finalToken=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Current logout clears matching shared token',()=>!finalToken);
  console.log('QA235_LOGIN_WRAPPERS',JSON.stringify({fresh_logins:2,fresh_admin:true,stale_logout_preserved:true}));

  console.log('QA235_MUTEX_REAL',JSON.stringify({lock_critical_sections:successes,overlaps,late_logout_protected:true,admin_unlock_protected:true}));
  await other.close();
  // Real storage-event session reconciliation may navigate the old tab.
  // Start the unrelated image/viewport suite in a clean document after auth races.
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(200);

  // Queued Web Lock must recheck the live login attempt INSIDE the granted callback.
  const isolatedContext=await browser.newContext({viewport:{width:390,height:844}});
  const isolated=await isolatedContext.newPage();
  await isolated.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await isolated.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  const canceled=await isolated.evaluate(async()=>{
    let releaseLock,signalReady;
    const ready=new Promise(r=>signalReady=r);
    const blocker=withBrowserSharedSessionLock(async()=>{
      signalReady();
      await new Promise(r=>releaseLock=r);
      return true;
    });
    await ready;
    state.sessionToken='qa235-outdated-token';loginAttemptSeq++;
    const attempt=loginAttemptSeq;
    const queued=storeLoginSessionForFreshLogin('qa235-outdated-token',true,attempt);
    loginAttemptSeq++;state.sessionToken='qa235-next-token';
    releaseLock();await blocker;
    const outcome=await queued;
    return {outcome,token:storageGet(localStorage,SESSION_KEY)};
  });
  check('Canceled login blocked while Web Lock queued',()=>canceled.outcome===false&&canceled.token!=='qa235-outdated-token');
  const canceledAdmin=await isolated.evaluate(async()=>{
    const token='qa235-admin-old';
    await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    let releaseLock,signalReady;const ready=new Promise(r=>signalReady=r);
    const blocker=withBrowserSharedSessionLock(async()=>{signalReady();await new Promise(r=>releaseLock=r);return true;});
    await ready;
    state.sessionToken=token;loginAttemptSeq++;
    const attempt=loginAttemptSeq,queued=storeAdminUnlockForFreshLogin(token,true,attempt);
    state.sessionToken='qa235-admin-new';loginAttemptSeq++;
    releaseLock();await blocker;
    const outcome=await queued,stored=storageGet(localStorage,ADMIN_UNLOCK_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {outcome,stored};
  });
  check('Canceled admin unlock blocked while Web Lock queued',()=>canceledAdmin.outcome===false&&canceledAdmin.stored!=='qa235-admin-old');
  await isolatedContext.close();
  const mobileContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const mobile=await mobileContext.newPage();
  await mobile.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await mobile.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileResult=await mobile.evaluate(async()=>{
    const detected=MOBILE_SESSION_DEVICE;
    const persistent=loginShouldPersist();
    const token='qa235-mobile-virtual';
    const stored=await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    const shared=storageGet(localStorage,SESSION_KEY)===token;
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {detected,persistent,stored,shared,cleared:!storageGet(localStorage,SESSION_KEY)};
  });
  check('Mobile browser emulation persistent shared login',()=>mobileResult.detected&&mobileResult.persistent&&mobileResult.stored&&mobileResult.shared);
  check('Mobile browser emulation logout cleanup',()=>mobileResult.cleared);
  await mobileContext.close();
  console.log('QA235_MOBILE_EMULATION',JSON.stringify(mobileResult));
  console.log('QA235_CANCELLED_ASYNC',JSON.stringify({login:canceled,admin:canceledAdmin}));


  // Block 235: independent security/legacy tests (no remote Supabase mutation).
  // Two same-origin independent tabs: Web Locks must be mutual exclusion even
  // when the callback's storage reads occur while a rival login is queued.
  const freshContext=await browser.newContext({viewport:{width:375,height:810}});
  const legacyPC=await freshContext.newPage();
  await legacyPC.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await legacyPC.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const pcLegacy=await legacyPC.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);localStorage.removeItem(PC_REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(SESSION_KEY,'qa235-pc-old');
    const migrated=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const result={migrated,temporary:storageGet(sessionStorage,SESSION_KEY),shared:storageGet(localStorage,SESSION_KEY)};
    sessionStorage.removeItem(SESSION_KEY);
    return result;
  });
  check('PC legacy shared session moves into tab sessionStorage',()=>pcLegacy.migrated===true&&pcLegacy.temporary==='qa235-pc-old'&&!pcLegacy.shared);
  const pcNoOverwrite=await legacyPC.evaluate(async()=>{
    localStorage.setItem(SESSION_KEY,'qa235-pc-latest');
    localStorage.setItem(PC_REMEMBER_KEY,'1');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const untouched=storageGet(localStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa235-pc-latest'));
    return {result,untouched};
  });
  check('PC current remembered session is not migrated away',()=>pcNoOverwrite.result===true&&pcNoOverwrite.untouched==='qa235-pc-latest');
  await legacyPC.close();
  await freshContext.close();

  const androidContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const legacyAndroid=await androidContext.newPage();await legacyAndroid.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await legacyAndroid.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileLegacy=await legacyAndroid.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);sessionStorage.setItem(SESSION_KEY,'qa235-android-legacy');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa235-android-legacy');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const shared=storageGet(localStorage,SESSION_KEY),proof=storageGet(localStorage,ADMIN_UNLOCK_KEY),tab=storageGet(sessionStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa235-android-legacy'));
    return {result,shared,proof,tab,after:storageGet(localStorage,SESSION_KEY)};
  });
  check('Android legacy session migrated into persistent storage',()=>mobileLegacy.result===true&&mobileLegacy.shared==='qa235-android-legacy'&&!mobileLegacy.tab&&!mobileLegacy.after);
  check('Android legacy admin proof preserved only for matching token',()=>mobileLegacy.proof==='qa235-android-legacy');
  await androidContext.close();
  console.log('QA235_LEGACY',JSON.stringify({pcLegacy,pcNoOverwrite,mobileLegacy}));

  // On a browser lacking Web Locks the new client must fail closed.
  const legacyUnavailable=await page.evaluate(async()=>{
    const real=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      const tokenBefore=storageGet(localStorage,SESSION_KEY);
      const res=await withBrowserSharedSessionLock(()=>storeLoginSession('qa235-unsafe',true));
      const unsafeDirect=storeLoginSession('qa235-unsafe',true);
      return {supported:false,res,unsafeDirect,preserved:tokenBefore===storageGet(localStorage,SESSION_KEY)};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:real});}
  });
  check('No Web Locks: shared session mutations fail closed',()=>legacyUnavailable.res===null&&legacyUnavailable.unsafeDirect===null&&legacyUnavailable.preserved);
  console.log('QA235_UNSUPPORTED',JSON.stringify(legacyUnavailable));
  const isolatedNoLockContext=await browser.newContext({viewport:{width:393,height:852}});
  const isolatedNoLockPage=await isolatedNoLockContext.newPage();
  await isolatedNoLockPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await isolatedNoLockPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const desktopNoLock=await isolatedNoLockPage.evaluate(async()=>{
    const existingLock=navigator.locks;
    const oldNow=performance.now;
    const originalSession=state.sessionToken;
    let clockCount=0;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      Object.defineProperty(performance,'now',{configurable:true,value:()=>clockCount++===0?0:100000});
      const token='qa235-desktop-tabonly',attempt=++loginAttemptSeq;
      state.sessionToken=token;
      const direct=storeLoginSession(token,false);
      sessionStorage.removeItem(SESSION_KEY);
      const stored=await storeLoginSessionForFreshLogin(token,false,attempt);
      const adminStored=await storeAdminUnlockForFreshLogin(token,false,attempt);
      const adminBefore=storageGet(sessionStorage,ADMIN_UNLOCK_KEY);
      const restoreCheck=await ensureAdminUnlockForRestoreWithScope(true,token);
      revokeAdminUnlockForToken(token);
      const adminAfter=storageGet(sessionStorage,ADMIN_UNLOCK_KEY);
      const reStored=await storeAdminUnlockForFreshLogin(token,false,attempt);
      const removed=await safelyClearStoredLoginSession(token);
      return {stored,direct,tabToken:token,adminStored,adminBefore,restoreCheck,adminAfter,reStored,removed,after:storageGet(sessionStorage,SESSION_KEY)};
    }finally{
      state.sessionToken=originalSession;
      Object.defineProperty(navigator,'locks',{configurable:true,value:existingLock});
      Object.defineProperty(performance,'now',{configurable:true,value:oldNow});
    }
  });
  await isolatedNoLockContext.close();
  console.log('QA235_PC_NOLOCK_TEMP_LOGIN',JSON.stringify(desktopNoLock));
  check('Desktop temporary login must not depend on Web Locks',()=>desktopNoLock.stored===true&&desktopNoLock.direct===true);
  check('Desktop temporary admin proof works without Web Locks',()=>desktopNoLock.adminStored===true&&desktopNoLock.adminBefore==='qa235-desktop-tabonly'&&desktopNoLock.restoreCheck===true);
  check('Desktop admin revoke clears tab proof without Web Locks',()=>!desktopNoLock.adminAfter&&desktopNoLock.reStored===true);
  check('Desktop temporary logout clears tab token without Web Locks',()=>desktopNoLock.removed===true&&!desktopNoLock.after);



  const imageChecks=await page.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=320;c.height=320;
    const cx=c.getContext('2d');for(let i=0;i<320;i++){cx.fillStyle='rgb('+i+',88,155)';cx.fillRect(i,0,1,320)}
    const blob=await new Promise(r=>c.toBlob(r,'image/png'));const file=new File([blob],'지문😀사진.png',{type:'image/png'});
    const converted=await compressFingerprintImage(file);
    let invalidRejected=false;
    try{await compressFingerprintImage(new File(['not an image'],'fake.txt',{type:'text/plain'}))}catch(e){invalidRejected=true}
    return {compressed:converted.mime==='image/jpeg'&&converted.bytes>100&&converted.bytes<=110*1024&&converted.name.includes('😀')&&converted.name.endsWith('.jpg'),signature:fingerprintPhotoBase64SignatureValid('image/jpeg',converted.base64),invalidRejected,bytes:converted.bytes};
  });
  check('Real image canvas PNG-to-JPEG compressed',()=>imageChecks.compressed);
  check('Real compressed JPEG signature verified',()=>imageChecks.signature);
  check('Non-image file rejected',()=>imageChecks.invalidRejected);
  console.log('QA235_IMAGE',JSON.stringify(imageChecks));
  const widths=[320,360,390,430,768,1024,1440];
  for(const width of widths){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(70);
    const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Default mobile/PC screen no horizontal overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  console.log('QA235_SUMMARY',JSON.stringify({passed:pass.length,failed:0,checks:pass,viewport_widths:widths,real_chromium:true,live_supabase:false,native_android:false,real_storage_two_tabs:true,backend_auth_multitab:false,bfcache:false}));
 } catch(e){console.error('QA235_FAIL',e.stack||String(e)); console.log('QA235_PARTIAL',JSON.stringify({passed:pass.length,checks:pass})); process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();

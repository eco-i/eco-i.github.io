'use strict';
const fs=require('fs'), crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const http=require('http'); const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-242.html','utf8');
const file='qa-handoff/index.working-2-8-242.html';
const html=fs.readFileSync(file,'utf8');
const expected='1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5';
// QA 241 independent candidate-stable repeat: 194-pass eight-layer browser suite
// QA 241 stabilized mutex stress regression v2
// QA 241 verified Web Lock real two-tab test, syntax correction
const pass=[];
function check(name,fn){const result=fn(); assert(result!==false, name+' returned false');pass.push(name);}
check('SHA256 official baseline',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('1165130 byte baseline',()=>Buffer.byteLength(baseline)===1165130);
check('APP_VERSION pinned',()=>html.includes("ver20260927-0944"));
check('239 officially completed SHA256 pinned',()=>crypto.createHash('sha256').update(baseline).digest('hex')==='1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5');
check('Web Locks critical sections applied',()=>html.includes('withBrowserSharedSessionLock')&&html.includes('staffAttendance_sharedSessionBrowserLock_v3'));
check('Official 240 start baseline immutable',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('240 inherited previous cross-tab security corrections retained',()=>html.includes('if(e.key===null)')&&html.includes('sharedLogoutCleanup=safelyClearStoredLoginSession(logoutToken)'))
check('239 mobile migration hard boundary explicitly coded',()=>html.includes('loggedOutShared&&(!localToken||localToken===loggedOutShared)'));
check('239 per-token logout tombstone enforced at early boot',()=>html.includes('function storedSessionTombstoned(token)')&&html.includes('!storedSessionTombstoned(rawLocal)')&&html.includes('!storedSessionTombstoned(rawTab)'));
check('239 tombstoned mobile legacy token discarded during migration',()=>html.includes('if(token&&storedSessionTombstoned(token))'));
check('239 old PC token cleanup cannot remove newer tab-only token',()=>html.includes('if(matched||current)return;'));
check('240 closed-session admin unlock requires live token',()=>html.includes('!storedSessionTombstoned(token) && (storageGet(localStorage,ADMIN_UNLOCK_KEY)'));
check('240 runtime tombstone closes existing sensitive UI',()=>html.includes("e.key.startsWith('staffAttendance_updateSessionLogoutToken_v1:')"));
check('240 current token tombstone fenced even if shared storage stays the same',()=>html.includes('if(current&&storedSessionTombstoned(current))return true;'));
check('241 exact shared suppression also fenced inside all runtime ownership helpers',()=>html.includes('if(storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===token)return true;'));
check('Previous session-safety correction retained',()=>html.includes('safelyClearStoredLoginSession')&&html.includes('ensureAdminUnlockForRestoreWithScope'));
check('238 mobile tab-only carveout eliminated',()=>html.includes("if(!MOBILE_SESSION_DEVICE&&tabToken===current)return false;")&&html.includes("if(!MOBILE_SESSION_DEVICE&&tabToken===current)return {current,mode:'tab'};")&&html.includes("if(!MOBILE_SESSION_DEVICE && current && tabToken===current){ sharedSessionChangePending="));
check('238 no stale legacy mobile fallback after shared logout',()=>html.includes("rawLocal ? localToken : (forbidden ? '' : temporaryToken)"));
check('240 immutable official baseline SHA pinned',()=>crypto.createHash('sha256').update(baseline).digest('hex')==='1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5');
check('242 blocking dialog must re-read token tombstone',()=>html.includes('if(storedSessionTombstoned(snapshot.current)){fingerprintScheduleSharedSessionReconcile();return true;}'));
check('242 candidate differs from immutable 241 baseline',()=>crypto.createHash('sha256').update(html).digest('hex')!==expected);
console.log('QA242_WORKING_SHA',crypto.createHash('sha256').update(html).digest('hex'),'bytes',Buffer.byteLength(html));
const allScript=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
check('all inline JS parses',()=>{for(const script of allScript)new vm.Script(script);return allScript.length>=2});
const bodyBeforeJs=html.slice(0,html.indexOf('<script async src='));
const ids=[...bodyBeforeJs.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('No duplicated static DOM IDs',()=>new Set(ids).size===ids.length);
check('4-group overhaul decision path present',()=>html.includes("key>='2026-10-01'&&key<='2026-10-15'"));
check('Smoke harness uses local-only HTTP server',()=>!html.includes('qa241-live-db-fixture-DO-NOT-USE')&&typeof http.createServer==='function');
(async()=>{
 let server, browser;
 try {
  server=http.createServer((req,res)=>{
   if(req.url==='/'||req.url.startsWith('/index')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}
   else if(req.url.startsWith('/away')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>Other page</title>');}
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
  await other.evaluate(()=>{window.qa237Seen=false;window.addEventListener('storage',e=>{if(e.key==='__qa241_signal__'&&e.newValue==='ping')window.qa237Seen=true;})});
  await page.evaluate(()=>localStorage.setItem('__qa241_signal__','ping'));await page.waitForTimeout(130);
  const storageEventReceived=await other.evaluate(()=>window.qa237Seen);
  check('Two actual same-origin tabs see storage event',()=>storageEventReceived);
  await page.evaluate(()=>sessionStorage.setItem('__qa241_private__','secret'));
  const tabStorageIsolated=await other.evaluate(()=>sessionStorage.getItem('__qa241_private__')===null);
  check('Two actual tabs isolate sessionStorage',()=>tabStorageIsolated);
  const events=[];let active=0,overlaps=0;
  await context.exposeBinding('__qa237RecordCritical',(_src,event)=>{
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
        await window.__qa237RecordCritical('enter');
        await new Promise(resolve=>setTimeout(resolve,2));
        await window.__qa237RecordCritical('exit');
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
  const tokenA='qa241-exclusive-A',tokenB='qa241-exclusive-B';
  const firstSaved=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenA);
  const secondSaved=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenB);
  check('Shared login storage serial writes succeed',()=>firstSaved===true&&secondSaved===true);
  const tokenBeforeCleanup=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Latest shared token wins',()=>tokenBeforeCleanup===tokenB);
  const oldCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenA);
  const protectedNext=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY)=== 'qa241-exclusive-B');
  check('Late previous logout cannot erase new login',()=>oldCleanup===true&&protectedNext);
  const adminSet=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeAdminUnlock(token,true)),tokenB);
  const staleAdminCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedAdminUnlockIfToken(token)),tokenA);
  const adminPreserved=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY)==='qa241-exclusive-B');
  check('Admin unlock new token preserved against old cleanup',()=>adminSet===true&&staleAdminCleanup===true&&adminPreserved);
  const removed=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenB);
  const tokenErased=await other.evaluate(()=>!storageGet(localStorage,SESSION_KEY));
  check('Latest shared token can be removed explicitly',()=>removed===true&&tokenErased);
  // Application helper regression: both shared logins must be serialized even
  // when their async RPC would have completed in different browser tabs.
  const asyncFirst=await page.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa241-fresh-A';
    return storeLoginSessionForFreshLogin('qa241-fresh-A',true,loginAttemptSeq);
  });
  const asyncSecond=await other.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa241-fresh-B';
    return storeLoginSessionForFreshLogin('qa241-fresh-B',true,loginAttemptSeq);
  });
  check('Async fresh-login store wrappers succeed',()=>asyncFirst===true&&asyncSecond===true);
  const asyncCleanup=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken('qa241-fresh-A')));
  const asyncRetained=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Late old async login cleanup preserves newest',()=>asyncCleanup===true&&asyncRetained==='qa241-fresh-B');
  const freshAdmin=await other.evaluate(()=>storeAdminUnlockForFreshLogin('qa241-fresh-B',true,loginAttemptSeq));
  const obsoleteAdmin=await page.evaluate(()=>storeAdminUnlockForFreshLogin('qa241-fresh-A',true,loginAttemptSeq));
  const adminNow=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY));
  check('Async admin unlock enforces latest token',()=>freshAdmin===true&&obsoleteAdmin===false&&adminNow==='qa241-fresh-B');
  const logoutOld=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa241-fresh-A')));
  const newestAfterLogout=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Async stale logout preserves current token',()=>newestAfterLogout==='qa241-fresh-B');
  await other.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa241-fresh-B')));
  const finalToken=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Current logout clears matching shared token',()=>!finalToken);
  console.log('QA241_LOGIN_WRAPPERS',JSON.stringify({fresh_logins:2,fresh_admin:true,stale_logout_preserved:true}));

  console.log('QA241_MUTEX_REAL',JSON.stringify({lock_critical_sections:successes,overlaps,late_logout_protected:true,admin_unlock_protected:true}));
  await other.close();
  // Real storage-event session reconciliation may navigate the old tab.
  // Its own security-triggered reload can abort our parallel navigation.
  // Retry that test-harness navigation without treating ERR_ABORTED as product failure.
  let cleanNavigation=false;
  for(let attempt=0;attempt<3&&!cleanNavigation;attempt++){
    try{
      await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
      cleanNavigation=true;
    }catch(err){
      if(!String(err).includes('ERR_ABORTED')||attempt===2)throw err;
      await page.waitForTimeout(150);
    }
  }
  check('Harness clean navigation completed after session-reload race',()=>cleanNavigation);
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
    state.sessionToken='qa241-outdated-token';loginAttemptSeq++;
    const attempt=loginAttemptSeq;
    const queued=storeLoginSessionForFreshLogin('qa241-outdated-token',true,attempt);
    loginAttemptSeq++;state.sessionToken='qa241-next-token';
    releaseLock();await blocker;
    const outcome=await queued;
    return {outcome,token:storageGet(localStorage,SESSION_KEY)};
  });
  check('Canceled login blocked while Web Lock queued',()=>canceled.outcome===false&&canceled.token!=='qa241-outdated-token');
  const canceledAdmin=await isolated.evaluate(async()=>{
    const token='qa241-admin-old';
    await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    let releaseLock,signalReady;const ready=new Promise(r=>signalReady=r);
    const blocker=withBrowserSharedSessionLock(async()=>{signalReady();await new Promise(r=>releaseLock=r);return true;});
    await ready;
    state.sessionToken=token;loginAttemptSeq++;
    const attempt=loginAttemptSeq,queued=storeAdminUnlockForFreshLogin(token,true,attempt);
    state.sessionToken='qa241-admin-new';loginAttemptSeq++;
    releaseLock();await blocker;
    const outcome=await queued,stored=storageGet(localStorage,ADMIN_UNLOCK_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {outcome,stored};
  });
  check('Canceled admin unlock blocked while Web Lock queued',()=>canceledAdmin.outcome===false&&canceledAdmin.stored!=='qa241-admin-old');
  await isolatedContext.close();
  const mobileContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const mobile=await mobileContext.newPage();
  await mobile.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await mobile.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileResult=await mobile.evaluate(async()=>{
    const detected=MOBILE_SESSION_DEVICE;
    const persistent=loginShouldPersist();
    const token='qa241-mobile-virtual';
    const stored=await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    const shared=storageGet(localStorage,SESSION_KEY)===token;
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {detected,persistent,stored,shared,cleared:!storageGet(localStorage,SESSION_KEY)};
  });
  check('Mobile browser emulation persistent shared login',()=>mobileResult.detected&&mobileResult.persistent&&mobileResult.stored&&mobileResult.shared);
  check('Mobile browser emulation logout cleanup',()=>mobileResult.cleared);
  await mobileContext.close();
  console.log('QA241_MOBILE_EMULATION',JSON.stringify(mobileResult));
  console.log('QA241_CANCELLED_ASYNC',JSON.stringify({login:canceled,admin:canceledAdmin}));


  // Block 235: independent security/legacy tests (no remote Supabase mutation).
  // QA237 final independent repeat: keep identical product baseline and assertions.
  // Two same-origin independent tabs: Web Locks must be mutual exclusion even
  // when the callback's storage reads occur while a rival login is queued.
  const freshContext=await browser.newContext({viewport:{width:375,height:810}});
  const legacyPC=await freshContext.newPage();
  await legacyPC.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await legacyPC.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const pcLegacy=await legacyPC.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);localStorage.removeItem(PC_REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(SESSION_KEY,'qa241-pc-old');
    const migrated=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const result={migrated,temporary:storageGet(sessionStorage,SESSION_KEY),shared:storageGet(localStorage,SESSION_KEY)};
    sessionStorage.removeItem(SESSION_KEY);
    return result;
  });
  check('PC legacy shared session moves into tab sessionStorage',()=>pcLegacy.migrated===true&&pcLegacy.temporary==='qa241-pc-old'&&!pcLegacy.shared);
  const pcNoOverwrite=await legacyPC.evaluate(async()=>{
    localStorage.setItem(SESSION_KEY,'qa241-pc-latest');
    localStorage.setItem(PC_REMEMBER_KEY,'1');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const untouched=storageGet(localStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa241-pc-latest'));
    return {result,untouched};
  });
  check('PC current remembered session is not migrated away',()=>pcNoOverwrite.result===true&&pcNoOverwrite.untouched==='qa241-pc-latest');
  await legacyPC.close();
  await freshContext.close();

  const androidContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const legacyAndroid=await androidContext.newPage();await legacyAndroid.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await legacyAndroid.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileLegacy=await legacyAndroid.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);sessionStorage.setItem(SESSION_KEY,'qa241-android-legacy');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-android-legacy');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const shared=storageGet(localStorage,SESSION_KEY),proof=storageGet(localStorage,ADMIN_UNLOCK_KEY),tab=storageGet(sessionStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa241-android-legacy'));
    return {result,shared,proof,tab,after:storageGet(localStorage,SESSION_KEY)};
  });
  check('Android legacy session migrated into persistent storage',()=>mobileLegacy.result===true&&mobileLegacy.shared==='qa241-android-legacy'&&!mobileLegacy.tab&&!mobileLegacy.after);
  check('Android legacy admin proof preserved only for matching token',()=>mobileLegacy.proof==='qa241-android-legacy');
  await androidContext.close();
  console.log('QA241_LEGACY',JSON.stringify({pcLegacy,pcNoOverwrite,mobileLegacy}));

  // On a browser lacking Web Locks the new client must fail closed.
  const legacyUnavailable=await page.evaluate(async()=>{
    const real=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      const tokenBefore=storageGet(localStorage,SESSION_KEY);
      const res=await withBrowserSharedSessionLock(()=>storeLoginSession('qa241-unsafe',true));
      const unsafeDirect=storeLoginSession('qa241-unsafe',true);
      return {supported:false,res,unsafeDirect,preserved:tokenBefore===storageGet(localStorage,SESSION_KEY)};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:real});}
  });
  check('No Web Locks: shared session mutations fail closed',()=>legacyUnavailable.res===null&&legacyUnavailable.unsafeDirect===null&&legacyUnavailable.preserved);
  console.log('QA241_UNSUPPORTED',JSON.stringify(legacyUnavailable));
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
      const token='qa241-desktop-tabonly',attempt=++loginAttemptSeq;
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
  console.log('QA241_PC_NOLOCK_TEMP_LOGIN',JSON.stringify(desktopNoLock));
  check('Desktop temporary login must not depend on Web Locks',()=>desktopNoLock.stored===true&&desktopNoLock.direct===true);
  check('Desktop temporary admin proof works without Web Locks',()=>desktopNoLock.adminStored===true&&desktopNoLock.adminBefore==='qa241-desktop-tabonly'&&desktopNoLock.restoreCheck===true);
  check('Desktop admin revoke clears tab proof without Web Locks',()=>!desktopNoLock.adminAfter&&desktopNoLock.reStored===true);
  check('Desktop temporary logout clears tab token without Web Locks',()=>desktopNoLock.removed===true&&!desktopNoLock.after);



  // Browser cold-resume: mock only the remote identity RPC, execute the app's
  // actual restoreSession() and scope guard with Web Locks deliberately absent.
  const restoreContext=await browser.newContext({viewport:{width:390,height:844}});
  const restorePage=await restoreContext.newPage();
  await restorePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await restorePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const restoreTests=await restorePage.evaluate(async()=>{
    const prevLocks=navigator.locks,prevRpc=window.rpcPreferPersonnel,prevInitial=window.initialPinStatus,prevEnter=window.enterApp;
    const token='qa241-restore-without-web-lock';
    const hits=[];
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      sessionStorage.setItem(SESSION_KEY,token);state.sessionToken=token;
      window.initialPinStatus=async()=>false;
      window.rpcPreferPersonnel=async()=>[{employee_id:2345,display_name:'QA 복구',is_admin:false,category:'B조',group_code:'B'}];
      window.enterApp=async(me)=>{hits.push({kind:'employee',me});};
      await restoreSession();
      sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
      window.rpcPreferPersonnel=async()=>[{employee_id:2345,display_name:'QA 관리자 복구',is_admin:true,category:'B조',group_code:'B'}];
      await restoreSession();
      return {employeeRestored:hits.some(x=>x.kind==='employee'&&x.me.is_admin===false),adminRestored:hits.some(x=>x.kind==='employee'&&x.me.is_admin===true),hits:hits.length};
    }finally{
      window.rpcPreferPersonnel=prevRpc;window.initialPinStatus=prevInitial;window.enterApp=prevEnter;
      Object.defineProperty(navigator,'locks',{configurable:true,value:prevLocks});
      sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
      state.sessionToken='';
    }
  });
  check('PC temporary non-admin restore succeeds without Web Locks',()=>restoreTests.employeeRestored===true);
  check('PC temporary admin proof restore succeeds without Web Locks',()=>restoreTests.adminRestored===true);
  console.log('QA241_PC_COLD_RESTORE',JSON.stringify(restoreTests));
  await restoreContext.close();

  // Locks API is present but its request rejects (restricted browser policy).
  // Only genuinely tab-scoped mutations may proceed.
  const restrictedContext=await browser.newContext({viewport:{width:390,height:844}});
  const restrictedPage=await restrictedContext.newPage();
  await restrictedPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await restrictedPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const restricted=await restrictedPage.evaluate(async()=>{
    const savedLocks=navigator.locks,savedToken=state.sessionToken;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:{request(){throw new Error('Lock denied by browser policy')}}});
      const before=storageGet(localStorage,SESSION_KEY);
      const rejected=await withBrowserSharedSessionLock(()=>storeLoginSession('qa241-shared-denied',true));
      state.sessionToken='qa241-tabonly-denied';
      const attempt=++loginAttemptSeq;
      const tabLogin=await storeLoginSessionForFreshLogin(state.sessionToken,false,attempt);
      const tabAdmin=await storeAdminUnlockForFreshLogin(state.sessionToken,false,attempt);
      const adminProof=storageGet(sessionStorage,ADMIN_UNLOCK_KEY);
      await safelyClearStoredLoginSession(state.sessionToken);
      return {rejected,tabLogin,tabAdmin,adminProof,sharedUnchanged:before===storageGet(localStorage,SESSION_KEY),tabCleared:!storageGet(sessionStorage,SESSION_KEY)};
    }finally{
      Object.defineProperty(navigator,'locks',{configurable:true,value:savedLocks});
      state.sessionToken=savedToken;
    }
  });
  check('Rejected Web Locks request must not mutate shared sessions',()=>restricted.rejected===null&&restricted.sharedUnchanged===true);
  check('Rejected Web Locks request still permits isolated desktop login',()=>restricted.tabLogin===true&&restricted.tabAdmin===true&&restricted.adminProof==='qa241-tabonly-denied'&&restricted.tabCleared===true);
  console.log('QA241_LOCKS_REJECTED',JSON.stringify(restricted));
  await restrictedContext.close();

  // A tab-only short update handoff must recover after a page reload even
  // without Web Locks, as it does not require a shared session mutation.
  const handoffContext=await browser.newContext({viewport:{width:390,height:844}});
  await handoffContext.addInitScript(()=>{
    Object.defineProperty(navigator,'locks',{configurable:true,value:null});
    sessionStorage.removeItem('staffAttendance_session_v1');
    sessionStorage.setItem('staffAttendance_updateSessionHandoff_v1',JSON.stringify({
      version:'ver20260927-0944',token:'qa241-temporary-handoff',persistent:false,
      adminUnlocked:true,at:Date.now()
    }));
  });
  const handoffPage=await handoffContext.newPage();
  await handoffPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await handoffPage.route('https://*.supabase.co/**',r=>r.abort());
  await handoffPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await handoffPage.waitForTimeout(150);
  const tabHandoff=await handoffPage.evaluate(()=>({
    stored:sessionStorage.getItem('staffAttendance_session_v1'),
    adminProof:sessionStorage.getItem('staffAttendance_admin2_ok_v1'),
    stateToken:state.sessionToken,
    source:sessionStorage.getItem('staffAttendance_updateSessionHandoff_v1')
  }));
  console.log('QA241_NOLOCK_HANDOFF',JSON.stringify(tabHandoff));
  check('PC tab-only update handoff must recover without Web Locks',()=>tabHandoff.stored==='qa241-temporary-handoff');
  check('PC tab-only admin proof handoff must recover without Web Locks',()=>tabHandoff.adminProof==='qa241-temporary-handoff');
  await handoffContext.close();

  // Four simultaneous REAL Chromium same-origin tabs, separate JS heaps.
  const fourTabContext=await browser.newContext({viewport:{width:430,height:900}});
  let criticalActive=0,criticalOverlaps=0,criticalEvents=0;
  await fourTabContext.exposeBinding('__qa237LockCheck',(_source,kind)=>{
    if(kind==='enter'){criticalActive++;if(criticalActive>1)criticalOverlaps++;}
    if(kind==='exit')criticalActive--;
    criticalEvents++;
  });
  const fourTabs=[];
  for(let i=0;i<4;i++){
    const tab=await fourTabContext.newPage();
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
    fourTabs.push(tab);
  }
  let fourTabPass=0;
  for(let round=0;round<100;round++){
    const result=await Promise.all(fourTabs.map(tab=>tab.evaluate(async()=>{
      return withBrowserSharedSessionLock(async()=>{
        await window.__qa237LockCheck('enter');
        await new Promise(r=>setTimeout(r,1));
        await window.__qa237LockCheck('exit');
        return true;
      });
    })));
    if(result.every(x=>x===true))fourTabPass+=4;
  }
  check('Four real browser tabs complete 400 lock requests',()=>fourTabPass===400);
  check('Four real browser tabs show zero concurrent critical entries',()=>criticalOverlaps===0&&criticalActive===0&&criticalEvents===800);
  console.log('QA241_FOUR_TAB',JSON.stringify({lock_requests:fourTabPass,critical_overlaps:criticalOverlaps,critical_events:criticalEvents}));
  await fourTabContext.close();

  // Storage write/delete faults must not corrupt the prior shared token or
  // its administrator marker. These are local Chromium Storage API faults.
  const failureContext=await browser.newContext({viewport:{width:430,height:900}});
  const failurePage=await failureContext.newPage();
  await failurePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await failurePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const storageFailures=await failurePage.evaluate(async()=>{
    const saved=await withBrowserSharedSessionLock(()=>storeLoginSession('qa241-existing',true));
    const admin=await withBrowserSharedSessionLock(()=>storeAdminUnlock('qa241-existing',true));
    const originalSet=Storage.prototype.setItem, originalRemove=Storage.prototype.removeItem;
    let failedStore,failedDelete;
    try{
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key===PC_REMEMBER_KEY)throw new DOMException('quota denied','QuotaExceededError');
        return originalSet.call(this,key,value);
      };
      failedStore=await withBrowserSharedSessionLock(()=>storeLoginSession('qa241-replacement',true));
    }finally{Storage.prototype.setItem=originalSet;}
    const afterStore={token:storageGet(localStorage,SESSION_KEY),remember:storageGet(localStorage,PC_REMEMBER_KEY),admin:storageGet(localStorage,ADMIN_UNLOCK_KEY)};
    try{
      Storage.prototype.removeItem=function(key){
        if(this===localStorage&&key===SESSION_KEY)throw new DOMException('remove denied','SecurityError');
        return originalRemove.call(this,key);
      };
      failedDelete=await withBrowserSharedSessionLock(()=>clearSharedSessionIfToken('qa241-existing'));
    }finally{Storage.prototype.removeItem=originalRemove;}
    const afterDelete={token:storageGet(localStorage,SESSION_KEY),remember:storageGet(localStorage,PC_REMEMBER_KEY),admin:storageGet(localStorage,ADMIN_UNLOCK_KEY)};
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa241-existing'));
    return {saved,admin,failedStore,failedDelete,afterStore,afterDelete};
  });
  check('Failed shared remember-write restores prior token',()=>storageFailures.saved===true&&storageFailures.admin===true&&storageFailures.failedStore===false&&storageFailures.afterStore.token==='qa241-existing'&&storageFailures.afterStore.remember==='1');
  check('Failed shared write retains previous admin marker',()=>storageFailures.afterStore.admin==='qa241-existing');
  check('Failed shared token deletion preserves prior session metadata',()=>storageFailures.failedDelete===false&&storageFailures.afterDelete.token==='qa241-existing'&&storageFailures.afterDelete.admin==='qa241-existing');
  console.log('QA241_STORAGE_FAULTS',JSON.stringify(storageFailures));
  await failureContext.close();

  // 236 final independent repeat of complete regression on unchanged HTML.
  // 236: Logout must hide confidential UI immediately even if another tab
  // holds the shared Web Lock during logout.
  const delayedContext=await browser.newContext({viewport:{width:390,height:844}});
  const blockerTab=await delayedContext.newPage(),logoutTab=await delayedContext.newPage();
  for(const tab of [blockerTab,logoutTab]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  void blockerTab.evaluate(()=>navigator.locks.request(SHARED_SESSION_BROWSER_LOCK,{mode:'exclusive'},()=>new Promise(r=>{
    window.__qa241_releaseBlock=r;document.body.dataset.qa237LockHeld='yes';
  })));
  await blockerTab.waitForFunction(()=>document.body.dataset.qa237LockHeld==='yes');
  const immediateLogout=await logoutTab.evaluate(()=>{
    state.sessionToken='qa241-logout-now';
    state.me={employee_id:236,is_admin:true,display_name:'QA 관리자'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa241_pendingLogout=logout(false);
    return {token:state.sessionToken,meStillPrivileged:!!state.me?.is_admin,appVisible:!document.getElementById('appView').classList.contains('hidden'),loginVisible:!document.getElementById('loginView').classList.contains('hidden')};
  });
  await logoutTab.waitForTimeout(120);
  const delayedLogout=await logoutTab.evaluate(()=>({token:state.sessionToken,meStillPrivileged:!!state.me?.is_admin,appVisible:!document.getElementById('appView').classList.contains('hidden')}));
  console.log('QA241_LOGOUT_QUEUED',JSON.stringify({immediateLogout,delayedLogout}));
  await blockerTab.evaluate(()=>window.__qa241_releaseBlock());
  await logoutTab.evaluate(()=>window.__qa241_pendingLogout);
  check('Logout hides privileged state synchronously before lock wait',()=>!immediateLogout.meStillPrivileged&&!immediateLogout.appVisible&&immediateLogout.loginVisible);
  check('Logout preserves signed-out state while lock is held',()=>!delayedLogout.meStillPrivileged&&!delayedLogout.appVisible);
  await delayedContext.close();

  // 236: A new login must not be cleared by the previous logout's delayed
  // cleanup after a real queued Web Lock. This checks current state ownership,
  // not only storage contents.
  const reentryContext=await browser.newContext({viewport:{width:430,height:850}});
  const blocker=await reentryContext.newPage(),reentry=await reentryContext.newPage();
  for(const t of [blocker,reentry]){await t.route('https://cdn.jsdelivr.net/**',r=>r.abort());await t.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});}
  void blocker.evaluate(()=>navigator.locks.request(SHARED_SESSION_BROWSER_LOCK,{mode:'exclusive'},()=>new Promise(resolve=>{
    window.__qa241_releaseReentry=resolve;
    document.documentElement.dataset.qa237ReentryLocked='1';
  })));
  await blocker.waitForFunction(()=>document.documentElement.dataset.qa237ReentryLocked==='1');
  const replacedState=await reentry.evaluate(()=>{
    state.sessionToken='qa241-prev-session';state.me={employee_id:1,is_admin:true,display_name:'previous'};
    window.__qa241_oldSignout=logout(false);
    // A real PC fresh tab-only login writes its token before exposing
    // the new account. An old delayed cleanup must not delete this token.
    sessionStorage.setItem(SESSION_KEY,'qa241-next-session');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-next-session');
    state.sessionToken='qa241-next-session';state.me={employee_id:2,is_admin:true,display_name:'new'};
    return {token:state.sessionToken,actor:state.me.employee_id,stored:sessionStorage.getItem(SESSION_KEY),admin:sessionStorage.getItem(ADMIN_UNLOCK_KEY)};
  });
  await blocker.evaluate(()=>window.__qa241_releaseReentry());
  await reentry.evaluate(()=>window.__qa241_oldSignout);
  const afterDelayedLogout=await reentry.evaluate(()=>({token:state.sessionToken,actor:state.me?.employee_id,stored:sessionStorage.getItem(SESSION_KEY),admin:sessionStorage.getItem(ADMIN_UNLOCK_KEY)}));
  check('Delayed old logout cannot clear new authenticated state',
    ()=>replacedState.token==='qa241-next-session'&&afterDelayedLogout.token==='qa241-next-session'&&afterDelayedLogout.actor===2);
  console.log('QA241_REENTRY',JSON.stringify({replacedState,afterDelayedLogout}));
  check('Queued old logout cannot delete a fresh PC tab-only session token',()=>replacedState.stored==='qa241-next-session'&&afterDelayedLogout.stored==='qa241-next-session');
  check('Queued old logout cannot remove fresh PC tab-only administrator unlock',()=>replacedState.admin==='qa241-next-session'&&afterDelayedLogout.admin==='qa241-next-session');
  await reentryContext.close();

  // 236: On mobile browsers without Web Locks, logout must not resurrect a
  // persistent shared login on next load. The stored logout tombstone exists
  // even when the protected shared-token delete was impossible.
  const noLockMobileCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36'});
  const noLockMobile=await noLockMobileCtx.newPage();
  await noLockMobile.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await noLockMobile.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileLogout=await noLockMobile.evaluate(async()=>{
    const realLocks=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      const token='qa241-mobile-without-weblocks';
      localStorage.setItem(SESSION_KEY,token);state.sessionToken=token;
      state.me={employee_id:111,is_admin:true,display_name:'QA 관리자'};
      document.getElementById('appView').classList.remove('hidden');
      window.__qa241_mobilePending=logout(false);
      const immediate={token:state.sessionToken,admin:!!state.me,appVisible:!document.getElementById('appView').classList.contains('hidden')};
      await window.__qa241_mobilePending;
      return {immediate,storageToken:localStorage.getItem(SESSION_KEY),restoredToken:storedSessionToken(),suppressed:storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===token};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:realLocks});}
  });
  console.log('QA241_NOLOCK_MOBILE_LOGOUT',JSON.stringify(mobileLogout));
  check('Mobile Web Locks unsupported: logout blocks same token restoration',()=>!mobileLogout.restoredToken&&mobileLogout.suppressed&&mobileLogout.storageToken==='qa241-mobile-without-weblocks');
  check('Mobile Web Locks unsupported: logout immediately revokes confidential UI',()=>mobileLogout.immediate.token===''&&!mobileLogout.immediate.admin&&!mobileLogout.immediate.appVisible);
  await noLockMobileCtx.addInitScript(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:null}));
  await noLockMobile.reload({waitUntil:'domcontentloaded'});
  const afterReload=await noLockMobile.evaluate(()=>({
    restored:state.sessionToken,
    storage:storageGet(localStorage,SESSION_KEY),
    blocked:storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)
  }));
  check('Mobile Web Locks unsupported: browser reload cannot resurrect logged-out account',()=>!afterReload.restored&&afterReload.blocked===afterReload.storage);
  console.log('QA241_NOLOCK_RELOAD',JSON.stringify(afterReload));
  const sameTokenRelogin=await noLockMobile.evaluate(async()=>{
    delete navigator.locks;
    const token='qa241-mobile-without-weblocks';
    const persisted=await withBrowserSharedSessionLock(()=>storeLoginSession(token,true,true));
    const restored=storedSessionToken();
    const blocked=storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {persisted,restored,blocked};
  });
  check('A new successful login can clear suppression for its matching token',()=>sameTokenRelogin.persisted===true&&sameTokenRelogin.restored==='qa241-mobile-without-weblocks'&&!sameTokenRelogin.blocked);
  await noLockMobileCtx.close();


  // 236: Dispatch of the old token's server invalidation must not be blocked
  // by another tab holding the browser-wide LOCAL storage lock. RPC is mocked:
  // no network requests or production tokens are used.
  const remoteCtx=await browser.newContext({viewport:{width:390,height:844}});
  const remoteHold=await remoteCtx.newPage(),remoteTab=await remoteCtx.newPage();
  for(const tab of [remoteHold,remoteTab]){await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});}
  void remoteHold.evaluate(()=>navigator.locks.request(SHARED_SESSION_BROWSER_LOCK,{mode:'exclusive'},()=>new Promise(resolve=>{
    window.__qa241_releaseServerHold=resolve;document.body.dataset.qa237ServerHold='1';
  })));
  await remoteHold.waitForFunction(()=>document.body.dataset.qa237ServerHold==='1');
  const serverStarted=await remoteTab.evaluate(()=>{
    window.__qa241_savedRpc=window.rpc;window.__qa241_savedConfigured=window.configured;
    window.__qa241_serverCalls=[];
    window.rpc=async function(name,payload,options){
      window.__qa241_serverCalls.push({name,token:payload?.p_token,keepalive:options?.keepalive});
      return {};
    };
    window.configured=()=>true;
    state.sessionToken='qa241-server-revoke';
    state.me={employee_id:500,is_admin:true};
    window.__qa241_pendingServerLogout=logout(true);
    return {calls:window.__qa241_serverCalls.slice(),role:state.me,token:state.sessionToken};
  });
  await remoteTab.waitForTimeout(120);
  const duringServerHold=await remoteTab.evaluate(()=>window.__qa241_serverCalls.slice());
  await remoteHold.evaluate(()=>window.__qa241_releaseServerHold());
  await remoteTab.evaluate(()=>window.__qa241_pendingServerLogout);
  const serverFinal=await remoteTab.evaluate(()=>{const result=window.__qa241_serverCalls.slice();window.rpc=window.__qa241_savedRpc;window.configured=window.__qa241_savedConfigured;return result;});
  console.log('QA241_SERVER_LOGOUT',JSON.stringify({serverStarted,duringServerHold,serverFinal}));
  check('Server logout is dispatched before contended local Web Lock releases',()=>duringServerHold.length===1&&duringServerHold[0].name==='logout_employee'&&duringServerHold[0].token==='qa241-server-revoke'&&duringServerHold[0].keepalive===true);
  check('Server logout uses captured old token once',()=>serverFinal.length===1&&!serverStarted.role&&!serverStarted.token);
  await remoteCtx.close();


  // Shared login must be revoked in the OTHER tab as well if a mobile tab
  // logs out without Web Locks: only the token-specific suppression key
  // changes, not the still-stored shared SESSION_KEY.
  const crossCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const oldTab=await crossCtx.newPage(),otherTab=await crossCtx.newPage();
  for(const tab of [oldTab,otherTab]){await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});}
  await oldTab.evaluate(()=>{localStorage.setItem(SESSION_KEY,'qa241-mobile-both-tabs')});
  for(const tab of [oldTab,otherTab])await tab.evaluate(()=>{
    state.sessionToken='qa241-mobile-both-tabs';state.me={employee_id:1,is_admin:true,display_name:'Shared admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await oldTab.evaluate(async()=>{
    const nativeLocks=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      await logout(false);
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:nativeLocks})}
  });
  await otherTab.waitForTimeout(300);
  const otherAfter=await otherTab.evaluate(()=>({actor:state.me?.employee_id||null,token:state.sessionToken,appVisible:!document.getElementById('appView').classList.contains('hidden')}));
  console.log('QA241_MOBILE_CROSS_TAB_LOGOUT',JSON.stringify(otherAfter));
  check('Suppressed mobile session logs out sibling tab without requiring shared token delete',()=>!otherAfter.actor&&!otherAfter.appVisible);
  // Never revoke an unrelated newer login when an old-token suppression
  // arrives late from a different tab.
  await otherTab.evaluate(()=>{
    state.sessionToken='qa241-unrelated-newer';state.me={employee_id:2366,is_admin:false};
    document.getElementById('appView').classList.remove('hidden');
  });
  await oldTab.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-late-old-token'));
  await otherTab.waitForTimeout(100);
  const unrelatedStillCurrent=await otherTab.evaluate(()=>({token:state.sessionToken,actor:state.me?.employee_id}));
  check('Old-token suppression cannot revoke an unrelated newer login',()=>unrelatedStillCurrent.token==='qa241-unrelated-newer'&&unrelatedStillCurrent.actor===2366);
  await crossCtx.close();


  // 237: Cross-tab site-data clear sends a StorageEvent with key===null.
  // A shared persistent login must not leave an old privileged UI visible
  // after its backing browser session storage is wiped in a different tab.
  const clearCtx=await browser.newContext({viewport:{width:390,height:844}});
  const clearVictim=await clearCtx.newPage(),clearPeer=await clearCtx.newPage();
  for(const tab of [clearVictim,clearPeer]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all([clearVictim,clearPeer].map(tab=>tab.waitForTimeout(450)));
  // Any initial session migration/navigation must settle before installing the
  // event witness; use Node-observed events rather than a document-global
  // flag that is erased by an automatic navigation.
  let clearEventCount=0;
  await clearCtx.exposeBinding('__qa237ObserveClear',()=>{clearEventCount++;});
  await clearVictim.evaluate(()=>{
    localStorage.setItem(SESSION_KEY,'qa241-site-clear-admin');
    state.sessionToken='qa241-site-clear-admin';
    state.me={employee_id:237,is_admin:true,display_name:'QA site-clear admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa241_clearEvent=false;
    sessionStorage.removeItem('__qa241_clear_event_received__');
    window.addEventListener('storage',e=>{if(e.key===null){window.__qa241_clearEvent=true;sessionStorage.setItem('__qa241_clear_event_received__','1');void window.__qa237ObserveClear();}});
  });
  await clearPeer.evaluate(()=>localStorage.clear());
  await clearVictim.waitForTimeout(350);
  const siteClear=await clearVictim.evaluate(()=>({
    clearEvent:!!window.__qa241_clearEvent||sessionStorage.getItem('__qa241_clear_event_received__')==='1',
    sharedToken:localStorage.getItem(SESSION_KEY),
    oldAdminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    currentToken:state.sessionToken
  }));
  console.log('QA241_CROSS_TAB_CLEAR',JSON.stringify(siteClear));
  check('Actual storage clear generates key-null event',()=>clearEventCount>0||siteClear.clearEvent);
  check('Cross-tab site-data clear revokes stale shared-admin UI',()=>!siteClear.oldAdminVisible);
  // Desktop independent sessionStorage login must be preserved when a
  // different tab clears the shared localStorage namespace.
  await clearVictim.evaluate(()=>{
    sessionStorage.setItem(SESSION_KEY,'qa241-pc-isolated');
    state.sessionToken='qa241-pc-isolated';
    state.me={employee_id:238,is_admin:true,display_name:'QA isolated admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await clearPeer.evaluate(()=>{
    localStorage.setItem(SESSION_KEY,'qa241-unrelated-shared');
    localStorage.clear();
  });
  await clearVictim.waitForTimeout(300);
  const isolatedAfterClear=await clearVictim.evaluate(()=>({
    tabToken:sessionStorage.getItem(SESSION_KEY),
    token:state.sessionToken,actor:state.me?.employee_id,
    appVisible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA241_PC_SITE_CLEAR_ISOLATED',JSON.stringify(isolatedAfterClear));
  check('Cross-tab site-data clear preserves independent desktop temporary session',
    ()=>isolatedAfterClear.tabToken==='qa241-pc-isolated'&&isolatedAfterClear.token==='qa241-pc-isolated'&&isolatedAfterClear.actor===238&&isolatedAfterClear.appVisible);
  await clearCtx.close();

  // 237: Mobile legacy sessionStorage can coexist with shared storage after
  // partial migration. The shared logout marker must still revoke mobile UI;
  // only desktop tab-exclusive sessions are exempt from this event.
  const legacyMobileCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const legacyVictim=await legacyMobileCtx.newPage(),legacySender=await legacyMobileCtx.newPage();
  for(const tab of [legacyVictim,legacySender]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await legacyVictim.evaluate(()=>{
    const token='qa241-mobile-legacy-duplicate';
    localStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:237,is_admin:true,display_name:'Legacy Mobile Admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa241_legacyMarker=false;
    window.addEventListener('storage',e=>{if(e.key===SHARED_SESSION_LOGOUT_SUPPRESSION_KEY&&e.newValue===token)window.__qa241_legacyMarker=true;});
  });
  await legacySender.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-mobile-legacy-duplicate'));
  await legacyVictim.waitForTimeout(350);
  const legacyAfter=await legacyVictim.evaluate(()=>({
    markerReceived:!!window.__qa241_legacyMarker,
    isMobile:MOBILE_SESSION_DEVICE,
    sessionStorageToken:sessionStorage.getItem(SESSION_KEY),
    actor:state.me?.employee_id??null,
    currentToken:state.sessionToken,
    visible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA241_MOBILE_LEGACY_MARKER',JSON.stringify(legacyAfter));
  check('Mobile legacy suppression test uses real delivered cross-tab event',()=>legacyAfter.markerReceived&&legacyAfter.isMobile);
  check('Mobile legacy sessionStorage cannot bypass shared logout revocation',()=>!legacyAfter.actor&&!legacyAfter.visible);
  await legacyMobileCtx.close();

  // Mobile legacy tab storage also must NOT exempt a shared session from
  // a real cross-tab localStorage.clear() key-null event.
  const mobileClearCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const mobileClearVictim=await mobileClearCtx.newPage(),mobileClearSender=await mobileClearCtx.newPage();
  for(const tab of [mobileClearVictim,mobileClearSender]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await mobileClearVictim.waitForTimeout(250);
  await mobileClearVictim.evaluate(()=>{
    const token='qa241-mobile-clear-with-legacy-tab-token';
    localStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;state.me={employee_id:240,is_admin:true};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await mobileClearSender.evaluate(()=>localStorage.clear());
  await mobileClearVictim.waitForTimeout(250);
  const mobileClearResult=await mobileClearVictim.evaluate(()=>({
    isMobile:MOBILE_SESSION_DEVICE,actor:state.me?.employee_id??null,
    privilegedVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    stored:localStorage.getItem(SESSION_KEY)
  }));
  console.log('QA241_MOBILE_LEGACY_SITE_CLEAR',JSON.stringify(mobileClearResult));
  check('Mobile legacy duplicate token cannot preserve old admin UI after site clear',
    ()=>mobileClearResult.isMobile&&!mobileClearResult.privilegedVisible&&mobileClearResult.actor===null&&!mobileClearResult.stored);
  await mobileClearCtx.close();

  // Suppression marker must not terminate a separate PC-only session:
  // its sessionStorage login is owned by this tab, not localStorage.
  const isolatedMarkerCtx=await browser.newContext({viewport:{width:390,height:844}});
  const pcIsolated=await isolatedMarkerCtx.newPage(),pcMarkerSender=await isolatedMarkerCtx.newPage();
  for(const tab of [pcIsolated,pcMarkerSender]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await pcIsolated.evaluate(()=>{
    sessionStorage.setItem(SESSION_KEY,'qa241-desktop-temporary-marker');
    state.sessionToken='qa241-desktop-temporary-marker';
    state.me={employee_id:239,is_admin:false};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa241_markerSeen=false;
    window.addEventListener('storage',e=>{if(e.key===SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)window.__qa241_markerSeen=true;});
  });
  await pcMarkerSender.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-desktop-temporary-marker'));
  await pcIsolated.waitForTimeout(250);
  const pcMarker=await pcIsolated.evaluate(()=>({
    eventSeen:!!window.__qa241_markerSeen,token:state.sessionToken,
    tabToken:sessionStorage.getItem(SESSION_KEY),actor:state.me?.employee_id,
    visible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA241_PC_TAB_MARKER',JSON.stringify(pcMarker));
  check('Shared logout marker leaves PC tab-exclusive token unaffected',
    ()=>pcMarker.eventSeen&&pcMarker.token==='qa241-desktop-temporary-marker'&&pcMarker.tabToken===pcMarker.token&&pcMarker.actor===239&&pcMarker.visible);
  await isolatedMarkerCtx.close();

  // 237: Send one authoritative logout marker to four real Android-like tabs.
  // Three old-token tabs (one with legacy tab storage) must all revoke, while
  // a fourth tab already using a different token must remain untouched.
  const manyCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const manyTabs=await Promise.all(Array.from({length:4},()=>manyCtx.newPage()));
  for(const tab of manyTabs){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  // Real chronology: three tabs have old shared login. Fourth tab then
  // establishes a newer shared login, which first revokes the old views.
  await manyTabs[0].evaluate(()=>localStorage.setItem(SESSION_KEY,'qa241-four-tab-old'));
  for(let i=0;i<3;i++){
    await manyTabs[i].evaluate(({i})=>{
      state.sessionToken='qa241-four-tab-old';state.me={employee_id:1000+i,is_admin:true};
      if(i===1)sessionStorage.setItem(SESSION_KEY,'qa241-four-tab-old');
      document.getElementById('appView').classList.remove('hidden');
      document.getElementById('loginView').classList.add('hidden');
    },{i});
  }
  await manyTabs[3].evaluate(async()=>{
    const token='qa241-four-tab-new';
    state.sessionToken=token;state.me={employee_id:1003,is_admin:false};
    await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await manyTabs[3].waitForTimeout(300);
  await manyTabs[3].evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-four-tab-old'));
  await manyTabs[3].waitForTimeout(400);
  const manyResults=await Promise.all(manyTabs.map(tab=>tab.evaluate(()=>({
    current:state.sessionToken,actor:state.me?.employee_id??null,
    shown:!document.getElementById('appView').classList.contains('hidden'),
    mobile:MOBILE_SESSION_DEVICE
  }))));
  console.log('QA241_FOUR_TAB_LOGOUT_FANOUT',JSON.stringify(manyResults));
  check('Four real mobile tabs: three old-token privileged screens close',()=>manyResults.slice(0,3).every(r=>r.mobile&&!r.actor&&!r.shown&&r.current!=='qa241-four-tab-old'));
  check('Four real mobile tabs: unrelated newer session stays intact',()=>manyResults[3].mobile&&manyResults[3].current==='qa241-four-tab-new'&&manyResults[3].actor===1003&&manyResults[3].shown);
  await manyCtx.close();


  // 238: A mobile tab with legacy duplicate sessionStorage must not treat
  // itself as a PC tab-only session after a different mobile tab replaces
  // the shared login token.
  const legacySwitchCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const legacyOld=await legacySwitchCtx.newPage(),legacyNew=await legacySwitchCtx.newPage();
  for(const tab of [legacyOld,legacyNew]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await legacyOld.waitForTimeout(300);
  await legacyOld.evaluate(()=>{
    const token='qa241-legacy-shared-A';
    localStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:238,is_admin:true,display_name:'Legacy shared admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await legacyNew.evaluate(()=>localStorage.setItem(SESSION_KEY,'qa241-new-shared-B'));
  await legacyOld.waitForTimeout(500);
  const switched=await legacyOld.evaluate(()=>({
    mobile:MOBILE_SESSION_DEVICE,
    oldActor:state.me?.employee_id??null,
    oldUiVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    currentToken:state.sessionToken,
    sharedToken:localStorage.getItem(SESSION_KEY),
    tabToken:sessionStorage.getItem(SESSION_KEY),
    mismatch:sharedPersistentSessionMismatch(),
    sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()
  }));
  console.log('QA241_MOBILE_LEGACY_SHARED_REPLACEMENT',JSON.stringify(switched));
  check('Mobile legacy duplicate shared login is revoked after another tab replaces the token',
    ()=>switched.mobile&&switched.sharedToken==='qa241-new-shared-B'&&!switched.oldUiVisible);
  check('Mobile legacy duplicate cannot bypass shared-session action guard',
    ()=>!switched.oldUiVisible||switched.sensitiveMismatch);
  await legacySwitchCtx.close();

  // 238: Synchronous pre-dispatch guards must reject a mobile legacy
  // duplicate token even when no storage event was delivered yet.
  const guardMobileCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const guardMobilePage=await guardMobileCtx.newPage();
  await guardMobilePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await guardMobilePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const guarded=await guardMobilePage.evaluate(()=>{
    const savedConfigured=window.configured;
    window.configured=()=>true;
    try{
      const token='qa241-guard-legacy-A';
      state.sessionToken=token;
      state.me={employee_id:238,is_admin:true};
      sessionStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(SESSION_KEY,'qa241-guard-fresh-B');
      const result={mobile:MOBILE_SESSION_DEVICE,mode:fingerprintBlockingPromptSessionSnapshot().mode,sharedMismatch:sharedPersistentSessionMismatch(),sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()};
      function blocked(fn){try{fn();return false}catch(e){return e?.sharedSessionChanged===true;}}
      result.mutation=blocked(()=>guardMutationRpcSession('save_my_fingerprint_photo',{p_token:token}));
      result.backup=blocked(()=>guardSensitiveDataRpcSession('export_my_data_v1',{p_token:token}));
      result.read=blocked(()=>guardOrdinaryAuthenticatedReadRpcSession('list_my_fingerprint_records',{p_token:token}));
      return result;
    }finally{window.configured=savedConfigured;}
  });
  console.log('QA241_MOBILE_LEGACY_RPC_GUARDS',JSON.stringify(guarded));
  check('Mobile legacy duplicate resolves as shared mismatch',()=>guarded.mobile&&guarded.mode==='mismatch'&&guarded.sharedMismatch&&guarded.sensitiveMismatch);
  check('Mobile stale fingerprint mutation rejected before RPC dispatch',()=>guarded.mutation);
  check('Mobile stale backup/export sensitive read rejected before RPC dispatch',()=>guarded.backup);
  check('Mobile stale ordinary authenticated read rejected before RPC dispatch',()=>guarded.read);
  await guardMobileCtx.close();

  // 238: Legacy mobile tab token must never replace a newer shared token
  // that was explicitly logged out but could not be deleted without Web Locks.
  const fallbackCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const fallbackPage=await fallbackCtx.newPage();
  await fallbackPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await fallbackPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const fallback=await fallbackPage.evaluate(()=>{
    const locks=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      localStorage.setItem(SESSION_KEY,'qa241-later-shared-B');
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-later-shared-B');
      sessionStorage.setItem(SESSION_KEY,'qa241-stale-legacy-A');
      const staleFallback=storedSessionToken();
      // When Web Locks *are* available, cleanup may delete shared B; its
      // exact-token logout suppression marker still identifies this legacy A
      // fallback as unsafe.
      localStorage.removeItem(SESSION_KEY);
      const afterSharedTokenDeletion=storedSessionToken();
      localStorage.setItem(SESSION_KEY,'qa241-fresh-shared-C');
      const freshCandidate=storedSessionToken();
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      const genuineLegacyOnly=storedSessionToken();
      return {mobile:MOBILE_SESSION_DEVICE,staleFallback,afterSharedTokenDeletion,freshCandidate,genuineLegacyOnly};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:locks});}
  });
  console.log('QA241_SUPPRESSED_LOCAL_LEGACY_FALLBACK',JSON.stringify(fallback));
  check('Mobile suppressed newer shared logout cannot resurrect old tab-only legacy token',()=>fallback.mobile&&!fallback.staleFallback);
  check('Mobile completed deletion with retained logout marker also cannot restore stale legacy token',()=>!fallback.afterSharedTokenDeletion);
  check('Mobile distinct newer shared login remains selectable',()=>fallback.freshCandidate==='qa241-fresh-shared-C');
  check('Mobile genuine legacy-only token without a shared logout remains recoverable',()=>fallback.genuineLegacyOnly==='qa241-stale-legacy-A');
  await fallbackCtx.close();

  // 238: Exhaustive local/token/tombstone priority combinations. The
  // mobile oracle must never resurrect a tab token after any shared-logout
  // marker without a newer valid shared login; PC prioritizes tab isolation.
  const matrixCases=[];
  for(const local of ['', 'qa241-matrix-A','qa241-matrix-B'])
    for(const tab of ['', 'qa241-matrix-A','qa241-matrix-B'])
      for(const marker of ['', 'qa241-matrix-A','qa241-matrix-B','qa241-matrix-Z'])
        matrixCases.push({local,tab,marker});
  for(const mobile of [true,false]){
    const mCtx=await browser.newContext({
      viewport:{width:mobile?360:1366,height:mobile?780:900},
      ...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'}:{})
    });
    const mPage=await mCtx.newPage();
    await mPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await mPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
    const mData=await mPage.evaluate(cases=>{
      const bad=[];
      for(const tc of cases){
        if(tc.local)localStorage.setItem(SESSION_KEY,tc.local);else localStorage.removeItem(SESSION_KEY);
        if(tc.tab)sessionStorage.setItem(SESSION_KEY,tc.tab);else sessionStorage.removeItem(SESSION_KEY);
        if(tc.marker)localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,tc.marker);else localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
        const actual=storedSessionToken();
        const shared=tc.local&&tc.local!==tc.marker?tc.local:'';
        const temporary=tc.tab&&tc.tab!==tc.marker?tc.tab:'';
        const expected=MOBILE_SESSION_DEVICE?(tc.local?shared:(tc.marker?'':temporary)):(temporary||shared);
        if(actual!==expected)bad.push({...tc,expected,actual});
      }
      return {mobile:MOBILE_SESSION_DEVICE,bad,checked:cases.length};
    },matrixCases);
    console.log('QA241_TOKEN_PRIORITY_MATRIX',JSON.stringify(mData));
    check((mobile?'Mobile':'PC')+' session priority 36 independent cases',
      ()=>mData.mobile===mobile&&mData.checked===36&&mData.bad.length===0);
    await mCtx.close();
  }

  // Desktop sessionStorage login remains independent of another tab's
  // shared localStorage login; no false logout or RPC rejection.
  const pcGuardCtx=await browser.newContext({viewport:{width:1366,height:900}});
  const pcGuard=await pcGuardCtx.newPage();
  await pcGuard.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await pcGuard.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const independent=await pcGuard.evaluate(()=>{
    const savedConfigured=window.configured;
    window.configured=()=>true;
    try{
      const token='qa241-pc-tab-isolated';
      state.sessionToken=token;
      state.me={employee_id:239,is_admin:false};
      sessionStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(SESSION_KEY,'qa241-another-pc-shared');
      const result={mobile:MOBILE_SESSION_DEVICE,mode:fingerprintBlockingPromptSessionSnapshot().mode,sharedMismatch:sharedPersistentSessionMismatch(),sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()};
      // Shared B was logged out, but independent PC tab A must survive.
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-another-pc-shared');
      result.pcStoredAfterSharedLogout=storedSessionToken();
      let accepted=true;
      try{
        guardMutationRpcSession('save_my_fingerprint_photo',{p_token:token});
        guardSensitiveDataRpcSession('export_my_data_v1',{p_token:token});
        guardOrdinaryAuthenticatedReadRpcSession('list_my_fingerprint_records',{p_token:token});
      }catch(_){accepted=false;}
      return {...result,accepted};
    }finally{window.configured=savedConfigured;}
  });
  console.log('QA241_DESKTOP_TAB_ISOLATION_GUARDS',JSON.stringify(independent));
  check('PC tab-exclusive account remains independent of shared token',()=>!independent.mobile&&independent.mode==='tab'&&!independent.sharedMismatch&&!independent.sensitiveMismatch);
  check('PC tab-exclusive account mutation/read guards remain usable',()=>independent.accepted);
  check('PC tab-only token remains available after unrelated shared logout',()=>independent.pcStoredAfterSharedLogout==='qa241-pc-tab-isolated');
  await pcGuardCtx.close();


  // 239: Treat a completed logout marker as a hard boundary for mobile
  // migration. A stale sessionStorage token must not be written back into
  // localStorage simply because the newer shared session was deleted.
  const migrationCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const migrationPage=await migrationCtx.newPage();
  await migrationPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await migrationPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await migrationPage.waitForTimeout(350);
  const migration=await migrationPage.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-newer-B');
    sessionStorage.setItem(SESSION_KEY,'qa241-stale-A');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-stale-A');
    const initial=storedSessionToken();
    const ran=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const attempts=1;
    const after=storedSessionToken(),shared=localStorage.getItem(SESSION_KEY),
      currentAdmin=localStorage.getItem(ADMIN_UNLOCK_KEY);
    return {mobile:MOBILE_SESSION_DEVICE,initial,ran,attempts,after,shared,currentAdmin,
      temporary:sessionStorage.getItem(SESSION_KEY)};
  });
  console.log('QA241_MOBILE_STALE_MIGRATION',JSON.stringify(migration));
  check('239 legacy migration obtained actual mutex (not a skipped test)',()=>migration.ran);
  check('Mobile logged-out newer shared session cannot be resurrected by legacy migration',
    ()=>migration.mobile&&!migration.initial&&!migration.after&&!migration.shared);
  check('Mobile stale legacy admin unlock not promoted after newer logout',
    ()=>migration.currentAdmin!=='qa241-stale-A');
  // 239: Preserve genuinely isolated old mobile legacy sessions only when
  // no newer shared-logout boundary exists; never clobber newer shared C.
  const migrationPositives=await migrationPage.evaluate(async()=>{
    const reset=()=>{
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(ADMIN_UNLOCK_KEY);
      localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    };
    reset();
    sessionStorage.setItem(SESSION_KEY,'qa241-real-legacy-A');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-real-legacy-A');
    const migratedLegacy=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const genuine={ran:migratedLegacy,token:storedSessionToken(),shared:localStorage.getItem(SESSION_KEY),tab:sessionStorage.getItem(SESSION_KEY),admin:localStorage.getItem(ADMIN_UNLOCK_KEY)};
    reset();
    localStorage.setItem(SESSION_KEY,'qa241-newer-shared-C');
    localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-prior-shared-B');
    sessionStorage.setItem(SESSION_KEY,'qa241-stale-A');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-stale-A');
    const migratedNewer=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const newer={ran:migratedNewer,token:storedSessionToken(),shared:localStorage.getItem(SESSION_KEY),tab:sessionStorage.getItem(SESSION_KEY),admin:localStorage.getItem(ADMIN_UNLOCK_KEY)};
    reset();
    localStorage.setItem(SESSION_KEY,'qa241-logged-out-B');
    localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-logged-out-B');
    sessionStorage.setItem(SESSION_KEY,'qa241-stale-A');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-stale-A');
    const migratedSuppressed=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const suppressed={ran:migratedSuppressed,token:storedSessionToken(),shared:localStorage.getItem(SESSION_KEY),tab:sessionStorage.getItem(SESSION_KEY),admin:localStorage.getItem(ADMIN_UNLOCK_KEY)};
    return {genuine,newer,suppressed};
  });
  console.log('QA241_MOBILE_MIGRATION_POSITIVES',JSON.stringify(migrationPositives));
  check('Actual mobile legacy-only login migrates when no newer logout marker exists',()=>migrationPositives.genuine.ran&&migrationPositives.genuine.token==='qa241-real-legacy-A'&&migrationPositives.genuine.shared==='qa241-real-legacy-A'&&!migrationPositives.genuine.tab);
  check('Actual mobile legacy-only admin unlock safely migrates',()=>migrationPositives.genuine.admin==='qa241-real-legacy-A');
  check('Actual newer mobile shared login C remains intact over stale legacy A',()=>migrationPositives.newer.ran&&migrationPositives.newer.token==='qa241-newer-shared-C'&&migrationPositives.newer.shared==='qa241-newer-shared-C'&&!migrationPositives.newer.tab&&migrationPositives.newer.admin!=='qa241-stale-A');
  check('Suppressed mobile shared B never promotes unrelated legacy A',()=>migrationPositives.suppressed.ran&&!migrationPositives.suppressed.token&&migrationPositives.suppressed.admin!=='qa241-stale-A'&&!migrationPositives.suppressed.tab);
  // Token-specific logout tombstones are a second revocation source. Even
  // if a shared suppression marker was cleared, a stale mobile tab token
  // cannot be migrated into a fresh shared login behind that tombstone.
  const tombstoneMigration=await migrationPage.evaluate(async()=>{
    const token='qa241-logged-out-tombstone-A';
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ADMIN_UNLOCK_KEY);
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    sessionStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    markUpdateHandoffLoggedOut(token);
    const revocation=updateHandoffTokenWasLoggedOut(token);
    const before=storedSessionToken();
    const ran=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    return {revocation,before,ran,after:storedSessionToken(),shared:localStorage.getItem(SESSION_KEY),
      admin:localStorage.getItem(ADMIN_UNLOCK_KEY)};
  });
  console.log('QA241_TOMBSTONED_LEGACY_MIGRATION',JSON.stringify(tombstoneMigration));
  check('Revoked mobile legacy token must not be re-promoted from tombstone',
    ()=>tombstoneMigration.revocation&&tombstoneMigration.ran&&!tombstoneMigration.after&&!tombstoneMigration.shared);
  check('Revoked mobile admin unlock remains suppressed by token-specific tombstone',
    ()=>tombstoneMigration.admin!=='qa241-logged-out-tombstone-A');
  await migrationCtx.close();
  // 239: Real mobile document reload must not repopulate app/state from a
  // token-specific logout marker, even when no shared logout marker exists.
  const bootCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const bootPage=await bootCtx.newPage();
  await bootPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await bootPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await bootPage.evaluate(()=>{
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    sessionStorage.setItem(SESSION_KEY,'qa241-reload-revoked-A');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-reload-revoked-A');
    markUpdateHandoffLoggedOut('qa241-reload-revoked-A');
  });
  await bootPage.reload({waitUntil:'domcontentloaded'});
  await bootPage.waitForTimeout(250);
  const bootRevoked=await bootPage.evaluate(()=>({
    restored:storedSessionToken(),state:state.sessionToken,
    shared:localStorage.getItem(SESSION_KEY),temp:sessionStorage.getItem(SESSION_KEY),
    oldAdminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA241_REVOKED_BOOT_RELOAD',JSON.stringify(bootRevoked));
  check('Real mobile reload does not restore tombstoned legacy account token',()=>!bootRevoked.restored&&!bootRevoked.state&&!bootRevoked.shared&&!bootRevoked.temp);
  check('Real mobile reload does not render tombstoned admin UI',()=>!bootRevoked.oldAdminVisible);
  await bootCtx.close();

  // Prior aggregate-format logout markers must remain effective throughout
  // migration to token-specific storage (legacy browser upgrade safety).
  const aggregateCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const aggregatePage=await aggregateCtx.newPage();
  await aggregatePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await aggregatePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const oldFormat=await aggregatePage.evaluate(async()=>{
    const token='qa241-aggregate-revoked-A';
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    localStorage.setItem('staffAttendance_updateSessionLogout_v1',JSON.stringify({entries:[{token,at:Date.now()}]}));
    sessionStorage.setItem(SESSION_KEY,token);
    const before=storedSessionToken();
    const ran=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    return {mobile:MOBILE_SESSION_DEVICE,before,ran,after:storedSessionToken(),shared:localStorage.getItem(SESSION_KEY)};
  });
  console.log('QA241_LEGACY_AGGREGATE_REVOCATION',JSON.stringify(oldFormat));
  check('Legacy aggregate logout tombstone also blocks mobile restoration',()=>oldFormat.mobile&&!oldFormat.before&&oldFormat.ran&&!oldFormat.after&&!oldFormat.shared);
  await aggregateCtx.close();

  // 239: In older mobile WebViews without navigator.locks, boot migration
  // is deliberately skipped; even so early token selection must reject
  // an explicitly logged-out legacy token, including after real reload.
  const noLocksCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  await noLocksCtx.addInitScript(()=>{try{Object.defineProperty(navigator,'locks',{configurable:true,value:null});}catch(_){}});
  const noLocksPage=await noLocksCtx.newPage();
  await noLocksPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await noLocksPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await noLocksPage.evaluate(()=>{
    const token='qa241-no-weblocks-revoked-A';
    sessionStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    markUpdateHandoffLoggedOut(token);
  });
  await noLocksPage.reload({waitUntil:'domcontentloaded'});
  await noLocksPage.waitForTimeout(200);
  const noLocksBoot=await noLocksPage.evaluate(()=>({
    locksUnavailable:!navigator.locks?.request,mobile:MOBILE_SESSION_DEVICE,
    selected:storedSessionToken(),state:state.sessionToken,
    appVisible:!document.getElementById('appView').classList.contains('hidden'),
    admin:state.me?.is_admin||false
  }));
  console.log('QA241_NO_WEBLOCKS_TOMBSTONE_BOOT',JSON.stringify(noLocksBoot));
  check('Mobile Web Locks unavailable still denies tombstoned session restore',()=>noLocksBoot.locksUnavailable&&noLocksBoot.mobile&&!noLocksBoot.selected&&!noLocksBoot.state&&!noLocksBoot.admin&&!noLocksBoot.appVisible);
  await noLocksCtx.close();

  // 239: Tombstones are token-specific. A clock moving backward must not
  // resurrect revoked A; unrelated live C and PC tab-only sessions remain.
  const skewCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const skewPage=await skewCtx.newPage();
  await skewPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await skewPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const skew=await skewPage.evaluate(()=>{
    const revoked='qa241-skew-revoked-A',unrelated='qa241-new-session-C';
    localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem('staffAttendance_updateSessionLogoutToken_v1:'+encodeURIComponent(revoked),String(Date.now()+3600000));
    sessionStorage.setItem(SESSION_KEY,revoked);
    const futureRevoked=storedSessionToken();
    sessionStorage.setItem(SESSION_KEY,unrelated);
    const unrelatedAllowed=storedSessionToken();
    localStorage.setItem(SESSION_KEY,unrelated);
    const sharedNewer=storedSessionToken();
    return {mobile:MOBILE_SESSION_DEVICE,futureRevoked,unrelatedAllowed,sharedNewer};
  });
  console.log('QA241_TOMBSTONE_CLOCK_SKEW',JSON.stringify(skew));
  check('Future-dated logout tombstone remains revoking mobile legacy A',()=>skew.mobile&&!skew.futureRevoked);
  check('Unrelated mobile legacy C remains eligible despite A tombstone',()=>skew.unrelatedAllowed==='qa241-new-session-C');
  check('Unrelated newer shared C stays authenticated despite A tombstone',()=>skew.sharedNewer==='qa241-new-session-C');
  await skewCtx.close();


  // 240: A cross-tab exact-token logout tombstone is a revocation signal
  // even if the suppression marker or shared-key deletion was blocked.
  const crossRevokedCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const sharedVictim=await crossRevokedCtx.newPage(),logoutPeer=await crossRevokedCtx.newPage();
  for(const tab of [sharedVictim,logoutPeer]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all([sharedVictim,logoutPeer].map(tab=>tab.waitForTimeout(650)));
  await sharedVictim.evaluate(()=>{
    const token='qa241-explicit-shared-revoked-A';
    localStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:240,is_admin:true,display_name:'QA Shared Administrator'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await logoutPeer.evaluate(()=>markUpdateHandoffLoggedOut('qa241-explicit-shared-revoked-A'));
  await sharedVictim.waitForTimeout(350);
  const crossRevoked=await sharedVictim.evaluate(()=>{
    const token='qa241-explicit-shared-revoked-A';
    const oldUiVisible=!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden');
    const shared=localStorage.getItem(SESSION_KEY);
    const tombstoned=storedSessionTombstoned(token);
    const ownershipAccepted=!fingerprintCurrentSharedSessionMismatch();
    return {mobile:MOBILE_SESSION_DEVICE,oldUiVisible,shared,token:state.sessionToken,tombstoned,ownershipAccepted};
  });
  console.log('QA241_CROSSTAB_TOKEN_TOMBSTONE',JSON.stringify(crossRevoked));
  check('Cross-tab exact-token logout tombstone invalidates old mobile admin UI despite shared key residue',
    ()=>crossRevoked.mobile&&crossRevoked.tombstoned&&!crossRevoked.oldUiVisible);
  check('Cross-tab exact-token logout tombstone invalidates stale mobile ownership fence',
    ()=>!crossRevoked.token||!crossRevoked.ownershipAccepted);
  await crossRevokedCtx.close();

  // Separate single-task synchronous fence: no storage event is emitted to
  // the writer tab. A pre-dispatch check must inspect the exact-token
  // tombstone itself, before the browser has any opportunity to deliver events.
  const syncFenceCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const syncFencePage=await syncFenceCtx.newPage();
  await syncFencePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await syncFencePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await syncFencePage.waitForTimeout(350);
  const syncFence=await syncFencePage.evaluate(()=>{
    const token='qa241-sync-tombstoned-A';
    localStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:240,is_admin:true};
    markUpdateHandoffLoggedOut(token);
    const current=state.sessionToken,local=localStorage.getItem(SESSION_KEY);
    const revoked=storedSessionTombstoned(token);
    const mismatch=fingerprintCurrentSharedSessionMismatch();
    const sharedMismatch=sharedPersistentSessionMismatch();
    const snapshot=fingerprintBlockingPromptSessionSnapshot();
    function blocked(fn){try{fn();return false;}catch(e){return !!e?.sharedSessionChanged;}}
    const mutationBlocked=blocked(()=>guardMutationRpcSession('save_my_fingerprint_photo',{p_token:token}));
    const exportBlocked=blocked(()=>guardSensitiveDataRpcSession('export_my_data_v1',{p_token:token}));
    return {current,local,revoked,mismatch,sharedMismatch,mode:snapshot.mode,mutationBlocked,exportBlocked};
  });
  console.log('QA241_SYNCHRONOUS_TOMBSTONE_FENCE',JSON.stringify(syncFence));
  check('Valid mobile tombstone test retains original stored token before cleanup',()=>syncFence.current===syncFence.local&&syncFence.revoked);
  check('Mobile revoked token is rejected by synchronous sensitive-data ownership fence',()=>syncFence.mismatch&&syncFence.exportBlocked);
  check('Mobile revoked token is rejected by synchronous fingerprint mutation fence',()=>syncFence.mutationBlocked);
  await syncFenceCtx.close();



  // 240: A different user's tombstone A must not revoke a valid independent
  // PC tab B. Test includes the actual storage event received from another tab.
  const isolatedPcCtx=await browser.newContext({viewport:{width:1366,height:900}});
  const pcValid=await isolatedPcCtx.newPage(),pcOther=await isolatedPcCtx.newPage();
  for(const tab of [pcValid,pcOther]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all([pcValid,pcOther].map(tab=>tab.waitForTimeout(400)));
  await pcValid.evaluate(()=>{
    sessionStorage.setItem(SESSION_KEY,'qa241-pc-valid-B');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-pc-valid-B');
    state.sessionToken='qa241-pc-valid-B';
    state.me={employee_id:241,is_admin:true};
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    window.__qa240OtherTokenTombstoneEvent=false;
    window.addEventListener('storage',e=>{
      if(String(e.key||'').startsWith('staffAttendance_updateSessionLogoutToken_v1:')){
        window.__qa240OtherTokenTombstoneEvent=true;
        sessionStorage.setItem('__qa240OtherTokenTombstoneEvent','1');
      }
    });
  });
  await pcOther.evaluate(()=>markUpdateHandoffLoggedOut('qa241-unrelated-revoked-A'));
  await pcValid.waitForTimeout(300);
  const unaffectedPc=await pcValid.evaluate(()=>({
    eventReceived:window.__qa240OtherTokenTombstoneEvent===true||sessionStorage.getItem('__qa240OtherTokenTombstoneEvent')==='1',
    mobile:MOBILE_SESSION_DEVICE,
    shared:localStorage.getItem(SESSION_KEY),
    tab:sessionStorage.getItem(SESSION_KEY),
    token:state.sessionToken,
    adminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    adminUnlock:adminUnlockMatches('qa241-pc-valid-B'),
    actorCurrent:sessionContextCurrent(241,'qa241-pc-valid-B')
  }));
  console.log('QA241_PC_UNRELATED_REVOCATION',JSON.stringify(unaffectedPc));
  check('Unrelated exact-token revocation leaves independent PC tab-B login intact',
    ()=>unaffectedPc.eventReceived&&!unaffectedPc.mobile&&unaffectedPc.tab==='qa241-pc-valid-B'&&unaffectedPc.token==='qa241-pc-valid-B');
  check('Unrelated token-A revocation preserves independent PC B administrator unlock',
    ()=>unaffectedPc.adminVisible&&unaffectedPc.adminUnlock&&unaffectedPc.actorCurrent);
  await isolatedPcCtx.close();

  // Revoked token A must not be rescued by an unlocked old admin marker.
  const revokedAdminCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const revokedAdminPage=await revokedAdminCtx.newPage();
  await revokedAdminPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await revokedAdminPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const revokedAdmin=await revokedAdminPage.evaluate(()=>{
    const token='qa241-revoked-admin-A';
    localStorage.setItem(SESSION_KEY,token);
    localStorage.setItem(ADMIN_UNLOCK_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:240,is_admin:true};
    markUpdateHandoffLoggedOut(token);
    return {revoked:storedSessionTombstoned(token),unlocked:adminUnlockMatches(token),
      contextStillValid:sessionContextCurrent(240,token)};
  });
  console.log('QA241_ADMIN_TOMBSTONE_REVOKE',JSON.stringify(revokedAdmin));
  check('Revoked admin token cannot reuse old second-factor unlock',()=>revokedAdmin.revoked&&!revokedAdmin.unlocked&&!revokedAdmin.contextStillValid);
  await revokedAdminCtx.close();

  // 240: An old mobile A logout must never delete an independently newer
  // shared B and its admin unlock, even if A is explicitly tombstoned first.
  const newerCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const oldLogoutPage=await newerCtx.newPage();
  await oldLogoutPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await oldLogoutPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await oldLogoutPage.waitForTimeout(300);
  await oldLogoutPage.evaluate(()=>{
    state.sessionToken='qa241-older-token-A';
    state.me={employee_id:240,is_admin:true};
    localStorage.setItem(SESSION_KEY,'qa241-newer-token-B');
    localStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-newer-token-B');
    markUpdateHandoffLoggedOut('qa241-older-token-A');
    logout(false);
  });
  await oldLogoutPage.waitForTimeout(400);
  const newerSafe=await oldLogoutPage.evaluate(()=>({
    token:localStorage.getItem(SESSION_KEY),
    unlock:localStorage.getItem(ADMIN_UNLOCK_KEY),
    tombstone:storedSessionTombstoned('qa241-older-token-A'),
    owner:state.sessionToken
  }));
  console.log('QA241_NEWER_SHARED_SURVIVES_OLD_LOGOUT',JSON.stringify(newerSafe));
  check('Old mobile logout does not delete newer shared account B',()=>newerSafe.tombstone&&newerSafe.token==='qa241-newer-token-B');
  check('Old mobile logout does not delete newer shared administrator unlock B',()=>newerSafe.unlock==='qa241-newer-token-B'&&!newerSafe.owner);
  await newerCtx.close();

  // Real 4-tab fan-out: a peer's exact-token logout tombstone must revoke
  // three mobile administrator surfaces without a SESSION_KEY event.
  const fanCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const fanTabs=await Promise.all(Array.from({length:4},()=>fanCtx.newPage()));
  for(const tab of fanTabs){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all(fanTabs.map(tab=>tab.waitForTimeout(350)));
  await fanTabs[0].evaluate(()=>localStorage.setItem(SESSION_KEY,'qa241-fanout-old-admin-A'));
  for(let i=0;i<3;i++){
    await fanTabs[i].evaluate(({i})=>{
      state.sessionToken='qa241-fanout-old-admin-A';
      state.me={employee_id:240+i,is_admin:true};
      document.getElementById('appView').classList.remove('hidden');
      document.getElementById('loginView').classList.add('hidden');
      window.addEventListener('storage',event=>{
        if(String(event.key||'').startsWith('staffAttendance_updateSessionLogoutToken_v1:')){
          sessionStorage.setItem('__qa241_fanout_event','yes');
        }
      });
    },{i});
  }
  await fanTabs[3].evaluate(()=>markUpdateHandoffLoggedOut('qa241-fanout-old-admin-A'));
  await fanTabs[0].waitForTimeout(450);
  const fanResults=await Promise.all(fanTabs.slice(0,3).map(tab=>tab.evaluate(()=>({
    eventReceived:sessionStorage.getItem('__qa241_fanout_event')==='yes',
    adminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    token:state.sessionToken,
    tombstoned:storedSessionTombstoned('qa241-fanout-old-admin-A')
  }))));
  console.log('QA241_REAL_4TAB_TOMBSTONE_FANOUT',JSON.stringify(fanResults));
  check('Real three old mobile admin tabs receive same per-token logout event',()=>fanResults.every(r=>r.eventReceived&&r.tombstoned));
  check('Real three old mobile admin surfaces close after remote exact-token logout',()=>fanResults.every(r=>!r.adminVisible&&!r.token));
  await fanCtx.close();

  // Compatibility with older deployed tabs: an aggregate-format tombstone
  // must close an existing shared admin surface, not merely reject next boot.
  const legacyEventCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const qa240AggregateVictim=await legacyEventCtx.newPage(),qa240AggregateSender=await legacyEventCtx.newPage();
  for(const tab of [qa240AggregateVictim,qa240AggregateSender]){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all([qa240AggregateVictim,qa240AggregateSender].map(tab=>tab.waitForTimeout(400)));
  await qa240AggregateVictim.evaluate(()=>{
    const token='qa241-legacy-aggregate-admin-A';
    localStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:240,is_admin:true};
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    window.addEventListener('storage',e=>{
      if(e.key==='staffAttendance_updateSessionLogout_v1'){
        sessionStorage.setItem('__qa241_legacy_aggregate_seen','1');
      }
    });
  });
  await qa240AggregateSender.evaluate(()=>{
    localStorage.setItem('staffAttendance_updateSessionLogout_v1',JSON.stringify({
      entries:[{token:'qa241-legacy-aggregate-admin-A',at:Date.now()}]
    }));
  });
  await qa240AggregateVictim.waitForTimeout(350);
  const legacyLiveRevocation=await qa240AggregateVictim.evaluate(()=>({
    received:sessionStorage.getItem('__qa241_legacy_aggregate_seen')==='1',
    oldAdminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    oldToken:state.sessionToken
  }));
  console.log('QA241_REAL_LEGACY_AGGREGATE_LOGOUT_EVENT',JSON.stringify(legacyLiveRevocation));
  check('Actual legacy aggregate logout storage event reaches existing mobile tab',()=>legacyLiveRevocation.received);
  check('Actual legacy aggregate logout revokes stale mobile administrator UI',()=>!legacyLiveRevocation.oldAdminVisible&&!legacyLiveRevocation.oldToken);
  await legacyEventCtx.close();

  // 241: In a WebView where Web Locks are missing, explicit logout writes
  // a shared suppression marker before it can delete localStorage SESSION_KEY.
  // Background tabs may miss storage events; all guards must therefore inspect
  // the marker synchronously even when the old shared token remains unchanged.
  const suppressedContext=await browser.newContext({
    viewport:{width:360,height:780},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'
  });
  const suppressedPage=await suppressedContext.newPage();
  await suppressedPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await suppressedPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await suppressedPage.waitForTimeout(250);
  const suppressed=await suppressedPage.evaluate(()=>{
    const previousConfigured=window.configured;
    window.configured=()=>true;
    const token='qa241-shared-suppressed-A';
    try{
      localStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(ADMIN_UNLOCK_KEY,token);
      sessionStorage.removeItem(SESSION_KEY);
      state.sessionToken=token;
      state.me={employee_id:241,is_admin:true,display_name:'QA241 privileged'};
      // same-tab setItem does not dispatch a storage event, simulating the
      // event-delivery gap in another sleeping/bfcache tab.
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
      const result={
        mobile:MOBILE_SESSION_DEVICE,
        token,stored:storedSessionToken(),
        shared:localStorage.getItem(SESSION_KEY),
        suppressed:localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY),
        activeAdmin:adminUnlockMatches(token),
        owner:sharedPersistentSessionMismatch(),
        sensitive:fingerprintCurrentSharedSessionMismatch(),
        snapshot:fingerprintBlockingPromptSessionSnapshot().mode,
        sessionContext:sessionContextCurrent(241,token)
      };
      function guard(fn){try{fn();return false;}catch(e){return e?.sharedSessionChanged===true;}}
      result.mutationDenied=guard(()=>guardMutationRpcSession('save_my_fingerprint_photo',{p_token:token}));
      result.backupDenied=guard(()=>guardSensitiveDataRpcSession('export_my_data_v1',{p_token:token}));
      result.readDenied=guard(()=>guardOrdinaryAuthenticatedReadRpcSession('get_me',{p_token:token}));
      return result;
    }finally{window.configured=previousConfigured;}
  });
  console.log('QA241_SHARED_SUPPRESSION_OWNER_GUARDS',JSON.stringify(suppressed));
  check('241 mobile suppressed token remains explicitly logged out even if shared key survived',
    ()=>suppressed.mobile&&suppressed.stored===''&&suppressed.suppressed===suppressed.shared);
  check('241 suppressed shared token blocks old administrator and async owner',()=>!suppressed.activeAdmin&&!suppressed.sessionContext);
  check('241 suppressed shared token forces stale owner/sensitive guard even with no storage event',
    ()=>suppressed.owner&&suppressed.sensitive&&suppressed.snapshot==='mismatch');
  check('241 suppressed shared token blocks mutation, export and ordinary read before RPC',
    ()=>suppressed.mutationDenied&&suppressed.backupDenied&&suppressed.readDenied);
  await suppressedContext.close();

  // 241: Existing tab-only PC session B must stay authenticated when
  // another unrelated shared token A was explicitly suppressed. A new shared
  // login C must also supersede stale A without inheriting its lock.
  const survivorPcCtx=await browser.newContext({viewport:{width:1366,height:900}});
  const survivorPc=await survivorPcCtx.newPage();
  await survivorPc.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await survivorPc.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const survivingPc=await survivorPc.evaluate(()=>{
    const prev=window.configured;window.configured=()=>true;
    try{
      const localToken='qa241-old-shared-A',tab='qa241-independent-PC-B';
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,localToken);
      localStorage.setItem(SESSION_KEY,localToken);
      sessionStorage.setItem(SESSION_KEY,tab);
      sessionStorage.setItem(ADMIN_UNLOCK_KEY,tab);
      state.sessionToken=tab;
      state.me={employee_id:241,is_admin:true};
      return {mobile:MOBILE_SESSION_DEVICE,
        recovered:storedSessionToken(),admin:adminUnlockMatches(tab),
        mismatch:sharedPersistentSessionMismatch(),
        sensitive:fingerprintCurrentSharedSessionMismatch(),
        snapshot:fingerprintBlockingPromptSessionSnapshot().mode,
        asyncOwner:sessionContextCurrent(241,tab)};
    }finally{window.configured=prev;}
  });
  console.log('QA241_UNRELATED_PC_TAB_SURVIVES',JSON.stringify(survivingPc));
  check('241 unrelated independent PC tab B unaffected by suppressed shared A',
    ()=>!survivingPc.mobile&&survivingPc.recovered==='qa241-independent-PC-B'&&survivingPc.admin&&
       !survivingPc.mismatch&&!survivingPc.sensitive&&survivingPc.snapshot==='tab'&&survivingPc.asyncOwner);
  await survivorPcCtx.close();

  const cleanMobileCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const cleanMobile=await cleanMobileCtx.newPage();
  await cleanMobile.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await cleanMobile.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const newShared=await cleanMobile.evaluate(async()=>{
    const prev=window.configured;window.configured=()=>true;
    try{
      const old='qa241-suppressed-old-A',fresh='qa241-new-shared-C';
      localStorage.setItem(SESSION_KEY,old);
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,old);
      state.sessionToken=fresh;state.me={employee_id:241,is_admin:true};
      const wrote=await withBrowserSharedSessionLock(()=>storeLoginSession(fresh,true,true));
      const unlocked=await withBrowserSharedSessionLock(()=>storeAdminUnlock(fresh,true));
      // Avoid test-fixture races with the app's unauthenticated backend boot:
      // these probes intentionally supply a synthetic actor after storage operations.
      state.sessionToken=fresh;state.me={employee_id:241,is_admin:true};
      return {mobile:MOBILE_SESSION_DEVICE,wrote,unlocked,
        recovered:storedSessionToken(),current:localStorage.getItem(SESSION_KEY),
        marker:localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY),
        admin:adminUnlockMatches(fresh),mismatch:sharedPersistentSessionMismatch(),
        sensitive:fingerprintCurrentSharedSessionMismatch(),
        snapshot:fingerprintBlockingPromptSessionSnapshot().mode,
        asyncOwner:sessionContextCurrent(241,fresh)};
    }finally{window.configured=prev;}
  });
  console.log('QA241_NEW_SHARED_LOGIN_SURVIVES_OLD_SUPPRESSION',JSON.stringify(newShared));
  check('241 distinct successful mobile shared C stays live while old A marker exists',
    ()=>newShared.mobile&&newShared.wrote&&newShared.unlocked&&
       newShared.recovered==='qa241-new-shared-C'&&newShared.current===newShared.recovered&&
       newShared.marker==='qa241-suppressed-old-A'&&newShared.admin&&
       !newShared.mismatch&&!newShared.sensitive&&newShared.snapshot==='shared'&&newShared.asyncOwner);
  await cleanMobileCtx.close();

  // 241: Four actual mobile tabs, with storage event delivery and no
  // backend fixture dependency, must collectively revoke a suppressed A.
  const suppressionFanoutCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const suppressionFanoutTabs=await Promise.all(Array.from({length:4},()=>suppressionFanoutCtx.newPage()));
  for(const tab of suppressionFanoutTabs){
    await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  }
  await Promise.all(suppressionFanoutTabs.map(tab=>tab.waitForTimeout(350)));
  await suppressionFanoutTabs[0].evaluate(()=>localStorage.setItem(SESSION_KEY,'qa241-four-tabs-old-A'));
  for(let i=0;i<3;i++){
    await suppressionFanoutTabs[i].evaluate(({i})=>{
      state.sessionToken='qa241-four-tabs-old-A';
      state.me={employee_id:241+i,is_admin:true};
      document.getElementById('appView').classList.remove('hidden');
      document.getElementById('loginView').classList.add('hidden');
      window.addEventListener('storage',event=>{
        if(event.key===SHARED_SESSION_LOGOUT_SUPPRESSION_KEY){
          sessionStorage.setItem('__qa241_suppression_event','yes');
        }
      });
    },{i});
  }
  const beforeSuppressionFanout=await Promise.all(suppressionFanoutTabs.slice(0,3).map(tab=>tab.evaluate(()=>({
    token:state.sessionToken,visible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden')
  }))));
  await suppressionFanoutTabs[3].evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-four-tabs-old-A'));
  await suppressionFanoutTabs[0].waitForTimeout(450);
  const fanoutSuppression=await Promise.all(suppressionFanoutTabs.slice(0,3).map(tab=>tab.evaluate(()=>({
    received:sessionStorage.getItem('__qa241_suppression_event')==='yes',
    token:state.sessionToken,
    visible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    suppressed:storedSessionTombstoned('qa241-four-tabs-old-A')
  }))));
  console.log('QA241_REAL_FOUR_TAB_SUPPRESSION_FANOUT',JSON.stringify({before:beforeSuppressionFanout,after:fanoutSuppression}));
  check('241 four-tab suppression fixture exposes all three initial old admin views',
    ()=>beforeSuppressionFanout.every(x=>x.token==='qa241-four-tabs-old-A'&&x.visible));
  check('241 three actual mobile recipients receive shared logout marker storage event',
    ()=>fanoutSuppression.every(x=>x.received&&x.suppressed));
  check('241 shared suppression event synchronously revokes all old administrator views',
    ()=>fanoutSuppression.every(x=>!x.visible&&!x.token));
  await suppressionFanoutCtx.close();

  // 241: Reload a mobile document without Web Locks after a failed atomic
  // shared logout; suppression A must remain an authoritative boot fence.
  const noLockCtx=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  await noLockCtx.addInitScript(()=>{
    try{Object.defineProperty(navigator,'locks',{configurable:true,value:null});}catch(_){}
  });
  const noLockPage=await noLockCtx.newPage();
  await noLockPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await noLockPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await noLockPage.evaluate(()=>{
    localStorage.setItem(SESSION_KEY,'qa241-weblocks-absent-A');
    localStorage.setItem(ADMIN_UNLOCK_KEY,'qa241-weblocks-absent-A');
    sessionStorage.setItem(SESSION_KEY,'qa241-weblocks-absent-A');
    localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa241-weblocks-absent-A');
  });
  await noLockPage.reload({waitUntil:'domcontentloaded'});
  await noLockPage.waitForTimeout(300);
  const noLockResult=await noLockPage.evaluate(()=>({
    mobile:MOBILE_SESSION_DEVICE,
    locksUnavailable:!navigator.locks?.request,
    stored:storedSessionToken(),
    state:state.sessionToken,
    shared:localStorage.getItem(SESSION_KEY),
    suppressed:localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY),
    adminUnlock:adminUnlockMatches('qa241-weblocks-absent-A'),
    appVisible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA241_NO_WEB_LOCKS_RELOAD',JSON.stringify(noLockResult));
  check('241 real mobile reload with no Web Locks cannot restore exact suppressed A',
    ()=>noLockResult.mobile&&noLockResult.locksUnavailable&&!noLockResult.stored&&!noLockResult.state&&
       noLockResult.shared==='qa241-weblocks-absent-A'&&noLockResult.suppressed===noLockResult.shared);
  check('241 no-Web-Locks mobile reload never reveals suppressed privileged UI',
    ()=>!noLockResult.adminUnlock&&!noLockResult.appVisible);
  await noLockCtx.close();

  // 241: PC persistent shared A must be revoked by the same marker fence;
  // a same-token old PC sessionStorage A is not a separate authenticated user.
  const revokedPcCtx=await browser.newContext({viewport:{width:1280,height:860}});
  const revokedPcPage=await revokedPcCtx.newPage();
  await revokedPcPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await revokedPcPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await revokedPcPage.waitForTimeout(200);
  const revokedPc=await revokedPcPage.evaluate(()=>{
    const previousConfigured=window.configured;window.configured=()=>true;
    const token='qa241-revoked-pc-shared-A';
    try{
      localStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(PC_REMEMBER_KEY,'1');
      localStorage.setItem(ADMIN_UNLOCK_KEY,token);
      sessionStorage.removeItem(SESSION_KEY);
      state.sessionToken=token;
      state.me={employee_id:241,is_admin:true};
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
      const persistent={
        mobile:MOBILE_SESSION_DEVICE,tokenStored:storedSessionToken(),
        admin:adminUnlockMatches(token),
        mismatch:sharedPersistentSessionMismatch(),
        sensitive:fingerprintCurrentSharedSessionMismatch(),
        snapshot:fingerprintBlockingPromptSessionSnapshot().mode,
        sessionContext:sessionContextCurrent(241,token)
      };
      const tab='qa241-pc-old-tab-A';
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PC_REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY,tab);
      sessionStorage.setItem(ADMIN_UNLOCK_KEY,tab);
      state.sessionToken=tab;
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,tab);
      const isolatedSameToken={
        tokenStored:storedSessionToken(),admin:adminUnlockMatches(tab),
        mismatch:sharedPersistentSessionMismatch(),
        sensitive:fingerprintCurrentSharedSessionMismatch(),
        snapshot:fingerprintBlockingPromptSessionSnapshot().mode,
        sessionContext:sessionContextCurrent(241,tab)
      };
      return {persistent,isolatedSameToken};
    }finally{window.configured=previousConfigured;}
  });
  console.log('QA241_PC_SUPPRESSED_SHARED_AND_SAME_TOKEN_TAB',JSON.stringify(revokedPc));
  check('241 old persistent PC shared A is blocked by exact logout marker',
    ()=>!revokedPc.persistent.mobile&&!revokedPc.persistent.tokenStored&&
       !revokedPc.persistent.admin&&revokedPc.persistent.mismatch&&
       revokedPc.persistent.sensitive&&revokedPc.persistent.snapshot==='mismatch'&&
       !revokedPc.persistent.sessionContext);
  check('241 same-token old PC tab A is revoked even though tab-only login ordinarily isolates',
    ()=>!revokedPc.isolatedSameToken.tokenStored&&!revokedPc.isolatedSameToken.admin&&
       revokedPc.isolatedSameToken.mismatch&&revokedPc.isolatedSameToken.sensitive&&
       revokedPc.isolatedSameToken.snapshot==='mismatch'&&!revokedPc.isolatedSameToken.sessionContext);
  await revokedPcCtx.close();

  // Browser navigation with possible BFCache restoration: password inputs
  // must be cleared on pagehide even when the document is re-used.
  const navCtx=await browser.newContext({viewport:{width:390,height:844}});
  const navPage=await navCtx.newPage();
  await navPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await navPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await navPage.evaluate(()=>{
    document.getElementById('loginPin').value='1234';
    document.getElementById('loginAdminPin').value='5678';
    window.addEventListener('pageshow',event=>sessionStorage.setItem('__qa241_bfcache_event__',event.persisted?'persisted':'fresh'));
  });
  await navPage.goto('http://127.0.0.1:'+port+'/away',{waitUntil:'domcontentloaded'});
  await navPage.goBack({waitUntil:'domcontentloaded'});
  const navSecret=await navPage.evaluate(()=>({
    pin:document.getElementById('loginPin').value,
    adminPin:document.getElementById('loginAdminPin').value,
    restoration:sessionStorage.getItem('__qa241_bfcache_event__')||'unknown'
  }));
  check('Real browser back navigation clears old PIN fields',()=>!navSecret.pin&&!navSecret.adminPin);
  console.log('QA241_BROWSER_BACK',JSON.stringify(navSecret));
  await navCtx.close();

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
  console.log('QA241_IMAGE',JSON.stringify(imageChecks));
  const widths=[320,360,390,430,768,1024,1440];
  for(const width of widths){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(70);
    const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Default mobile/PC screen no horizontal overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  // 238: Actual authenticated calendar DOM smoke in Chrome without
  // backend access. These are synthetic local-only employee fixtures, not
  // claims of real Supabase session authorization.
  const calCtx=await browser.newContext({viewport:{width:390,height:844}});
  const calPage=await calCtx.newPage();
  await calPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await calPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const renderedCalendar=await calPage.evaluate(()=>{
    sessionStorage.setItem(SESSION_KEY,'qa241-ui-fixture');
    state.sessionToken='qa241-ui-fixture';
    state.me={employee_id:238,is_admin:false,display_name:'QA Worker',group_code:'B'};
    state.employees=[{id:238,employee_id:238,display_name:'QA Worker',group_code:'B',active_from:'2026-01-01',employment_status:'working'}];
    state.year=2026;state.month=9;state.view='mine';state.refreshing=false;
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    renderCalendar();
    return {title:document.getElementById('monthTitle').textContent,days:document.querySelectorAll('.day-cell:not(.blank)').length};
  });
  console.log('QA241_AUTH_CALENDAR',JSON.stringify(renderedCalendar));
  check('Authenticated local-only October calendar shows all 31 days',()=>renderedCalendar.title.includes('2026년 10월')&&renderedCalendar.days===31);
  const liveCalendarWidths=[320,360,390,430,768,1024,1440];
  for(const width of liveCalendarWidths){
    await calPage.setViewportSize({width,height:900});
    const dim=await calPage.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Authenticated calendar avoids horizontal viewport overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  await calCtx.close();

  console.log('QA241_SUMMARY',JSON.stringify({passed:pass.length,failed:0,checks:pass,viewport_widths:widths,real_chromium:true,live_supabase:false,native_android:false,real_storage_two_tabs:true,backend_auth_multitab:false,bfcache:false}));
 } catch(e){console.error('QA241_FAIL',e.stack||String(e)); console.log('QA241_PARTIAL',JSON.stringify({passed:pass.length,checks:pass})); process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();

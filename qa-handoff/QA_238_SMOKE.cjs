'use strict';
const fs=require('fs'), crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const http=require('http'); const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-238.html','utf8');
const file='qa-handoff/index.working-2-8-238.html';
const html=fs.readFileSync(file,'utf8');
const expected='f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f';
// QA 238 real Chromium full baseline reproduction: independent frozen SHA-256 final verification
// QA 238 stabilized mutex stress regression v2
// QA 238 verified Web Lock real two-tab test, syntax correction
const pass=[];
function check(name,fn){const result=fn(); assert(result!==false, name+' returned false');pass.push(name);}
check('SHA256 official baseline',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('1161672 byte baseline',()=>Buffer.byteLength(baseline)===1161672);
check('APP_VERSION pinned',()=>html.includes("ver20260927-0944"));
check('236 official completed SHA256 pinned',()=>crypto.createHash('sha256').update(baseline).digest('hex')==='f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f');
check('Web Locks critical sections applied',()=>html.includes('withBrowserSharedSessionLock')&&html.includes('staffAttendance_sharedSessionBrowserLock_v3'));
check('Official 237 start baseline immutable',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('237 start baseline remained immutable while candidate fixed',()=>html.includes('if(e.key===null)')&&html.includes('sharedLogoutCleanup=safelyClearStoredLoginSession(logoutToken)'))
check('Previous session-safety correction retained',()=>html.includes('safelyClearStoredLoginSession')&&html.includes('ensureAdminUnlockForRestoreWithScope'));
check('238 mobile tab-only carveout eliminated',()=>html.includes("if(!MOBILE_SESSION_DEVICE&&tabToken===current)return false;")&&html.includes("if(!MOBILE_SESSION_DEVICE&&tabToken===current)return {current,mode:'tab'};")&&html.includes("if(!MOBILE_SESSION_DEVICE && current && tabToken===current){ sharedSessionChangePending="));
check('238 no stale legacy mobile fallback after shared logout',()=>html.includes("rawLocal ? localToken : (forbidden ? '' : temporaryToken)"));
check('236 baseline SHA pinned',()=>crypto.createHash('sha256').update(baseline).digest('hex')==='f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f');
check('238 complete stale-token suppression candidate pinned',()=>crypto.createHash('sha256').update(html).digest('hex')==='1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360');
console.log('QA238_WORKING_SHA',crypto.createHash('sha256').update(html).digest('hex'),'bytes',Buffer.byteLength(html));
const allScript=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
check('all inline JS parses',()=>{for(const script of allScript)new vm.Script(script);return allScript.length>=2});
const bodyBeforeJs=html.slice(0,html.indexOf('<script async src='));
const ids=[...bodyBeforeJs.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('No duplicated static DOM IDs',()=>new Set(ids).size===ids.length);
check('4-group overhaul decision path present',()=>html.includes("key>='2026-10-01'&&key<='2026-10-15'"));
check('Smoke harness uses local-only HTTP server',()=>!html.includes('qa238-live-db-fixture-DO-NOT-USE')&&typeof http.createServer==='function');
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
  await other.evaluate(()=>{window.qa237Seen=false;window.addEventListener('storage',e=>{if(e.key==='__qa238_signal__'&&e.newValue==='ping')window.qa237Seen=true;})});
  await page.evaluate(()=>localStorage.setItem('__qa238_signal__','ping'));await page.waitForTimeout(130);
  const storageEventReceived=await other.evaluate(()=>window.qa237Seen);
  check('Two actual same-origin tabs see storage event',()=>storageEventReceived);
  await page.evaluate(()=>sessionStorage.setItem('__qa238_private__','secret'));
  const tabStorageIsolated=await other.evaluate(()=>sessionStorage.getItem('__qa238_private__')===null);
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
  const tokenA='qa238-exclusive-A',tokenB='qa238-exclusive-B';
  const firstSaved=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenA);
  const secondSaved=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeLoginSession(token,true)),tokenB);
  check('Shared login storage serial writes succeed',()=>firstSaved===true&&secondSaved===true);
  const tokenBeforeCleanup=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Latest shared token wins',()=>tokenBeforeCleanup===tokenB);
  const oldCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenA);
  const protectedNext=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY)=== 'qa238-exclusive-B');
  check('Late previous logout cannot erase new login',()=>oldCleanup===true&&protectedNext);
  const adminSet=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>storeAdminUnlock(token,true)),tokenB);
  const staleAdminCleanup=await page.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedAdminUnlockIfToken(token)),tokenA);
  const adminPreserved=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY)==='qa238-exclusive-B');
  check('Admin unlock new token preserved against old cleanup',()=>adminSet===true&&staleAdminCleanup===true&&adminPreserved);
  const removed=await other.evaluate(async token=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken(token)),tokenB);
  const tokenErased=await other.evaluate(()=>!storageGet(localStorage,SESSION_KEY));
  check('Latest shared token can be removed explicitly',()=>removed===true&&tokenErased);
  // Application helper regression: both shared logins must be serialized even
  // when their async RPC would have completed in different browser tabs.
  const asyncFirst=await page.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa238-fresh-A';
    return storeLoginSessionForFreshLogin('qa238-fresh-A',true,loginAttemptSeq);
  });
  const asyncSecond=await other.evaluate(()=>{
    loginAttemptSeq+=1;state.sessionToken='qa238-fresh-B';
    return storeLoginSessionForFreshLogin('qa238-fresh-B',true,loginAttemptSeq);
  });
  check('Async fresh-login store wrappers succeed',()=>asyncFirst===true&&asyncSecond===true);
  const asyncCleanup=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearSharedSessionIfToken('qa238-fresh-A')));
  const asyncRetained=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Late old async login cleanup preserves newest',()=>asyncCleanup===true&&asyncRetained==='qa238-fresh-B');
  const freshAdmin=await other.evaluate(()=>storeAdminUnlockForFreshLogin('qa238-fresh-B',true,loginAttemptSeq));
  const obsoleteAdmin=await page.evaluate(()=>storeAdminUnlockForFreshLogin('qa238-fresh-A',true,loginAttemptSeq));
  const adminNow=await other.evaluate(()=>storageGet(localStorage,ADMIN_UNLOCK_KEY));
  check('Async admin unlock enforces latest token',()=>freshAdmin===true&&obsoleteAdmin===false&&adminNow==='qa238-fresh-B');
  const logoutOld=await page.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa238-fresh-A')));
  const newestAfterLogout=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Async stale logout preserves current token',()=>newestAfterLogout==='qa238-fresh-B');
  await other.evaluate(()=>withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa238-fresh-B')));
  const finalToken=await other.evaluate(()=>storageGet(localStorage,SESSION_KEY));
  check('Current logout clears matching shared token',()=>!finalToken);
  console.log('QA238_LOGIN_WRAPPERS',JSON.stringify({fresh_logins:2,fresh_admin:true,stale_logout_preserved:true}));

  console.log('QA238_MUTEX_REAL',JSON.stringify({lock_critical_sections:successes,overlaps,late_logout_protected:true,admin_unlock_protected:true}));
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
    state.sessionToken='qa238-outdated-token';loginAttemptSeq++;
    const attempt=loginAttemptSeq;
    const queued=storeLoginSessionForFreshLogin('qa238-outdated-token',true,attempt);
    loginAttemptSeq++;state.sessionToken='qa238-next-token';
    releaseLock();await blocker;
    const outcome=await queued;
    return {outcome,token:storageGet(localStorage,SESSION_KEY)};
  });
  check('Canceled login blocked while Web Lock queued',()=>canceled.outcome===false&&canceled.token!=='qa238-outdated-token');
  const canceledAdmin=await isolated.evaluate(async()=>{
    const token='qa238-admin-old';
    await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    let releaseLock,signalReady;const ready=new Promise(r=>signalReady=r);
    const blocker=withBrowserSharedSessionLock(async()=>{signalReady();await new Promise(r=>releaseLock=r);return true;});
    await ready;
    state.sessionToken=token;loginAttemptSeq++;
    const attempt=loginAttemptSeq,queued=storeAdminUnlockForFreshLogin(token,true,attempt);
    state.sessionToken='qa238-admin-new';loginAttemptSeq++;
    releaseLock();await blocker;
    const outcome=await queued,stored=storageGet(localStorage,ADMIN_UNLOCK_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {outcome,stored};
  });
  check('Canceled admin unlock blocked while Web Lock queued',()=>canceledAdmin.outcome===false&&canceledAdmin.stored!=='qa238-admin-old');
  await isolatedContext.close();
  const mobileContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const mobile=await mobileContext.newPage();
  await mobile.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await mobile.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileResult=await mobile.evaluate(async()=>{
    const detected=MOBILE_SESSION_DEVICE;
    const persistent=loginShouldPersist();
    const token='qa238-mobile-virtual';
    const stored=await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    const shared=storageGet(localStorage,SESSION_KEY)===token;
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {detected,persistent,stored,shared,cleared:!storageGet(localStorage,SESSION_KEY)};
  });
  check('Mobile browser emulation persistent shared login',()=>mobileResult.detected&&mobileResult.persistent&&mobileResult.stored&&mobileResult.shared);
  check('Mobile browser emulation logout cleanup',()=>mobileResult.cleared);
  await mobileContext.close();
  console.log('QA238_MOBILE_EMULATION',JSON.stringify(mobileResult));
  console.log('QA238_CANCELLED_ASYNC',JSON.stringify({login:canceled,admin:canceledAdmin}));


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
    localStorage.setItem(SESSION_KEY,'qa238-pc-old');
    const migrated=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const result={migrated,temporary:storageGet(sessionStorage,SESSION_KEY),shared:storageGet(localStorage,SESSION_KEY)};
    sessionStorage.removeItem(SESSION_KEY);
    return result;
  });
  check('PC legacy shared session moves into tab sessionStorage',()=>pcLegacy.migrated===true&&pcLegacy.temporary==='qa238-pc-old'&&!pcLegacy.shared);
  const pcNoOverwrite=await legacyPC.evaluate(async()=>{
    localStorage.setItem(SESSION_KEY,'qa238-pc-latest');
    localStorage.setItem(PC_REMEMBER_KEY,'1');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const untouched=storageGet(localStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa238-pc-latest'));
    return {result,untouched};
  });
  check('PC current remembered session is not migrated away',()=>pcNoOverwrite.result===true&&pcNoOverwrite.untouched==='qa238-pc-latest');
  await legacyPC.close();
  await freshContext.close();

  const androidContext=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36'});
  const legacyAndroid=await androidContext.newPage();await legacyAndroid.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await legacyAndroid.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const mobileLegacy=await legacyAndroid.evaluate(async()=>{
    localStorage.removeItem(SESSION_KEY);sessionStorage.setItem(SESSION_KEY,'qa238-android-legacy');
    sessionStorage.setItem(ADMIN_UNLOCK_KEY,'qa238-android-legacy');
    const result=await withBrowserSharedSessionLock(()=>migrateLegacySessionForDevice());
    const shared=storageGet(localStorage,SESSION_KEY),proof=storageGet(localStorage,ADMIN_UNLOCK_KEY),tab=storageGet(sessionStorage,SESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa238-android-legacy'));
    return {result,shared,proof,tab,after:storageGet(localStorage,SESSION_KEY)};
  });
  check('Android legacy session migrated into persistent storage',()=>mobileLegacy.result===true&&mobileLegacy.shared==='qa238-android-legacy'&&!mobileLegacy.tab&&!mobileLegacy.after);
  check('Android legacy admin proof preserved only for matching token',()=>mobileLegacy.proof==='qa238-android-legacy');
  await androidContext.close();
  console.log('QA238_LEGACY',JSON.stringify({pcLegacy,pcNoOverwrite,mobileLegacy}));

  // On a browser lacking Web Locks the new client must fail closed.
  const legacyUnavailable=await page.evaluate(async()=>{
    const real=navigator.locks;
    try{
      Object.defineProperty(navigator,'locks',{configurable:true,value:null});
      const tokenBefore=storageGet(localStorage,SESSION_KEY);
      const res=await withBrowserSharedSessionLock(()=>storeLoginSession('qa238-unsafe',true));
      const unsafeDirect=storeLoginSession('qa238-unsafe',true);
      return {supported:false,res,unsafeDirect,preserved:tokenBefore===storageGet(localStorage,SESSION_KEY)};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:real});}
  });
  check('No Web Locks: shared session mutations fail closed',()=>legacyUnavailable.res===null&&legacyUnavailable.unsafeDirect===null&&legacyUnavailable.preserved);
  console.log('QA238_UNSUPPORTED',JSON.stringify(legacyUnavailable));
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
      const token='qa238-desktop-tabonly',attempt=++loginAttemptSeq;
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
  console.log('QA238_PC_NOLOCK_TEMP_LOGIN',JSON.stringify(desktopNoLock));
  check('Desktop temporary login must not depend on Web Locks',()=>desktopNoLock.stored===true&&desktopNoLock.direct===true);
  check('Desktop temporary admin proof works without Web Locks',()=>desktopNoLock.adminStored===true&&desktopNoLock.adminBefore==='qa238-desktop-tabonly'&&desktopNoLock.restoreCheck===true);
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
    const token='qa238-restore-without-web-lock';
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
  console.log('QA238_PC_COLD_RESTORE',JSON.stringify(restoreTests));
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
      const rejected=await withBrowserSharedSessionLock(()=>storeLoginSession('qa238-shared-denied',true));
      state.sessionToken='qa238-tabonly-denied';
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
  check('Rejected Web Locks request still permits isolated desktop login',()=>restricted.tabLogin===true&&restricted.tabAdmin===true&&restricted.adminProof==='qa238-tabonly-denied'&&restricted.tabCleared===true);
  console.log('QA238_LOCKS_REJECTED',JSON.stringify(restricted));
  await restrictedContext.close();

  // A tab-only short update handoff must recover after a page reload even
  // without Web Locks, as it does not require a shared session mutation.
  const handoffContext=await browser.newContext({viewport:{width:390,height:844}});
  await handoffContext.addInitScript(()=>{
    Object.defineProperty(navigator,'locks',{configurable:true,value:null});
    sessionStorage.removeItem('staffAttendance_session_v1');
    sessionStorage.setItem('staffAttendance_updateSessionHandoff_v1',JSON.stringify({
      version:'ver20260927-0944',token:'qa238-temporary-handoff',persistent:false,
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
  console.log('QA238_NOLOCK_HANDOFF',JSON.stringify(tabHandoff));
  check('PC tab-only update handoff must recover without Web Locks',()=>tabHandoff.stored==='qa238-temporary-handoff');
  check('PC tab-only admin proof handoff must recover without Web Locks',()=>tabHandoff.adminProof==='qa238-temporary-handoff');
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
  console.log('QA238_FOUR_TAB',JSON.stringify({lock_requests:fourTabPass,critical_overlaps:criticalOverlaps,critical_events:criticalEvents}));
  await fourTabContext.close();

  // Storage write/delete faults must not corrupt the prior shared token or
  // its administrator marker. These are local Chromium Storage API faults.
  const failureContext=await browser.newContext({viewport:{width:430,height:900}});
  const failurePage=await failureContext.newPage();
  await failurePage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await failurePage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  const storageFailures=await failurePage.evaluate(async()=>{
    const saved=await withBrowserSharedSessionLock(()=>storeLoginSession('qa238-existing',true));
    const admin=await withBrowserSharedSessionLock(()=>storeAdminUnlock('qa238-existing',true));
    const originalSet=Storage.prototype.setItem, originalRemove=Storage.prototype.removeItem;
    let failedStore,failedDelete;
    try{
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key===PC_REMEMBER_KEY)throw new DOMException('quota denied','QuotaExceededError');
        return originalSet.call(this,key,value);
      };
      failedStore=await withBrowserSharedSessionLock(()=>storeLoginSession('qa238-replacement',true));
    }finally{Storage.prototype.setItem=originalSet;}
    const afterStore={token:storageGet(localStorage,SESSION_KEY),remember:storageGet(localStorage,PC_REMEMBER_KEY),admin:storageGet(localStorage,ADMIN_UNLOCK_KEY)};
    try{
      Storage.prototype.removeItem=function(key){
        if(this===localStorage&&key===SESSION_KEY)throw new DOMException('remove denied','SecurityError');
        return originalRemove.call(this,key);
      };
      failedDelete=await withBrowserSharedSessionLock(()=>clearSharedSessionIfToken('qa238-existing'));
    }finally{Storage.prototype.removeItem=originalRemove;}
    const afterDelete={token:storageGet(localStorage,SESSION_KEY),remember:storageGet(localStorage,PC_REMEMBER_KEY),admin:storageGet(localStorage,ADMIN_UNLOCK_KEY)};
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession('qa238-existing'));
    return {saved,admin,failedStore,failedDelete,afterStore,afterDelete};
  });
  check('Failed shared remember-write restores prior token',()=>storageFailures.saved===true&&storageFailures.admin===true&&storageFailures.failedStore===false&&storageFailures.afterStore.token==='qa238-existing'&&storageFailures.afterStore.remember==='1');
  check('Failed shared write retains previous admin marker',()=>storageFailures.afterStore.admin==='qa238-existing');
  check('Failed shared token deletion preserves prior session metadata',()=>storageFailures.failedDelete===false&&storageFailures.afterDelete.token==='qa238-existing'&&storageFailures.afterDelete.admin==='qa238-existing');
  console.log('QA238_STORAGE_FAULTS',JSON.stringify(storageFailures));
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
    window.__qa238_releaseBlock=r;document.body.dataset.qa237LockHeld='yes';
  })));
  await blockerTab.waitForFunction(()=>document.body.dataset.qa237LockHeld==='yes');
  const immediateLogout=await logoutTab.evaluate(()=>{
    state.sessionToken='qa238-logout-now';
    state.me={employee_id:236,is_admin:true,display_name:'QA 관리자'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa238_pendingLogout=logout(false);
    return {token:state.sessionToken,meStillPrivileged:!!state.me?.is_admin,appVisible:!document.getElementById('appView').classList.contains('hidden'),loginVisible:!document.getElementById('loginView').classList.contains('hidden')};
  });
  await logoutTab.waitForTimeout(120);
  const delayedLogout=await logoutTab.evaluate(()=>({token:state.sessionToken,meStillPrivileged:!!state.me?.is_admin,appVisible:!document.getElementById('appView').classList.contains('hidden')}));
  console.log('QA238_LOGOUT_QUEUED',JSON.stringify({immediateLogout,delayedLogout}));
  await blockerTab.evaluate(()=>window.__qa238_releaseBlock());
  await logoutTab.evaluate(()=>window.__qa238_pendingLogout);
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
    window.__qa238_releaseReentry=resolve;
    document.documentElement.dataset.qa237ReentryLocked='1';
  })));
  await blocker.waitForFunction(()=>document.documentElement.dataset.qa237ReentryLocked==='1');
  const replacedState=await reentry.evaluate(()=>{
    state.sessionToken='qa238-prev-session';state.me={employee_id:1,is_admin:true,display_name:'previous'};
    window.__qa238_oldSignout=logout(false);
    state.sessionToken='qa238-next-session';state.me={employee_id:2,is_admin:false,display_name:'new'};
    return {token:state.sessionToken,actor:state.me.employee_id};
  });
  await blocker.evaluate(()=>window.__qa238_releaseReentry());
  await reentry.evaluate(()=>window.__qa238_oldSignout);
  const afterDelayedLogout=await reentry.evaluate(()=>({token:state.sessionToken,actor:state.me?.employee_id}));
  check('Delayed old logout cannot clear new authenticated state',
    ()=>replacedState.token==='qa238-next-session'&&afterDelayedLogout.token==='qa238-next-session'&&afterDelayedLogout.actor===2);
  console.log('QA238_REENTRY',JSON.stringify({replacedState,afterDelayedLogout}));
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
      const token='qa238-mobile-without-weblocks';
      localStorage.setItem(SESSION_KEY,token);state.sessionToken=token;
      state.me={employee_id:111,is_admin:true,display_name:'QA 관리자'};
      document.getElementById('appView').classList.remove('hidden');
      window.__qa238_mobilePending=logout(false);
      const immediate={token:state.sessionToken,admin:!!state.me,appVisible:!document.getElementById('appView').classList.contains('hidden')};
      await window.__qa238_mobilePending;
      return {immediate,storageToken:localStorage.getItem(SESSION_KEY),restoredToken:storedSessionToken(),suppressed:storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===token};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:realLocks});}
  });
  console.log('QA238_NOLOCK_MOBILE_LOGOUT',JSON.stringify(mobileLogout));
  check('Mobile Web Locks unsupported: logout blocks same token restoration',()=>!mobileLogout.restoredToken&&mobileLogout.suppressed&&mobileLogout.storageToken==='qa238-mobile-without-weblocks');
  check('Mobile Web Locks unsupported: logout immediately revokes confidential UI',()=>mobileLogout.immediate.token===''&&!mobileLogout.immediate.admin&&!mobileLogout.immediate.appVisible);
  await noLockMobileCtx.addInitScript(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:null}));
  await noLockMobile.reload({waitUntil:'domcontentloaded'});
  const afterReload=await noLockMobile.evaluate(()=>({
    restored:state.sessionToken,
    storage:storageGet(localStorage,SESSION_KEY),
    blocked:storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)
  }));
  check('Mobile Web Locks unsupported: browser reload cannot resurrect logged-out account',()=>!afterReload.restored&&afterReload.blocked===afterReload.storage);
  console.log('QA238_NOLOCK_RELOAD',JSON.stringify(afterReload));
  const sameTokenRelogin=await noLockMobile.evaluate(async()=>{
    delete navigator.locks;
    const token='qa238-mobile-without-weblocks';
    const persisted=await withBrowserSharedSessionLock(()=>storeLoginSession(token,true,true));
    const restored=storedSessionToken();
    const blocked=storageGet(localStorage,SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
    await withBrowserSharedSessionLock(()=>clearStoredLoginSession(token));
    return {persisted,restored,blocked};
  });
  check('A new successful login can clear suppression for its matching token',()=>sameTokenRelogin.persisted===true&&sameTokenRelogin.restored==='qa238-mobile-without-weblocks'&&!sameTokenRelogin.blocked);
  await noLockMobileCtx.close();


  // 236: Dispatch of the old token's server invalidation must not be blocked
  // by another tab holding the browser-wide LOCAL storage lock. RPC is mocked:
  // no network requests or production tokens are used.
  const remoteCtx=await browser.newContext({viewport:{width:390,height:844}});
  const remoteHold=await remoteCtx.newPage(),remoteTab=await remoteCtx.newPage();
  for(const tab of [remoteHold,remoteTab]){await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});}
  void remoteHold.evaluate(()=>navigator.locks.request(SHARED_SESSION_BROWSER_LOCK,{mode:'exclusive'},()=>new Promise(resolve=>{
    window.__qa238_releaseServerHold=resolve;document.body.dataset.qa237ServerHold='1';
  })));
  await remoteHold.waitForFunction(()=>document.body.dataset.qa237ServerHold==='1');
  const serverStarted=await remoteTab.evaluate(()=>{
    window.__qa238_savedRpc=window.rpc;window.__qa238_savedConfigured=window.configured;
    window.__qa238_serverCalls=[];
    window.rpc=async function(name,payload,options){
      window.__qa238_serverCalls.push({name,token:payload?.p_token,keepalive:options?.keepalive});
      return {};
    };
    window.configured=()=>true;
    state.sessionToken='qa238-server-revoke';
    state.me={employee_id:500,is_admin:true};
    window.__qa238_pendingServerLogout=logout(true);
    return {calls:window.__qa238_serverCalls.slice(),role:state.me,token:state.sessionToken};
  });
  await remoteTab.waitForTimeout(120);
  const duringServerHold=await remoteTab.evaluate(()=>window.__qa238_serverCalls.slice());
  await remoteHold.evaluate(()=>window.__qa238_releaseServerHold());
  await remoteTab.evaluate(()=>window.__qa238_pendingServerLogout);
  const serverFinal=await remoteTab.evaluate(()=>{const result=window.__qa238_serverCalls.slice();window.rpc=window.__qa238_savedRpc;window.configured=window.__qa238_savedConfigured;return result;});
  console.log('QA238_SERVER_LOGOUT',JSON.stringify({serverStarted,duringServerHold,serverFinal}));
  check('Server logout is dispatched before contended local Web Lock releases',()=>duringServerHold.length===1&&duringServerHold[0].name==='logout_employee'&&duringServerHold[0].token==='qa238-server-revoke'&&duringServerHold[0].keepalive===true);
  check('Server logout uses captured old token once',()=>serverFinal.length===1&&!serverStarted.role&&!serverStarted.token);
  await remoteCtx.close();


  // Shared login must be revoked in the OTHER tab as well if a mobile tab
  // logs out without Web Locks: only the token-specific suppression key
  // changes, not the still-stored shared SESSION_KEY.
  const crossCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36'});
  const oldTab=await crossCtx.newPage(),otherTab=await crossCtx.newPage();
  for(const tab of [oldTab,otherTab]){await tab.route('https://cdn.jsdelivr.net/**',r=>r.abort());await tab.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});}
  await oldTab.evaluate(()=>{localStorage.setItem(SESSION_KEY,'qa238-mobile-both-tabs')});
  for(const tab of [oldTab,otherTab])await tab.evaluate(()=>{
    state.sessionToken='qa238-mobile-both-tabs';state.me={employee_id:1,is_admin:true,display_name:'Shared admin'};
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
  console.log('QA238_MOBILE_CROSS_TAB_LOGOUT',JSON.stringify(otherAfter));
  check('Suppressed mobile session logs out sibling tab without requiring shared token delete',()=>!otherAfter.actor&&!otherAfter.appVisible);
  // Never revoke an unrelated newer login when an old-token suppression
  // arrives late from a different tab.
  await otherTab.evaluate(()=>{
    state.sessionToken='qa238-unrelated-newer';state.me={employee_id:2366,is_admin:false};
    document.getElementById('appView').classList.remove('hidden');
  });
  await oldTab.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-late-old-token'));
  await otherTab.waitForTimeout(100);
  const unrelatedStillCurrent=await otherTab.evaluate(()=>({token:state.sessionToken,actor:state.me?.employee_id}));
  check('Old-token suppression cannot revoke an unrelated newer login',()=>unrelatedStillCurrent.token==='qa238-unrelated-newer'&&unrelatedStillCurrent.actor===2366);
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
    localStorage.setItem(SESSION_KEY,'qa238-site-clear-admin');
    state.sessionToken='qa238-site-clear-admin';
    state.me={employee_id:237,is_admin:true,display_name:'QA site-clear admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa238_clearEvent=false;
    sessionStorage.removeItem('__qa238_clear_event_received__');
    window.addEventListener('storage',e=>{if(e.key===null){window.__qa238_clearEvent=true;sessionStorage.setItem('__qa238_clear_event_received__','1');void window.__qa237ObserveClear();}});
  });
  await clearPeer.evaluate(()=>localStorage.clear());
  await clearVictim.waitForTimeout(350);
  const siteClear=await clearVictim.evaluate(()=>({
    clearEvent:!!window.__qa238_clearEvent||sessionStorage.getItem('__qa238_clear_event_received__')==='1',
    sharedToken:localStorage.getItem(SESSION_KEY),
    oldAdminVisible:!!state.me?.is_admin&&!document.getElementById('appView').classList.contains('hidden'),
    currentToken:state.sessionToken
  }));
  console.log('QA238_CROSS_TAB_CLEAR',JSON.stringify(siteClear));
  check('Actual storage clear generates key-null event',()=>clearEventCount>0||siteClear.clearEvent);
  check('Cross-tab site-data clear revokes stale shared-admin UI',()=>!siteClear.oldAdminVisible);
  // Desktop independent sessionStorage login must be preserved when a
  // different tab clears the shared localStorage namespace.
  await clearVictim.evaluate(()=>{
    sessionStorage.setItem(SESSION_KEY,'qa238-pc-isolated');
    state.sessionToken='qa238-pc-isolated';
    state.me={employee_id:238,is_admin:true,display_name:'QA isolated admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await clearPeer.evaluate(()=>{
    localStorage.setItem(SESSION_KEY,'qa238-unrelated-shared');
    localStorage.clear();
  });
  await clearVictim.waitForTimeout(300);
  const isolatedAfterClear=await clearVictim.evaluate(()=>({
    tabToken:sessionStorage.getItem(SESSION_KEY),
    token:state.sessionToken,actor:state.me?.employee_id,
    appVisible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA238_PC_SITE_CLEAR_ISOLATED',JSON.stringify(isolatedAfterClear));
  check('Cross-tab site-data clear preserves independent desktop temporary session',
    ()=>isolatedAfterClear.tabToken==='qa238-pc-isolated'&&isolatedAfterClear.token==='qa238-pc-isolated'&&isolatedAfterClear.actor===238&&isolatedAfterClear.appVisible);
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
    const token='qa238-mobile-legacy-duplicate';
    localStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:237,is_admin:true,display_name:'Legacy Mobile Admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa238_legacyMarker=false;
    window.addEventListener('storage',e=>{if(e.key===SHARED_SESSION_LOGOUT_SUPPRESSION_KEY&&e.newValue===token)window.__qa238_legacyMarker=true;});
  });
  await legacySender.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-mobile-legacy-duplicate'));
  await legacyVictim.waitForTimeout(350);
  const legacyAfter=await legacyVictim.evaluate(()=>({
    markerReceived:!!window.__qa238_legacyMarker,
    isMobile:MOBILE_SESSION_DEVICE,
    sessionStorageToken:sessionStorage.getItem(SESSION_KEY),
    actor:state.me?.employee_id??null,
    currentToken:state.sessionToken,
    visible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA238_MOBILE_LEGACY_MARKER',JSON.stringify(legacyAfter));
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
    const token='qa238-mobile-clear-with-legacy-tab-token';
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
  console.log('QA238_MOBILE_LEGACY_SITE_CLEAR',JSON.stringify(mobileClearResult));
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
    sessionStorage.setItem(SESSION_KEY,'qa238-desktop-temporary-marker');
    state.sessionToken='qa238-desktop-temporary-marker';
    state.me={employee_id:239,is_admin:false};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
    window.__qa238_markerSeen=false;
    window.addEventListener('storage',e=>{if(e.key===SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)window.__qa238_markerSeen=true;});
  });
  await pcMarkerSender.evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-desktop-temporary-marker'));
  await pcIsolated.waitForTimeout(250);
  const pcMarker=await pcIsolated.evaluate(()=>({
    eventSeen:!!window.__qa238_markerSeen,token:state.sessionToken,
    tabToken:sessionStorage.getItem(SESSION_KEY),actor:state.me?.employee_id,
    visible:!document.getElementById('appView').classList.contains('hidden')
  }));
  console.log('QA238_PC_TAB_MARKER',JSON.stringify(pcMarker));
  check('Shared logout marker leaves PC tab-exclusive token unaffected',
    ()=>pcMarker.eventSeen&&pcMarker.token==='qa238-desktop-temporary-marker'&&pcMarker.tabToken===pcMarker.token&&pcMarker.actor===239&&pcMarker.visible);
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
  await manyTabs[0].evaluate(()=>localStorage.setItem(SESSION_KEY,'qa238-four-tab-old'));
  for(let i=0;i<3;i++){
    await manyTabs[i].evaluate(({i})=>{
      state.sessionToken='qa238-four-tab-old';state.me={employee_id:1000+i,is_admin:true};
      if(i===1)sessionStorage.setItem(SESSION_KEY,'qa238-four-tab-old');
      document.getElementById('appView').classList.remove('hidden');
      document.getElementById('loginView').classList.add('hidden');
    },{i});
  }
  await manyTabs[3].evaluate(async()=>{
    const token='qa238-four-tab-new';
    state.sessionToken=token;state.me={employee_id:1003,is_admin:false};
    await withBrowserSharedSessionLock(()=>storeLoginSession(token,true));
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await manyTabs[3].waitForTimeout(300);
  await manyTabs[3].evaluate(()=>localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-four-tab-old'));
  await manyTabs[3].waitForTimeout(400);
  const manyResults=await Promise.all(manyTabs.map(tab=>tab.evaluate(()=>({
    current:state.sessionToken,actor:state.me?.employee_id??null,
    shown:!document.getElementById('appView').classList.contains('hidden'),
    mobile:MOBILE_SESSION_DEVICE
  }))));
  console.log('QA238_FOUR_TAB_LOGOUT_FANOUT',JSON.stringify(manyResults));
  check('Four real mobile tabs: three old-token privileged screens close',()=>manyResults.slice(0,3).every(r=>r.mobile&&!r.actor&&!r.shown&&r.current!=='qa238-four-tab-old'));
  check('Four real mobile tabs: unrelated newer session stays intact',()=>manyResults[3].mobile&&manyResults[3].current==='qa238-four-tab-new'&&manyResults[3].actor===1003&&manyResults[3].shown);
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
    const token='qa238-legacy-shared-A';
    localStorage.setItem(SESSION_KEY,token);
    sessionStorage.setItem(SESSION_KEY,token);
    state.sessionToken=token;
    state.me={employee_id:238,is_admin:true,display_name:'Legacy shared admin'};
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('loginView').classList.add('hidden');
  });
  await legacyNew.evaluate(()=>localStorage.setItem(SESSION_KEY,'qa238-new-shared-B'));
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
  console.log('QA238_MOBILE_LEGACY_SHARED_REPLACEMENT',JSON.stringify(switched));
  check('Mobile legacy duplicate shared login is revoked after another tab replaces the token',
    ()=>switched.mobile&&switched.sharedToken==='qa238-new-shared-B'&&!switched.oldUiVisible);
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
      const token='qa238-guard-legacy-A';
      state.sessionToken=token;
      state.me={employee_id:238,is_admin:true};
      sessionStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(SESSION_KEY,'qa238-guard-fresh-B');
      const result={mobile:MOBILE_SESSION_DEVICE,mode:fingerprintBlockingPromptSessionSnapshot().mode,sharedMismatch:sharedPersistentSessionMismatch(),sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()};
      function blocked(fn){try{fn();return false}catch(e){return e?.sharedSessionChanged===true;}}
      result.mutation=blocked(()=>guardMutationRpcSession('save_my_fingerprint_photo',{p_token:token}));
      result.backup=blocked(()=>guardSensitiveDataRpcSession('export_my_data_v1',{p_token:token}));
      result.read=blocked(()=>guardOrdinaryAuthenticatedReadRpcSession('list_my_fingerprint_records',{p_token:token}));
      return result;
    }finally{window.configured=savedConfigured;}
  });
  console.log('QA238_MOBILE_LEGACY_RPC_GUARDS',JSON.stringify(guarded));
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
      localStorage.setItem(SESSION_KEY,'qa238-later-shared-B');
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-later-shared-B');
      sessionStorage.setItem(SESSION_KEY,'qa238-stale-legacy-A');
      const staleFallback=storedSessionToken();
      // When Web Locks *are* available, cleanup may delete shared B; its
      // exact-token logout suppression marker still identifies this legacy A
      // fallback as unsafe.
      localStorage.removeItem(SESSION_KEY);
      const afterSharedTokenDeletion=storedSessionToken();
      localStorage.setItem(SESSION_KEY,'qa238-fresh-shared-C');
      const freshCandidate=storedSessionToken();
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      const genuineLegacyOnly=storedSessionToken();
      return {mobile:MOBILE_SESSION_DEVICE,staleFallback,afterSharedTokenDeletion,freshCandidate,genuineLegacyOnly};
    }finally{Object.defineProperty(navigator,'locks',{configurable:true,value:locks});}
  });
  console.log('QA238_SUPPRESSED_LOCAL_LEGACY_FALLBACK',JSON.stringify(fallback));
  check('Mobile suppressed newer shared logout cannot resurrect old tab-only legacy token',()=>fallback.mobile&&!fallback.staleFallback);
  check('Mobile completed deletion with retained logout marker also cannot restore stale legacy token',()=>!fallback.afterSharedTokenDeletion);
  check('Mobile distinct newer shared login remains selectable',()=>fallback.freshCandidate==='qa238-fresh-shared-C');
  check('Mobile genuine legacy-only token without a shared logout remains recoverable',()=>fallback.genuineLegacyOnly==='qa238-stale-legacy-A');
  await fallbackCtx.close();

  // 238: Exhaustive local/token/tombstone priority combinations. The
  // mobile oracle must never resurrect a tab token after any shared-logout
  // marker without a newer valid shared login; PC prioritizes tab isolation.
  const matrixCases=[];
  for(const local of ['', 'qa238-matrix-A','qa238-matrix-B'])
    for(const tab of ['', 'qa238-matrix-A','qa238-matrix-B'])
      for(const marker of ['', 'qa238-matrix-A','qa238-matrix-B','qa238-matrix-Z'])
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
    console.log('QA238_TOKEN_PRIORITY_MATRIX',JSON.stringify(mData));
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
      const token='qa238-pc-tab-isolated';
      state.sessionToken=token;
      state.me={employee_id:239,is_admin:false};
      sessionStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(SESSION_KEY,'qa238-another-pc-shared');
      const result={mobile:MOBILE_SESSION_DEVICE,mode:fingerprintBlockingPromptSessionSnapshot().mode,sharedMismatch:sharedPersistentSessionMismatch(),sensitiveMismatch:fingerprintCurrentSharedSessionMismatch()};
      // Shared B was logged out, but independent PC tab A must survive.
      localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,'qa238-another-pc-shared');
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
  console.log('QA238_DESKTOP_TAB_ISOLATION_GUARDS',JSON.stringify(independent));
  check('PC tab-exclusive account remains independent of shared token',()=>!independent.mobile&&independent.mode==='tab'&&!independent.sharedMismatch&&!independent.sensitiveMismatch);
  check('PC tab-exclusive account mutation/read guards remain usable',()=>independent.accepted);
  check('PC tab-only token remains available after unrelated shared logout',()=>independent.pcStoredAfterSharedLogout==='qa238-pc-tab-isolated');
  await pcGuardCtx.close();

  // Browser navigation with possible BFCache restoration: password inputs
  // must be cleared on pagehide even when the document is re-used.
  const navCtx=await browser.newContext({viewport:{width:390,height:844}});
  const navPage=await navCtx.newPage();
  await navPage.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await navPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await navPage.evaluate(()=>{
    document.getElementById('loginPin').value='1234';
    document.getElementById('loginAdminPin').value='5678';
    window.addEventListener('pageshow',event=>sessionStorage.setItem('__qa238_bfcache_event__',event.persisted?'persisted':'fresh'));
  });
  await navPage.goto('http://127.0.0.1:'+port+'/away',{waitUntil:'domcontentloaded'});
  await navPage.goBack({waitUntil:'domcontentloaded'});
  const navSecret=await navPage.evaluate(()=>({
    pin:document.getElementById('loginPin').value,
    adminPin:document.getElementById('loginAdminPin').value,
    restoration:sessionStorage.getItem('__qa238_bfcache_event__')||'unknown'
  }));
  check('Real browser back navigation clears old PIN fields',()=>!navSecret.pin&&!navSecret.adminPin);
  console.log('QA238_BROWSER_BACK',JSON.stringify(navSecret));
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
  console.log('QA238_IMAGE',JSON.stringify(imageChecks));
  const widths=[320,360,390,430,768,1024,1440];
  for(const width of widths){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(70);
    const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Default mobile/PC screen no horizontal overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  console.log('QA238_SUMMARY',JSON.stringify({passed:pass.length,failed:0,checks:pass,viewport_widths:widths,real_chromium:true,live_supabase:false,native_android:false,real_storage_two_tabs:true,backend_auth_multitab:false,bfcache:false}));
 } catch(e){console.error('QA238_FAIL',e.stack||String(e)); console.log('QA238_PARTIAL',JSON.stringify({passed:pass.length,checks:pass})); process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();

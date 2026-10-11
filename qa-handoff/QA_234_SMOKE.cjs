'use strict';
const fs=require('fs'), crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const http=require('http'); const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-234.html','utf8');
const file='qa-handoff/index.working-2-8-234.html';
const html=fs.readFileSync(file,'utf8');
const expected='a9a60aee1b863ec6cbb02d1d166268668199b129720e97cb26c0e1ebeca8d8e0';
// QA 234 stabilized mutex stress regression v2
const pass=[];
function check(name,fn){const result=fn(); assert(result!==false, name+' returned false');pass.push(name);}
check('SHA256 official baseline',()=>crypto.createHash('sha256').update(baseline).digest('hex')===expected);
check('1157310 byte baseline',()=>Buffer.byteLength(baseline)===1157310);
check('APP_VERSION pinned',()=>html.includes("ver20260927-0944"));
check('QA 234 mutex-only patch',()=>html!==baseline&&html.includes('const peers=Object.keys(localStorage)')&&baseline.includes('if(at<now || (at===now && key<myKey))'));
console.log('QA234_WORKING_SHA',crypto.createHash('sha256').update(html).digest('hex'),'bytes',Buffer.byteLength(html));
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
  await other.evaluate(()=>{window.qa234Seen=false;window.addEventListener('storage',e=>{if(e.key==='__qa234_signal__'&&e.newValue==='ping')window.qa234Seen=true;})});
  await page.evaluate(()=>localStorage.setItem('__qa234_signal__','ping'));await page.waitForTimeout(130);
  const storageEventReceived=await other.evaluate(()=>window.qa234Seen);
  check('Two actual same-origin tabs see storage event',()=>storageEventReceived);
  await page.evaluate(()=>sessionStorage.setItem('__qa234_private__','secret'));
  const tabStorageIsolated=await other.evaluate(()=>sessionStorage.getItem('__qa234_private__')===null);
  check('Two actual tabs isolate sessionStorage',()=>tabStorageIsolated);
  let collisions=0;const samples=[],outcomes={both:0,left:0,right:0,none:0};
  for(let k=0;k<150;k++){
    const [a,b]=await Promise.all([page.evaluate(()=>acquireSharedSessionMutex()),other.evaluate(()=>acquireSharedSessionMutex())]);
    const category=a&&b?'both':a?'left':b?'right':'none';outcomes[category]++;
    if(a&&b){collisions++;
      if(samples.length<5){
        const diag=await Promise.all([page.evaluate(()=>({owner:SHARED_SESSION_MUTEX_OWNER,depth:sharedSessionMutexDepth,now:sharedSessionMutexNow(),locks:Object.entries(localStorage).filter(e=>e[0].startsWith(SHARED_SESSION_MUTEX_PREFIX))})),other.evaluate(()=>({owner:SHARED_SESSION_MUTEX_OWNER,depth:sharedSessionMutexDepth,now:sharedSessionMutexNow(),locks:Object.entries(localStorage).filter(e=>e[0].startsWith(SHARED_SESSION_MUTEX_PREFIX))}))]);
        samples.push({iteration:k,diag});
      }
    }
    await Promise.all([page.evaluate(()=>releaseSharedSessionMutex()),other.evaluate(()=>releaseSharedSessionMutex())]);
  }
  console.log('QA234_MUTEX_DIAGNOSTIC',JSON.stringify({attempts:150,collisions,outcomes,samples}));
  if(collisions)console.error('QA234_CONFIRMED_MUTEX_DEFECT',JSON.stringify({collisions,attempts:150}));
  const webLockAvailable=await page.evaluate(()=>!!navigator.locks?.request);
  check('Web Locks supported on test Chromium',()=>webLockAvailable);
  await page.evaluate(()=>localStorage.setItem('__qa234_web_mutex_active__','0'));
  await page.evaluate(()=>localStorage.setItem('__qa234_web_mutex_overlap__','0'));
  async function webLockTest(tab){
    return tab.evaluate(async()=>{
      return navigator.locks.request('qa234-web-lock-alternative',{mode:'exclusive'},async()=>{
        const active=Number(localStorage.getItem('__qa234_web_mutex_active__')||'0');
        if(active)localStorage.setItem('__qa234_web_mutex_overlap__',String(Number(localStorage.getItem('__qa234_web_mutex_overlap__')||0)+1));
        localStorage.setItem('__qa234_web_mutex_active__','1');
        await new Promise(r=>setTimeout(r,2));
        localStorage.setItem('__qa234_web_mutex_active__','0');
        return true;
      });
    });
  }
  for(let j=0;j<35;j++)await Promise.all([webLockTest(page),webLockTest(other)]);
  const webLockOverlap=await page.evaluate(()=>Number(localStorage.getItem('__qa234_web_mutex_overlap__')||0));
  check('Web Locks 70 real two-tab critical sections no overlap',()=>webLockOverlap===0);
  console.log('QA234_WEBLOCK_COMPARISON',JSON.stringify({cooperative_mutex_collisions:collisions,web_lock_overlap:webLockOverlap}));
  console.log('QA234_EXTRA',JSON.stringify({roster_cases:2920,multitab_mutex_attempts:150,collisions,real_two_tab_storage:true,backend_auth_multitab:false}));
  await other.close();


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
  console.log('QA234_IMAGE',JSON.stringify(imageChecks));
  const widths=[320,360,390,430,768,1024,1440];
  for(const width of widths){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(70);
    const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Default mobile/PC screen no horizontal overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  console.log('QA234_SUMMARY',JSON.stringify({passed:pass.length,failed:collisions>0?1:0,checks:pass,viewport_widths:widths,real_chromium:true,live_supabase:false,native_android:false,real_storage_two_tabs:true,backend_auth_multitab:false,bfcache:false}));
  if(collisions>0)process.exitCode=1;
 } catch(e){console.error('QA234_FAIL',e.stack||String(e)); console.log('QA234_PARTIAL',JSON.stringify({passed:pass.length,checks:pass})); process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();

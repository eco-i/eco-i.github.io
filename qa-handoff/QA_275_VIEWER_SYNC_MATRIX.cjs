'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-275.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('275 source SHA mismatched official 274 handoff');
(async()=>{
let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const timezone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
 const cx=await browser.newContext({timezoneId:timezone,viewport:{width:mobile?390:1280,height:mobile?850:900},isMobile:mobile,hasTouch:mobile});
 try{
 const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
 const x=await page.evaluate(()=>{
  let pass=0,fail=0,issues=[];
  const ck=(name,yes)=>{if(yes)pass++;else{fail++;if(issues.length<25)issues.push(name)}};
  const viewer=document.getElementById('fingerprintPhotoBackdrop'),img=document.getElementById('fingerprintViewerImg');
  const originalDate=state.selectedDate,originalMe=state.me,originalRows=state.fingerprintRecords,originalCtx=fingerprintViewerContext;
  ck('actual image modal available',!!viewer&&!!img);
  const ta='2026-10-15T14:59:59.123456Z',tz='2026-10-15T23:59:59.123456+09:00',tm='2026-10-15T14:59:59.123457Z';
  const row=(date,clockIn=ta,clockOut=ta)=>({record_date:date,has_clock_in:clockIn!==null,has_clock_out:clockOut!==null,clock_in_uploaded_at:clockIn,clock_out_uploaded_at:clockOut,confirmed:true,confirmed_at:ta,updated_at:ta});
  const scenarios=['same','equivalent-zone','other-photo-changed','confirmed-flip','uploaded-changed-micro','photo-removed','date-deleted','actor-switched','kind-removed','no-viewer-context'];
  const run=(date,kind,variant)=>{
    state.me={employee_id:275,display_name:'QA275'};
    state.selectedDate=date;
    const otherDate='2026-12-31',current=row(date),other=row(otherDate);
    state.fingerprintRecords=[other,current];
    viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');
    fingerprintViewerContext={employeeId:275,key:date,kind,uploadedAt:ta};
    img.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const label=date+' '+kind+' '+variant;
    if(variant==='equivalent-zone')current[kind+'_uploaded_at']=tz;
    if(variant==='other-photo-changed')current[(kind==='clock_in'?'clock_out':'clock_in')+'_uploaded_at']=tm;
    if(variant==='confirmed-flip')current.confirmed=false;
    if(variant==='uploaded-changed-micro')current[kind+'_uploaded_at']=tm;
    if(variant==='photo-removed'){current['has_'+kind]=false;current[kind+'_uploaded_at']=null}
    if(variant==='date-deleted')state.fingerprintRecords=[other];
    if(variant==='actor-switched')state.me.employee_id=999;
    if(variant==='kind-removed'){current['has_'+kind]=false;current[kind+'_uploaded_at']=ta}
    if(variant==='no-viewer-context')fingerprintViewerContext=null;
    const keeps=['same','equivalent-zone','other-photo-changed','confirmed-flip','no-viewer-context'].includes(variant);
    try{reconcileFingerprintViewerAfterSync();}catch(e){ck(label+' no exception',false);return;}
    const open=viewer.classList.contains('open');
    ck(label+' keep/close actual modal',open===keeps);
    ck(label+' viewer context lifecycle',keeps?(variant==='no-viewer-context'||fingerprintViewerContext!==null):fingerprintViewerContext===null);
    if(!keeps)ck(label+' src scrubbed',!img.hasAttribute('src'));
    ck(label+' unrelated date unchanged',state.fingerprintRecords[0]===other);
    if(open){viewer.classList.remove('open');clearFingerprintPhotoEphemera();}
  };
  try{
   for(let day=1;day<=25;day++){
    const date='2026-10-'+String(day).padStart(2,'0');
    for(const kind of ['clock_in','clock_out'])for(const variant of scenarios)run(date,kind,variant);
   }
   ck('microsecond canonical offset equality',fingerprintTimestampEqual(ta,tz));
   ck('microsecond distinct instant inequality',!fingerprintTimestampEqual(ta,tm));
  }finally{
   viewer.classList.remove('open');clearFingerprintPhotoEphemera();
   state.selectedDate=originalDate;state.me=originalMe;state.fingerprintRecords=originalRows;fingerprintViewerContext=originalCtx;
  }
  return {pass,fail,issues};
 });
 pass+=x.pass;fail+=x.fail+errors.length;contexts++;
 if(x.fail||errors.length)issues.push({timezone,mobile,issues:x.issues,errors:errors.slice(0,4)});
 }catch(e){fail++;issues.push({timezone,mobile,error:String(e.stack||e).slice(0,1800)})}
 finally{await cx.close()}
}
}catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1800)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA275_VIEWER_SYNC_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();

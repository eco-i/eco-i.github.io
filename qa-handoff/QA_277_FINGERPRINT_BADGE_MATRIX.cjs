'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-277.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('277 immutable baseline SHA mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try {
  server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try {
    const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
    const result=await page.evaluate(()=>{
     let pass=0,fail=0,issues=[];const ck=(label,yes)=>{if(yes)pass++;else{fail++;if(issues.length<30)issues.push(label)}};
     const orig=state.fingerprintRecords;
     const iso=d=>d.toISOString().slice(0,10),stamp='2026-10-16T12:00:00Z';
     const make=(date,hasIn,hasOut,confirmed)=>({record_date:date,has_clock_in:hasIn,has_clock_out:hasOut,confirmed,clock_in_uploaded_at:hasIn?stamp:null,clock_out_uploaded_at:hasOut?stamp:null,confirmed_at:confirmed?stamp:null,updated_at:stamp});
     const specs=[{tag:'none',inp:0,out:0,confirmed:false,kind:'empty'},{tag:'in',inp:1,out:0,confirmed:false,kind:'single'},{tag:'out',inp:0,out:1,confirmed:false,kind:'single'},{tag:'both-unconfirmed',inp:1,out:1,confirmed:false,kind:'double'},{tag:'both-confirmed',inp:1,out:1,confirmed:true,kind:'check'},{tag:'confirm-with-one',inp:1,out:0,confirmed:true,kind:'single'}];
     const div=document.createElement('div');
     try {
      for(let year=2026;year<=2027;year++)for(let month=1;month<=12;month++){
       const days=new Date(Date.UTC(year,month,0)).getUTCDate();
       for(let day=1;day<=days;day++){
        const date=iso(new Date(Date.UTC(year,month-1,day))),adjacent=iso(new Date(Date.UTC(year,month-1,day+1)));
        const filler=make(adjacent,true,true,true);
        for(const spec of specs){
         const label=date+' '+spec.tag;
         state.fingerprintRecords=[filler,make(date,!!spec.inp,!!spec.out,spec.confirmed)];
         const before=JSON.stringify(state.fingerprintRecords);
         const result=fingerprintCalendarMarkup(date);
         ck(label+' no mutation',JSON.stringify(state.fingerprintRecords)===before);
         ck(label+' no date html injected',!result.includes(date)&&!result.includes('<script'));
         const expected=spec.kind==='empty'?'':spec.kind==='single'?'📷':spec.kind==='double'?'📷📷':'✓지문';
         const marked=spec.kind==='empty'?result==='':result.includes('class="fingerprint-day-mark '+(spec.kind==='check'?'confirmed':'photos')+'"');
         ck(label+' correct CSS state',marked);
         div.innerHTML=result;
         ck(label+' exact visible summary',div.textContent===expected);
         const badge=div.querySelector('.fingerprint-day-mark');
         ck(label+' exact element count',badge?(div.children.length===1&&badge.tagName==='SPAN'):div.children.length===0);
         if(spec.kind!=='empty'){
          ck(label+' screen reader accessibility',badge?.getAttribute('aria-label')===(spec.kind==='check'?'출퇴근 지문 확인 완료':'지문 기록 사진 '+(spec.kind==='double'?2:1)+'장'));
         }
         ck(label+' untouched adjacent date remains confirmed',fingerprintCalendarMarkup(adjacent).includes('✓지문'));
         ck(label+' photo count independent',fingerprintPhotoCount(state.fingerprintRecords[1])===spec.inp+spec.out);
        }
       }
      }
      state.fingerprintRecords=[make('2026-10-16',true,false,false)];
      ck('out-of-range missed key no badge',fingerprintCalendarMarkup('2026-10-17')==='');
      ck('prototype key never renders badge',fingerprintCalendarMarkup('__proto__')==='');
      ck('malicious key never renders markup',fingerprintCalendarMarkup('<img src=x onerror=alert(1)>')==='');
      ck('app version immutable',APP_VERSION==='ver20260927-0944');
     }finally{state.fingerprintRecords=orig;div.remove()}
     return {pass,fail,issues};
    });
    pass+=result.pass;fail+=result.fail+errors.length;contexts++;
    if(result.fail||errors.length)issues.push({zone,mobile,details:result.issues,errors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1700)})}finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1700)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA277_FINGERPRINT_BADGE_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

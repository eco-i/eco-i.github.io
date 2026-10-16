'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-279.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA279 official source SHA mismatch');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
  const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  try{
   const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
   const o=await page.evaluate(()=>{
     let pass=0,fail=0,issues=[];const ck=(name,ok)=>{if(ok)pass++;else{fail++;if(issues.length<35)issues.push(name)}};
     const one=86400000,date=s=>Date.parse(s+'T00:00:00Z'),iso=n=>new Date(n).toISOString().slice(0,10);
     const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(date(s))&&iso(date(s))===s;
     const norm=periods=>{
       const days=new Set();
       for(const p of periods){
         if(!valid(p.start_date)||!valid(p.end_date)||p.end_date<p.start_date)continue;
         for(let d=date(p.start_date);d<=date(p.end_date);d+=one)days.add(iso(d));
       }
       return days;
     };
     const scenarios=[
      [],
      [{start_date:'2023-12-28',end_date:'2024-03-05',reason:'pre-hire'}],
      [{start_date:'2024-02-29',end_date:'2024-02-29',reason:'hire-day'}],
      [{start_date:'2025-12-30',end_date:'2026-01-01',reason:'cross-year'}],
      [{start_date:'2026-02-27',end_date:'2026-03-03',reason:'nonleap'}],
      [{start_date:'2026-10-01',end_date:'2026-10-15'},{start_date:'2026-10-05',end_date:'2026-10-20'},{start_date:'2026-10-21',end_date:'2026-10-25'}],
      [{start_date:'2026-12-30',end_date:'2027-01-04'},{start_date:'2027-02-01',end_date:'2027-02-12'}],
      [{start_date:'2026-03-01',end_date:'2026-03-31'},{start_date:'2026-01-01',end_date:'2026-03-30'},{start_date:'2026-02-01',end_date:'2026-02-28'}],
      [{start_date:'2025-04-01',end_date:'2025-04-30'},{start_date:'2026-04-01',end_date:'2026-04-30'},{start_date:'2027-04-01',end_date:'2027-04-30'}],
      [{start_date:'2026-02-30',end_date:'2026-03-02'},{start_date:'2026-01-30',end_date:'2026-01-01'},{start_date:'2027-02-01',end_date:'2027-02-01',reason:'valid'}],
      [{start_date:'2026-01-01',end_date:'2026-12-31'},{start_date:'2027-01-01',end_date:'2027-12-31'}],
      [{start_date:'2023-01-01',end_date:'2029-01-01'}]
     ];
     const hireDates=['2024-02-29','2025-01-01','2026-01-01'],start=date('2026-01-01'),targets=[];
     for(let i=0;i<730;i++)targets.push(iso(start+i*one));
     ck('app version stable',APP_VERSION==='ver20260927-0944');
     for(let si=0;si<scenarios.length;si++){
       const periods=scenarios[si],original=JSON.stringify(periods),covered=norm(periods);
       const merged=lsNormalizeExclusions(periods).merged;
       const mergedSet=norm(merged);
       ck('scenario '+si+' merged equals independent union',covered.size===mergedSet.size&&[...covered].every(k=>mergedSet.has(k)));
       ck('scenario '+si+' merged sorted disjoint',merged.every((p,i)=>i===0||date(merged[i-1].end_date)+one<date(p.start_date)));
       ck('scenario '+si+' normalization nonmutating',JSON.stringify(periods)===original);
       for(const hire of hireDates){
         const beforeTargetDays=new Map(),prefix=new Map();let counter=0;
         for(const target of targets){
           if(target>=hire&&covered.has(target))counter++;
           prefix.set(target,counter);
         }
         const prior=[...covered].filter(d=>d<hire);
         for(let i=0;i<targets.length;i++){
           const target=targets[i],beforeHire=target<hire,oracle=beforeHire?0:prefix.get(target);
           const tag='scenario='+si+' hire='+hire+' target='+target;
           const actual=lsExcludedDaysUntil(hire,target,periods);
           ck(tag+' inclusive clipped union count',actual===oracle);
           const recognized=lsRecognizedTargetISO(hire,target,periods),expected=iso(date(target)-oracle*one);
           ck(tag+' recognized target independent date difference',recognized===expected);
           ck(tag+' recognized date no later than target',recognized<=target);
           ck(tag+' no data mutated after calculation',JSON.stringify(periods)===original);
           if(i%31===0){
             const check=lsNormalizeExclusions([...periods].reverse()).merged;
             ck(tag+' exclusion ordering invariant',JSON.stringify(check)===JSON.stringify(merged));
           }
         }
         ck('scenario '+si+' hire '+hire+' target ordinal complete',targets.length===730);
       }
     }
     ck('negative invalid hire 2026-02-30',lsExcludedDaysUntil('2026-02-30','2027-01-01',scenarios[3])===0);
     ck('negative date before hire',lsExcludedDaysUntil('2027-01-01','2026-12-31',scenarios[6])===0);
     return {pass,fail,issues,scenarios:scenarios.length,days:targets.length,hires:hireDates.length};
   });
   pass+=o.pass;fail+=o.fail+errors.length;contexts++;
   if(o.fail||errors.length)issues.push({tz,mobile,issues:o.issues,errors:errors.slice(0,4)});
  }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1600)})}finally{await cx.close()}
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1900)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA279_LONGSERVICE_EXCLUSION_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();

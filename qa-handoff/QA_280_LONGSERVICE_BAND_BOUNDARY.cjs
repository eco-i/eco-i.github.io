'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-280.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('280 official baseline digest mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
 const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
 try{
 const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
 const r=await page.evaluate(()=>{
  let pass=0,fail=0,issues=[];const check=(label,yes)=>{if(yes)pass++;else{fail++;if(issues.length<24)issues.push(label)}};
  const DAY=86400000,ms=s=>Date.parse(s+'T00:00:00Z'),iso=n=>new Date(n).toISOString().slice(0,10);
  const add=(s,n)=>iso(ms(s)+n*DAY);
  const anniversary=(hire,years)=>{
    const [y,m,d]=hire.split('-').map(Number),date=new Date(Date.UTC(y+years,m-1,Math.min(d,new Date(Date.UTC(y+years,m,0)).getUTCDate())));
    return date.toISOString().slice(0,10);
  };
  const hires=['1995-10-15','1996-02-29','2005-10-15','2006-02-28','2015-10-15','2016-02-29','2020-10-15','2021-05-01','2025-10-15','2026-02-28','2026-10-15','2027-05-01'];
  const exclusions=[
   [],
   [{start_date:'2026-01-05',end_date:'2026-01-14'}],
   [{start_date:'2026-10-10',end_date:'2026-10-19'},{start_date:'2026-10-18',end_date:'2026-10-25'},{start_date:'2026-10-26',end_date:'2026-10-29'}],
   [{start_date:'2026-02-27',end_date:'2026-03-03'},{start_date:'2027-02-28',end_date:'2027-03-02'}]
  ];
  const start=ms('2026-01-01'),dates=Array.from({length:730},(_,i)=>iso(start+i*DAY));
  const bandByYears=y=>y<0?'under1':y<1?'under1':y<5?'1-5':y<10?'5-10':y<20?'10-20':y<30?'20-30':'30+';
  const descriptors={'under1':[false,0,null,1],'1-5':[true,5,1,5],'5-10':[true,10,2,10],'10-20':[true,15,3,20],'20-30':[true,25,5,30],'30+':[true,30,6,null]};
  try{
  for(const hire of hires)for(let n=0;n<exclusions.length;n++){
   const periods=exclusions[n],snapshot=JSON.stringify(periods),covered=new Set();
   for(const p of periods)for(let t=ms(p.start_date);t<=ms(p.end_date);t+=DAY)covered.add(iso(t));
   const dayCount=t=>{
    if(t<hire)return 0;
    let count=0;for(const d of covered)if(d>=hire&&d<=t)count++;return count;
   };
   const adjust=t=>add(t,-dayCount(t));
   const yearsAt=t=>{
     if(t<hire)return -1;
     const shifted=adjust(t);if(shifted<hire)return -1;
     let y=+shifted.slice(0,4)-+hire.slice(0,4);
     if(anniversary(hire,y)>shifted)y--;
     return y;
   };
   const thresholds=[1,5,10,20,30],first={};
   for(const milestone of thresholds){
    const initial=anniversary(hire,milestone);
    let candidate=initial;
    for(let steps=0;steps<3650;steps++){
     if(adjust(candidate)>=initial)break;
     candidate=add(candidate,1);
    }
    first[milestone]=candidate;
    check('anniversary oracle '+hire+' exclusions '+n+' '+milestone,lsRecognizedAnniversaryDate(hire,milestone,periods)===candidate);
   }
   for(const date of dates){
    const label='hire '+hire+' exclude '+n+' date '+date;
    const actual=lsBandForDate(hire,date,periods);
    if(date<hire){
      check(label+' before hire',actual.code==='before'&&!actual.eligible&&actual.entitledDays===0);
      continue;
    }
    const yy=yearsAt(date),code=bandByYears(yy),desc=descriptors[code];
    check(label+' classification',actual.code===code);
    check(label+' eligibility',actual.eligible===desc[0]);
    check(label+' days',actual.entitledDays===desc[1]);
    check(label+' split limit',actual.split===desc[2]);
    check(label+' next milestone',actual.nextYears===desc[3]);
    if(desc[3]!=null)check(label+' independent next date',actual.nextDate===first[desc[3]]);
    else check(label+' final bucket has no next anniversary',actual.nextDate==='');
    const from=code==='under1'?hire:code==='1-5'?first[1]:code==='5-10'?first[5]:code==='10-20'?first[10]:code==='20-30'?first[20]:first[30];
    check(label+' bucket start date',actual.from===from);
    const to=code==='under1'?add(first[1],-1):code==='1-5'?add(first[5],-1):code==='5-10'?add(first[10],-1):code==='10-20'?add(first[20],-1):code==='20-30'?add(first[30],-1):'';
    check(label+' bucket boundary',actual.to===to);
    check(label+' source input immutable',JSON.stringify(periods)===snapshot);
   }
  }
  check('app version unchanged',APP_VERSION==='ver20260927-0944');
  }catch(e){fail++;issues.push('Test runtime: '+String(e.stack||e).slice(0,1400))}
  return {pass,fail,issues,hire_count:hires.length,exclusion_scenarios:exclusions.length,days:dates.length};
 });
 pass+=r.pass;fail+=r.fail+errors.length;contexts++;
 if(r.fail||errors.length)issues.push({zone,mobile,fail:r.fail,details:r.issues,errors:errors.slice(0,2)});
 }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1200)})}
 finally{await cx.close()}
 }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1300)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA280_LONGSERVICE_BAND_BOUNDARY_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

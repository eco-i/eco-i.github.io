'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-281.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('281 immutable baseline SHA mismatch');
(async()=>{
let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
  const ctx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  try{
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
   const result=await page.evaluate(()=>{
    let pass=0,fail=0,issues=[],seed=0x28102017;
    const ck=(n,b)=>{if(b)pass++;else{fail++;if(issues.length<40)issues.push(n)}};
    const DAY=86400000,epoch=s=>Date.parse(s+'T00:00:00Z'),iso=t=>new Date(t).toISOString().slice(0,10),add=(s,n)=>iso(epoch(s)+n*DAY);
    const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
    const valid=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(epoch(s))&&iso(epoch(s))===s;
    const ann=(hire,n)=>{const [y,m,d]=hire.split('-').map(Number);return iso(Date.UTC(y+n,m-1,Math.min(d,new Date(Date.UTC(y+n,m,0)).getUTCDate())))};
    const cases=[
      [],
      [{start_date:'2026-01-01',end_date:'2026-01-01'},{start_date:'2026-01-01',end_date:'2026-01-01'}],
      [{start_date:'2026-01-01',end_date:'2026-01-31'},{start_date:'2026-02-01',end_date:'2026-02-28'}],
      [{start_date:'2024-02-28',end_date:'2024-03-01'},{start_date:'2024-02-29',end_date:'2024-02-29'}],
      [{start_date:'2020-01-01',end_date:'2031-12-31'},{start_date:'2026-05-01',end_date:'2026-06-01'}],
      [{start_date:'2026-02-30',end_date:'2026-03-01'},{start_date:'2026-04-02',end_date:'2026-04-01'},{start_date:'2026-06-01',end_date:'2026-06-01'}],
      [{start_date:'2000-01-01',end_date:'2000-01-01'},{start_date:'2040-01-01',end_date:'2040-01-01'}]
    ];
    for(let c=0;c<56;c++){
      const entries=[];
      for(let j=0;j<7+(c%5);j++){
        const start=add('2016-01-01',rnd()%7000),len=rnd()%(c%7===0?800:160);
        const p={start_date:start,end_date:add(start,len),reason:'test-'+j,id:j};
        if(j&&j%4===0){p.start_date=entries[j-1].start_date;p.end_date=entries[j-1].end_date}
        if(j===3&&c%11===0)p.end_date=add(p.start_date,-1);
        if(j===5&&c%13===0)p.start_date='2026-02-30';
        entries.push(p);
      }
      cases.push(entries);
    }
    const hires=['1996-02-29','2005-10-15','2016-02-29','2021-05-01','2025-10-15','2026-02-28'];
    const dates=Array.from({length:92},(_,i)=>add('2025-08-01',i*10));
    for(let c=0;c<cases.length;c++){
      const periods=cases[c],snapshot=JSON.stringify(periods),expectedSet=new Set();
      for(const p of periods)if(valid(p.start_date)&&valid(p.end_date)&&p.end_date>=p.start_date)
        for(let d=epoch(p.start_date);d<=epoch(p.end_date);d+=DAY)expectedSet.add(iso(d));
      const merged=lsNormalizeExclusions(periods).merged,actualSet=new Set();
      for(const p of merged)for(let d=epoch(p.start_date);d<=epoch(p.end_date);d+=DAY)actualSet.add(iso(d));
      const tag='case '+c;
      ck(tag+' exact normalized union',expectedSet.size===actualSet.size&&[...expectedSet].every(x=>actualSet.has(x)));
      ck(tag+' sorted nonoverlap nonadjacent',merged.every((p,i)=>i===0||epoch(merged[i-1].end_date)+DAY<epoch(p.start_date)));
      ck(tag+' input not mutated',JSON.stringify(periods)===snapshot);
      ck(tag+' reverse permutation same normalization',JSON.stringify(lsNormalizeExclusions([...periods].reverse()).merged)===JSON.stringify(merged));
      ck(tag+' duplicate permutation same normalization',JSON.stringify(lsNormalizeExclusions([...periods,...periods].reverse()).merged)===JSON.stringify(merged));
      const sorted=[...expectedSet].sort();
      const binaryLE=x=>{let lo=0,hi=sorted.length;while(lo<hi){const mid=(lo+hi)>>>1;if(sorted[mid]<=x)lo=mid+1;else hi=mid}return lo};
      for(const hire of hires){
        const countUntil=target=>target<hire?0:binaryLE(target)-binaryLE(add(hire,-1));
        const recognized=target=>add(target,-countUntil(target));
        for(const n of [1,5,10,20,30]){
          const target=ann(hire,n);let candidate=target,limit=0;
          while(recognized(candidate)<target&&limit<20000){candidate=add(candidate,1);limit++}
          ck(tag+' hire '+hire+' anniversary '+n+' oracle converges',limit<20000);
          ck(tag+' hire '+hire+' anniversary '+n+' exact first legal day',lsRecognizedAnniversaryDate(hire,n,periods)===candidate);
          if(candidate>target)ck(tag+' hire '+hire+' anniversary '+n+' previous not eligible',recognized(add(candidate,-1))<target);
        }
        for(const target of dates){
          const label=tag+' hire '+hire+' target '+target,days=countUntil(target);
          ck(label+' exact unique union days',lsExcludedDaysUntil(hire,target,periods)===days);
          ck(label+' recognized target date',lsRecognizedTargetISO(hire,target,periods)===recognized(target));
          const reversed=[...periods].reverse();
          ck(label+' period ordering irrelevant',lsExcludedDaysUntil(hire,target,reversed)===days);
        }
      }
      ck(tag+' source immutable after all',JSON.stringify(periods)===snapshot);
    }
    ck('version unchanged',APP_VERSION==='ver20260927-0944');
    return {pass,fail,issues,cases:cases.length,hires:hires.length,dates:dates.length};
   });
   pass+=result.pass;fail+=result.fail+errors.length;contexts++;
   if(result.fail||errors.length)issues.push({tz,mobile,fail:result.fail,details:result.issues,errors:errors.slice(0,3)});
  }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1800)})}
  finally{await ctx.close()}
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1800)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA281_EXCLUSION_PERMUTATION_FUZZ_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
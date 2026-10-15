'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-270.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA267 immutable source hash mismatch');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,days=0,issues=[];
try {
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const r=await page.evaluate(()=>{
 let pass=0,fail=0,issues=[],days=0;
 const ck=(label,ok)=>{if(ok)pass++;else{fail++;if(issues.length<16)issues.push(label)}};
 const fmt=(d)=>new Date(d).toISOString().slice(0,10);
 const valid=(s)=>{try{return !!lsParseISO(s)}catch{return false}};
 const start=Date.UTC(2026,0,1);
 for(let i=0;i<730;i++){
  const iso=fmt(start+i*86400000),next=fmt(start+(i+1)*86400000),prev=fmt(start+(i-1)*86400000);
  ck('parse '+iso,valid(iso));
  ck('add one day '+iso,lsAddDays(iso,1)===next);
  ck('subtract one day '+iso,lsAddDays(iso,-1)===prev);
  ck('calendar delta '+iso,lsDaysBetween(iso,next)===1);
  ck('calendar two-way '+iso,lsDaysBetween(next,iso)===-1);
  const day=Number(iso.slice(-2)),first=iso.slice(0,8)+'01';
  const base=lsParseISO(first);
  const upcoming=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+1,1));
  const monthMax=new Date(Date.UTC(upcoming.getUTCFullYear(),upcoming.getUTCMonth()+1,0)).getUTCDate();
  const monthExpected=upcoming.toISOString().slice(0,8)+String(Math.min(day,monthMax)).padStart(2,'0');
  ck('month clamp '+iso,lsAddMonths(iso,1)===monthExpected);
  days++;
 }
 const invalids=['2026-00-10','2026-13-01','2026-02-29','2027-02-29','2026-04-31','2026-06-31','2026-11-31','2026-2-01','2026-02-1','2026-01-00','2026-01-32','foo','2026-10-15T00:00:00Z','','<img src=x>'];
 for(const v of invalids)ck('invalid date '+v,!valid(v));
 for(const [date,months,expected] of [
 ['2026-01-31',1,'2026-02-28'],['2026-03-31',-1,'2026-02-28'],
 ['2027-01-31',1,'2027-02-28'],['2026-12-31',1,'2027-01-31'],
 ['2024-01-31',1,'2024-02-29'],['2024-02-29',12,'2025-02-28']]){
  ck('month edge '+date,lsAddMonths(date,months)===expected);
 }
 for(const [date,years,expected] of [['2024-02-29',1,'2025-02-28'],['2024-02-29',4,'2028-02-29'],['2026-12-31',1,'2027-12-31']]){
  ck('year edge '+date,lsAddYears(date,years)===expected);
 }
 ck('2026-27 days exactly',days===730);
 return {pass,fail,issues,days};
});
pass+=r.pass;fail+=r.fail+errors.length;contexts++;days+=r.days;
if(r.fail||errors.length)issues.push({zone,mobile,failed:r.fail,issues:r.issues,errors:errors.slice(0,3)});
await cx.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA270_DATE_PROPERTIES_SUMMARY',JSON.stringify({pass,fail,contexts,days,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
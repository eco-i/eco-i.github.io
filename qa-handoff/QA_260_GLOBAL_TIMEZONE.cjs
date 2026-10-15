'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-260.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA260 baseline mismatch');
const timezones=['Asia/Seoul','Asia/Tokyo','UTC','America/Los_Angeles','America/New_York','Pacific/Honolulu','Europe/London','Australia/Sydney'];
const moments=[
 '2026-01-01T14:59:00Z','2026-01-01T15:01:00Z',
 '2026-03-08T09:59:00Z','2026-03-08T10:01:00Z',
 '2026-10-14T14:59:00Z','2026-10-14T15:01:00Z',
 '2026-11-01T08:59:00Z','2026-11-01T09:01:00Z',
 '2026-12-31T14:59:00Z','2026-12-31T15:01:00Z',
 '2027-09-30T14:59:00Z','2027-09-30T15:01:00Z',
 '2027-12-31T14:59:00Z','2027-12-31T15:01:00Z'
];
(async()=>{let browser,server,pass=0,fail=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const zone of timezones)for(const mobile of [false,true]){
  const ctx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1240,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  for(const raw of moments){
   const ms=Date.parse(raw);
   const expected=new Date(ms+9*60*60000).toISOString().slice(0,10);
   await page.clock.setFixedTime(new Date(raw));
   const data=await page.evaluate(()=>({korea:koreaTodayKey(),today:todayKey(),version:APP_VERSION}));
   const ok=data.korea===expected&&data.today===expected&&data.version==='ver20260927-0944';
   if(ok)pass++;else{fail++;if(issues.length<8)issues.push({zone,mobile,raw,expected,data})}
  }
  if(errs.length){fail+=errs.length;issues.push({zone,mobile,err:errs.slice(0,3)})}
  await ctx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA260_GLOBAL_TIMEZONE_SUMMARY',JSON.stringify({passed:pass,failed:fail,contexts:timezones.length*2,instants:moments.length,issues,sha}));if(fail)process.exitCode=1;
})();
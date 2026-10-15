'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-268.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA266 hash mismatch');
(async()=>{
let server,browser,pass=0,fail=0,contexts=0,problems=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
const page=await cx.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const x=await page.evaluate(()=>{
let pass=0,fail=0,issues=[];
const ck=(n,ok)=>{if(ok)pass++;else{fail++;if(issues.length<16)issues.push(n)}};
const p={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']},anchor=Date.UTC(2026,8,1);
let days=0,overhauls=0;
for(const year of [2026,2027])for(let m=0;m<12;m++)for(let d=1,n=new Date(year,m+1,0).getDate();d<=n;d++){
 const key=year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 const week=new Date(year,m,d).getDay(),off=week===0||week===6||!!HOLIDAYS[key];
 const overhaul=key>='2026-10-01'&&key<='2026-10-15';
 const i=((Math.round((Date.UTC(year,m,d)-anchor)/86400000)%8)+8)%8;
 const values=[];
 for(const g of ['A','B','C','D']){
 const actual=shiftForGroup(g,year,m,d);values.push(actual);
 const expected=overhaul?(off?'휴':g==='C'&&key==='2026-10-15'?'야':'주2'):p[g][i];
 ck(g+key,actual===expected);
 }
 ck('DAY:'+key,shiftForGroup('DAY',year,m,d)===(off?'휴':'일근'));
 ck('INVALID:'+key,shiftForGroup('UNKNOWN',year,m,d)==='');
 if(!overhaul)ck('unique:'+key,new Set(values).size===4);
 if(overhaul)overhauls++;days++;
}
ck('730days',days===730);ck('15overhaul',overhauls===15);
return {pass,fail,issues};
});
pass+=x.pass;fail+=x.fail+errs.length;contexts++;
if(x.fail||errs.length)problems.push({zone,mobile,issues:x.issues,errs:errs.slice(0,3)});
for(const instant of ['2026-12-31T14:59:59Z','2026-12-31T15:00:01Z','2027-12-31T14:59:59Z','2027-12-31T15:00:01Z']){
 await page.clock.setFixedTime(new Date(instant));
 const dates=await page.evaluate(()=>({today:todayKey(),korea:koreaTodayKey()}));
 const expected=new Date(Date.parse(instant)+9*3600000).toISOString().slice(0,10);
 if(dates.today===expected&&dates.korea===expected)pass++;else{fail++;problems.push({zone,mobile,instant,dates,expected})}
}
await cx.close();
}
}catch(e){fail++;problems.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA268_TRANSITIONS_SUMMARY',JSON.stringify({pass,fail,contexts,sha,issues:problems}));if(fail)process.exitCode=1;
})();
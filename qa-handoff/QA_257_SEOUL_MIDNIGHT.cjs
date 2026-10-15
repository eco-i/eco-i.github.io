'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-257.html','utf8');
const hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('candidate SHA mismatch');
const at=[
['2026-10-14T14:59:59Z','2026-10-14'],['2026-10-14T15:00:00Z','2026-10-15'],
['2026-12-31T14:59:59Z','2026-12-31'],['2026-12-31T15:00:00Z','2027-01-01'],
['2027-01-01T14:59:59Z','2027-01-01'],['2027-01-01T15:00:00Z','2027-01-02']
];
(async()=>{let server,browser,pass=0,fail=0;const details=[];
try{server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true])for(const [utc,expected] of at){
 const ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:900},isMobile:mobile,timezoneId:tz});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date(utc)});await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const result=await p.evaluate(()=>({today:todayKey(),year:state.year,month:state.month,version:APP_VERSION}));
 const dateCorrect=result.today===expected && result.year===+expected.slice(0,4)&&result.month===+expected.slice(5,7)-1;
 const safe=errors.length===0&&result.version==='ver20260927-0944';
 if(dateCorrect&&safe)pass+=2;else{if(!dateCorrect)fail++;else pass++;if(!safe)fail++;else pass++;details.push({tz,mobile,utc,expected,result,errors})}
 await ctx.close();
}
}catch(e){fail++;details.push({error:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA257_SEOUL_MIDNIGHT_SUMMARY',JSON.stringify({passed:pass,failed:fail,utc_boundaries:at.length,contexts:6,details:details.slice(0,15),sha:hash}));if(fail)process.exitCode=1;
})();

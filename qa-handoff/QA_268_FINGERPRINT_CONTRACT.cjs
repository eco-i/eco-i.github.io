'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http'),{chromium}=require('playwright-core');
const h=fs.readFileSync('qa-handoff/index.before-2-8-268.html','utf8');
const sha=crypto.createHash('sha256').update(h).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('immutable source changed');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(h)});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true])for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles']){
const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e.message||e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const result=await p.evaluate(()=>{
const time='2026-10-15T10:23:45+09:00',date='2026-10-15';
const row=()=>({record_date:date,has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:time});
const valid=(rows,opts={})=>{try{return strictFingerprintRpcRows(rows,opts)}catch(e){return e}};
let pass=0,fail=0,issues=[];
const ck=(n,ok)=>{if(ok)pass++;else{fail++;if(issues.length<14)issues.push(n)}};
ck('valid empty',Array.isArray(valid([])));
ck('valid no-photo',Array.isArray(valid([row()])));
const photos=row();photos.has_clock_in=true;photos.clock_in_uploaded_at=time;photos.has_clock_out=true;photos.clock_out_uploaded_at=time;photos.confirmed=true;photos.confirmed_at=time;
ck('valid completed photo',Array.isArray(valid([photos])));
const reject=(label,change)=>{let r=row();change(r);ck(label,valid([r]) instanceof Error)};
reject('bad Gregorian date',r=>r.record_date='2026-02-30');
reject('bad leap day',r=>r.record_date='2027-02-29');
reject('before range',r=>r.record_date='1900-01-01');
reject('after range',r=>r.record_date='2101-01-01');
reject('HTML field injection',r=>r.record_date='<img onerror=alert(1)>');
reject('string boolean',r=>r.has_clock_in='false');
reject('numeric boolean',r=>r.confirmed=0);
reject('missing updated timestamp',r=>r.updated_at=null);
reject('bad timestamp hour',r=>r.updated_at='2026-10-15T25:00:00Z');
reject('bad timezone',r=>r.updated_at='2026-10-15T10:00:00+15:00');
reject('future invalid timestamp',r=>r.updated_at='2026-02-30T00:00:00Z');
reject('in flag without uploaded at',r=>r.has_clock_in=true);
reject('uploaded at without in flag',r=>r.clock_in_uploaded_at=time);
reject('out flag without uploaded at',r=>r.has_clock_out=true);
reject('confirmed without photos',r=>r.confirmed=true);
reject('unconfirmed with timestamp',r=>r.confirmed_at=time);
reject('confirmed no stamp',r=>{r.has_clock_in=true;r.has_clock_out=true;r.clock_in_uploaded_at=time;r.clock_out_uploaded_at=time;r.confirmed=true});
ck('duplicate day',valid([row(),row()]) instanceof Error);
ck('nonarray response',valid({record_date:date}) instanceof Error);
ck('null row',valid([null]) instanceof Error);
ck('from bound',valid([row()],{from:'2026-10-16'}) instanceof Error);
ck('to bound',valid([row()],{to:'2026-10-14'}) instanceof Error);
ck('range allowed',Array.isArray(valid([row()],{from:'2026-10-01',to:'2026-10-31'})));
return {pass,fail,issues};
});
pass+=result.pass;fail+=result.fail+errors.length;contexts++;
if(result.fail||errors.length)issues.push({tz,mobile,issues:result.issues,errors:errors.slice(0,3)});
await cx.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA268_FINGERPRINT_CONTRACT_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.before-2-8-269.html','utf8'),digest=crypto.createHash('sha256').update(source).digest('hex');
if(digest!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('268 SHA mismatch');
(async()=>{let srv,browser,pass=0,fail=0,contexts=0,issues=[];
try{
srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(source)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
 const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?850:900},isMobile:mobile,hasTouch:mobile});
 const page=await cx.newPage(),errs=[];page.on('pageerror',e=>errs.push(String(e.message||e)));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
 const x=await page.evaluate(()=>{
  let pass=0,fail=0,issues=[],days=0;
  const ck=(n,ok)=>{if(ok)pass++;else{fail++;if(issues.length<15)issues.push(n)}};
  const ts='2026-10-15T10:23:45+09:00';
  const invoke=r=>{try{return strictFingerprintRpcRows([r])}catch(e){return e}};
  for(const y of [2026,2027])for(let mo=0;mo<12;mo++)for(let d=1,last=new Date(Date.UTC(y,mo+1,0)).getUTCDate();d<=last;d++){
   const iso=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
   const r={record_date:iso,has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:ts};
   ck('none '+iso,Array.isArray(invoke(r)));
   const cin={...r,has_clock_in:true,clock_in_uploaded_at:ts};
   ck('check in '+iso,Array.isArray(invoke(cin)));
   const finished={...cin,has_clock_out:true,clock_out_uploaded_at:ts,confirmed:true,confirmed_at:ts};
   ck('confirmed '+iso,Array.isArray(invoke(finished)));
   ck('premature confirmed '+iso,invoke({...cin,confirmed:true,confirmed_at:ts}) instanceof Error);
   ck('no out timestamp '+iso,invoke({...finished,clock_out_uploaded_at:null}) instanceof Error);
   days++;
  }
  ck('exact day count',days===730);
  const r={record_date:'2026-01-01',has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:ts};
  ck('range includes',Array.isArray(strictFingerprintRpcRows([r],{from:'2026-01-01',to:'2027-12-31'})));
  const reject=(label,rows,range)=>{try{strictFingerprintRpcRows(rows,range);ck(label,false)}catch{ck(label,true)}};
  reject('lower bound',[r],{from:'2026-01-02'});
  reject('upper bound',[r],{to:'2025-12-31'});
  reject('duplicate',[r,r],{});
  return {pass,fail,issues,days};
 });
 pass+=x.pass;fail+=x.fail+errs.length;contexts++;if(x.fail||errs.length)issues.push({tz,mobile,checks:x.issues,errors:errs.slice(0,3)});
 await cx.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA269_FINGERPRINT_DATE_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:digest,issues}));if(fail)process.exitCode=1;
})();
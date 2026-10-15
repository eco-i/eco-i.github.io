'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('official SHA mismatch');
(async()=>{let server,browser,passed=0,failed=0,items=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const cx=await browser.newContext({viewport:{width:mobile?390:1290,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const r=await p.evaluate(()=>{
   let pass=0,fail=0,details=[];const test=(n,good)=>{if(good)pass++;else{fail++;if(details.length<14)details.push(n)}};
   const modern={is_read_only:false,is_disabled:false,account_status:'active',employment_status:'working'};
   const acceptsModern=v=>{try{return strictPersonnelAccountStatusRpcRow([v])?.account_status==='active'}catch(_){return false}};
   test('valid modern account',acceptsModern(modern));
   const m=[
    ['status-null',v=>v.account_status=null],['status-invalid',v=>v.account_status='pending'],
    ['account-mismatch',v=>v.account_status='readonly'],['disabled-mismatch',v=>v.account_status='disabled'],
    ['readonly-nonboolean',v=>v.is_read_only='false'],['disabled-nonboolean',v=>v.is_disabled=0],
    ['employment-unknown',v=>v.employment_status='vacation'],['employment-array',v=>v.employment_status=[]]
   ];
   for(let i=0;i<100;i++)for(const [name,mut] of m){const v=structuredClone(modern);mut(v);test('account:'+i+name,!acceptsModern(v))}
   for(const v of [[],null,modern,[modern,modern],[null],[[modern]]]){
     let rejected=false;try{strictPersonnelAccountStatusRpcRow(v)}catch(_){rejected=true}
     test('invalid list modern',rejected);
   }
   const legacy={is_read_only:false,active_to:null};
   test('legacy account',strictLegacyAccountStatusRpcRow([legacy]).is_read_only===false);
   for(const invalid of [{is_read_only:0,active_to:null},{is_read_only:false,active_to:'2026-02-30'},{is_read_only:false,active_to:[]}]){
     let rejected=false;try{strictLegacyAccountStatusRpcRow([invalid])}catch(_){rejected=true}test('invalid legacy row',rejected);
   }
   const ts='2026-10-15T13:00:00+09:00';
   const annual2026={leave_year:2026,baseline_remaining_minutes:5400,granted_minutes:null,carryover_minutes:null,updated_at:ts};
   const annual2027={leave_year:2027,baseline_remaining_minutes:null,granted_minutes:7200,carryover_minutes:120,updated_at:ts};
   const acceptedYear=(r,y)=>{try{return strictAnnualLeaveSettingRpc([r],y)!=null}catch(_){return false}};
   test('valid 2026 baseline annual',acceptedYear(annual2026,2026));
   test('valid 2027 grant carryover',acceptedYear(annual2027,2027));
   test('decimal bigint leave compatibility',acceptedYear({...annual2027,leave_year:'2027',granted_minutes:'7200',carryover_minutes:'120'},2027));
   const ab=[
    ['year-0',v=>v.leave_year=0],['year-wrong',v=>v.leave_year=2028],
    ['baseline-malformed',v=>v.baseline_remaining_minutes=[]],['grant-malformed',v=>v.granted_minutes=1.2],
    ['carry-malformed',v=>v.carryover_minutes='abc'],['updated-invalid',v=>v.updated_at='2026-02-30T00:00:00Z']
   ];
   for(let i=0;i<100;i++)for(const [name,mut] of ab){
     const v=structuredClone(annual2027);mut(v);
     test('annual2027:'+i+name,!acceptedYear(v,2027));
   }
   for(let i=0;i<100;i++){
     const v={...annual2026,baseline_remaining_minutes:null};
     test('annual2026 required baseline:'+i,!acceptedYear(v,2026));
     const z={...annual2027,granted_minutes:null};test('annual2027 required granted:'+i,!acceptedYear(z,2027));
   }
   const long={hire_date:'2021-01-01',previous_used_minutes:240,previous_used_band:'1-5',updated_at:ts};
   const acceptsLong=v=>{try{return strictLongServiceProfileRpc([v])!=null}catch(_){return false}};
   test('valid long service',acceptsLong(long));
   const lb=[
    ['future-hire',v=>v.hire_date='2030-01-01'],['invalid-hire',v=>v.hire_date='2021-02-30'],
    ['invalid-band',v=>v.previous_used_band='50+'],['negative-used',v=>v.previous_used_minutes=-1],
    ['nonint-used',v=>v.previous_used_minutes=1.3],['array-used',v=>v.previous_used_minutes=[]],
    ['timestamp-bad',v=>v.updated_at='2026-01-55T13:00:00Z']
   ];
   for(let i=0;i<90;i++)for(const [name,mut] of lb){
     const v=structuredClone(long);mut(v);
     test('long-service:'+i+name,!acceptsLong(v));
   }
   return {pass,fail,details};
  });
  passed+=r.pass;failed+=r.fail+errors.length;items.push({mobile,pass:r.pass,fail:r.fail,issues:r.details,jsErrors:errors.slice(0,3)});
  await cx.close();
 }
}catch(e){failed++;items.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA261_ACCOUNT_LEAVE_SUMMARY',JSON.stringify({passed,failed,sha,items}));
if(failed)process.exitCode=1;
})();
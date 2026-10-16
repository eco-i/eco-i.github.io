'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const file='qa-handoff/index.before-2-8-272.html',source=fs.readFileSync(file,'utf8');
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af',sha=crypto.createHash('sha256').update(source).digest('hex');
if(sha!==expected)throw Error('272 baseline SHA does not match 271 official completion');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const timezone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const context=await browser.newContext({timezoneId:timezone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
    const outcome=await page.evaluate(()=>{
      let pass=0,fail=0,issues=[],checks=0;
      const ck=(name,test)=>{checks++;if(test)pass++;else{fail++;if(issues.length<35)issues.push(name)}};
      const timestamp='2026-10-15T14:59:59.123456Z';
      const mk=(key='2026-10-15')=>({record_date:key,has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:timestamp});
      const inRow=()=>({...mk(),has_clock_in:true,clock_in_uploaded_at:timestamp});
      const outRow=()=>({...mk(),has_clock_out:true,clock_out_uploaded_at:timestamp});
      const both=()=>({...mk(),has_clock_in:true,has_clock_out:true,clock_in_uploaded_at:timestamp,clock_out_uploaded_at:timestamp});
      const confirmed=()=>({...both(),confirmed:true,confirmed_at:timestamp});
      const accepted=(label,rows,range)=>{let valid=true;try{const result=strictFingerprintRpcRows(rows,range);valid=Array.isArray(result)&&result.length===rows.length;}catch(e){valid=false;}ck('accept '+label,valid)};
      const rejected=(label,rows,range)=>{let deny=false;try{strictFingerprintRpcRows(rows,range)}catch(e){deny=true;}ck('reject '+label,deny)};
      for(const r of [mk(),inRow(),outRow(),both(),confirmed()])accepted('consistent model '+JSON.stringify([r.has_clock_in,r.has_clock_out,r.confirmed]),[r]);
      accepted('empty response',[]);
      accepted('two unique records',[mk('2026-10-14'),confirmed()]);
      accepted('valid bounded range',[mk('2026-01-01'),confirmed(),mk('2027-12-31')],{from:'2026-01-01',to:'2027-12-31'});
      for(const key of ['2020-01-01','2026-01-01','2026-02-28','2026-10-15','2027-12-31','2028-02-29','2100-12-31'])accepted('valid calendar day '+key,[mk(key)]);
      for(const key of ['2019-12-31','2101-01-01','2026-02-29','2027-02-29','2026-04-31','2026-13-01','2026-00-01','2026-01-00','2026-01-32','2026-10-15T00:00:00Z','2026/10/15','foo',''])rejected('invalid day '+key,[mk(key)]);
      for(const [field,invalid] of [['record_date',17],['record_date',null],['has_clock_in',1],['has_clock_in','false'],['has_clock_out',null],['has_clock_out',0],['confirmed',1],['confirmed','false'],['updated_at',null],['updated_at',5],['clock_in_uploaded_at',1],['clock_out_uploaded_at','bad-date'],['confirmed_at',true]]){
        rejected('invalid field '+field+'='+String(invalid),[{...mk(),[field]:invalid}]);
      }
      for(const [name,rows] of [
        ['null',null],['object',{}],['primitive-row',[42]],['array-row',[[]]],['null-row',[null]],
        ['duplicate date',[mk(),mk()]],['in without time',[{...mk(),has_clock_in:true}]],
        ['out without time',[{...mk(),has_clock_out:true}]],['timestamp with flag false',[{...mk(),clock_in_uploaded_at:timestamp}]],
        ['confirmed without in',[{...outRow(),confirmed:true,confirmed_at:timestamp}]],
        ['confirmed without out',[{...inRow(),confirmed:true,confirmed_at:timestamp}]],
        ['confirmed without time',[{...both(),confirmed:true}]],
        ['unconfirmed with confirmed_at',[{...both(),confirmed_at:timestamp}]]
      ])rejected(name,rows);
      rejected('before requested range',[mk('2026-10-14')],{from:'2026-10-15',to:'2026-10-15'});
      rejected('after requested range',[mk('2026-10-16')],{from:'2026-10-15',to:'2026-10-15'});
      for(const valid of ['2026-10-15T14:59:59Z','2026-10-15T23:59:59+09:00','2026-10-15T14:59:59.123456Z','2026-10-15 14:59:59+00','2026-10-15T00:00:00-12:00','2026-10-15T23:59:59+14:00']){
        accepted('valid timezone '+valid,[{...mk(),updated_at:valid}]);
      }
      for(const bad of ['1','2026-02-30T00:00:00Z','2026-10-15T24:00:00Z','2026-10-15T00:60:00Z','2026-10-15T00:00:60Z','2026-10-15T00:00:00+15:00','2026-10-15T00:00:00+14:01','2026-10-15T00:00:00+09:60','2026-10-15T00:00:00+09:99','2026-10-15T00:00:00+99:00','2026-10-15','NaN','2026-10-15T10:10:10+09:00x']){
        rejected('invalid timestamp '+bad,[{...mk(),updated_at:bad}]);
      }
      // Date comparisons are instant-based, not string-based; a lexical comparison would mis-handle these offsets.
      const equalA='2026-10-15T23:59:59.123456+09:00',equalB='2026-10-15T14:59:59.123456Z';
      ck('timezone-equivalent instants',fingerprintTimestampEqual(equalA,equalB));
      ck('same instant reflexive',fingerprintTimestampEqual(equalA,equalA));
      ck('microsecond-sensitive comparison',!fingerprintTimestampEqual(equalB,'2026-10-15T14:59:59.123457Z'));
      ck('different day not equal',!fingerprintTimestampEqual('2026-10-15T00:00:00Z','2026-10-16T00:00:00Z'));
      ck('two nulls equal',fingerprintTimestampEqual(null,null));
      ck('one null not equal',!fingerprintTimestampEqual(null,equalB));
      ck('visible authenticated app absent before login',document.getElementById('appView').classList.contains('hidden'));
      ck('no startup errors',APP_VERSION==='ver20260927-0944');
      return {pass,fail,issues,checks};
    });
    pass+=outcome.pass;fail+=outcome.fail+errors.length;
    if(outcome.fail||errors.length)issues.push({timezone,mobile,issues:outcome.issues,errors:errors.slice(0,5)});
    contexts++;
   }catch(e){fail++;issues.push({timezone,mobile,error:String(e.stack||e).slice(0,2000)})}
   finally{await context.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,2500)})}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
 console.log('QA272_RPC_BOUNDARY_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

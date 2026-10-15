'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-260.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA260 baseline mismatch');
(async()=>{let browser,server,passed=0,failed=0,items=[];
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const c=await browser.newContext({viewport:{width:mobile?390:1260,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const out=await p.evaluate(()=>{
   let pass=0,fail=0,failures=[];const ck=(label,ok)=>{if(ok)pass++;else{fail++;if(failures.length<12)failures.push(label)}};
   const at='2026-10-15T12:00:00+09:00',ov={id:5,employee_id:7,work_date:'2026-10-15',slot:'early',minutes:30,completed:false,updated_at:at};
   const goodOver=(v,opts={})=>{try{return strictOvertimeRpcRows([v],opts).length===1}catch(_){return false}};
   ck('valid overtime row',goodOver(ov,{employeeId:7,from:'2026-10-01',to:'2026-10-31'}));
   ck('decimal bigint id compatibility',goodOver({...ov,id:'5',employee_id:'7',minutes:'30'}));
   const corrupt=[
    ['zero-id',v=>v.id=0],['float-id',v=>v.id=3.5],['neg-emp',v=>v.employee_id=-2],
    ['minutes-zero',v=>v.minutes=0],['minutes-negative',v=>v.minutes=-10],['minutes-float',v=>v.minutes=10.5],
    ['minutes-nonmultiple',v=>v.minutes=25],['minutes-too-large',v=>v.minutes=1450],['invalid-date',v=>v.work_date='2026-02-30'],
    ['slot-unknown',v=>v.slot='morning'],['slot-null',v=>v.slot=null],['completed-number',v=>v.completed=1],
    ['updated-missing',v=>delete v.updated_at],['updated-invalid',v=>v.updated_at='2026-99-01T00:00:00Z']
   ];
   for(let rep=0;rep<75;rep++)for(const [name,f] of corrupt){const v=structuredClone(ov);v.id=rep+1;f(v);ck('overtime '+rep+':'+name,!goodOver(v))}
   ck('overtime range before',!goodOver(ov,{from:'2026-10-16'}));
   ck('overtime range after',!goodOver(ov,{to:'2026-10-14'}));
   ck('overtime emp scope',!goodOver(ov,{employeeId:8}));
   ck('duplicate id',(()=>{try{strictOvertimeRpcRows([ov,{...ov,slot:'late'}]);return false}catch(_){return true}})());
   ck('duplicate day slot',(()=>{try{strictOvertimeRpcRows([ov,{...ov,id:6}]);return false}catch(_){return true}})());
   const hw={id:8,employee_id:7,work_date:'2026-10-15',start_time:'09:00:00',end_time:'17:00:00',net_minutes:420,updated_at:at};
   const goodHoliday=(v,opts={})=>{try{return strictHolidayWorkRpcRows([v],opts).length===1}catch(_){return false}};
   ck('valid 8-hour holiday',goodHoliday(hw));
   ck('valid bigint string id',goodHoliday({...hw,id:'8',employee_id:'7',net_minutes:'420'}));
   const hc=[
    ['id-0',v=>v.id=0],['employee-null',v=>v.employee_id=null],['invalid-date',v=>v.work_date='2026-02-30'],
    ['start-invalid',v=>v.start_time='24:00:00'],['end-invalid',v=>v.end_time='25:00:00'],
    ['end-earlier',v=>v.end_time='08:00:00'],['zero-minutes',v=>v.net_minutes=0],
    ['wrong-net',v=>v.net_minutes=500],['minutes-fraction',v=>v.net_minutes=420.5],
    ['missing-update',v=>delete v.updated_at],['bad-update',v=>v.updated_at='not-a-date']
   ];
   for(let rep=0;rep<75;rep++)for(const [name,f] of hc){const v=structuredClone(hw);v.id=rep+1;f(v);ck('holiday '+rep+':'+name,!goodHoliday(v))}
   ck('holiday employee scope',!goodHoliday(hw,{employeeId:8}));
   ck('holiday date from',!goodHoliday(hw,{from:'2026-10-16'}));
   ck('holiday date to',!goodHoliday(hw,{to:'2026-10-14'}));
   ck('holiday id duplication',(()=>{try{strictHolidayWorkRpcRows([hw,{...hw,employee_id:8}]);return false}catch(_){return true}})());
   ck('holiday date duplication',(()=>{try{strictHolidayWorkRpcRows([hw,{...hw,id:9}]);return false}catch(_){return true}})());
   for(let total=1;total<=1400;total+=37){
     const start='00:00',end=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
     const expected=total-Math.floor(total/240)*30;
     ck('holiday break '+total,holidayNetMinutes(start,end)===expected);
   }
   return {pass,fail,failures};
  });
  passed+=out.pass;failed+=out.fail+errors.length;
  items.push({device:mobile?'mobile':'desktop',pass:out.pass,fail:out.fail,failures:out.failures,errors:errors.slice(0,4)});
  await c.close();
 }
}catch(e){failed++;items.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA260_OVERTIME_HOLIDAY_SUMMARY',JSON.stringify({passed,failed,sha,items}));if(failed)process.exitCode=1;
})();
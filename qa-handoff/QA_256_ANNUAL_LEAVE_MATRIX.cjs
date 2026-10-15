'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-256.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('QA256 baseline SHA mismatch '+sha);
(async()=>{let server,browser;try{
server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){const ctx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:800},isMobile:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(200);
const result=await p.evaluate(()=>{
const errors=[];let checks=0;const test=(ok,label,got)=>{checks++;if(!ok&&errors.length<25)errors.push({label,got})};
window.configured=()=>false;
state.personnelBackendReady=true;state.personnelAssignments=[];state.employees=[];state.me={employee_id:254,is_admin:false};
for(const group of ['A','B','C','D','DAY']){
 const emp={id:254,group_code:group,category:group==='DAY'?'일근(사무)':group+'조',active_from:'2020-01-01'};state.employees=[emp];
 for(let n=0;n<730;n++){
 const dt=new Date(Date.UTC(2026,0,1+n)),y=dt.getUTCFullYear(),m=dt.getUTCMonth(),d=dt.getUTCDate(),key=dateKey(y,m,d);if(y>2027)continue;
 const shift=shiftForGroup(group,y,m,d);const expect=shift==='주'?660:shift==='야'?660:shift==='일근'||shift==='주2'?480:0;
 const full=annualLeaveFullDayMinutes(emp,key);
 test(full===expect,'full: '+group+key,{shift,full,expect});
 const segs=annualLeaveWorkSegments(emp,key);
 test(segs.every(z=>z.start!==null&&z.end!==null&&z.end>z.start),'positive: '+group+key,segs);
 test(annualLeaveSegmentsMinutes(segs)===expect,'segment: '+group+key,{shift,segs,expect});
 const from=y===2026?'2026-09-12':String(y)+'-01-01', to=String(y)+'-12-31';
 const rec={id:1,employee_id:254,attendance_type:'연가',absence_mode:'all_day',start_date:key,end_date:key};
 const eligible=key>=from&&key<=to;
 const used=annualLeaveMinutesForRecord(rec,emp,from,to);
 test(used===(eligible?expect:0),'absence: '+group+key,{used,expect,eligible});
 if(n%12===0){
  const entries=[rec,{...rec,id:2},{...rec,id:3,attendance_type:'병가',annual_leave_deduct:false}];
  const breakdown=annualLeaveUsageBreakdown(entries,y);
  test(breakdown.total===(eligible?expect:0),'overlap: '+group+key,{breakdown:breakdown.total,expect,eligible});
 }
 if(shift==='야'&&eligible){
  const partial={...rec,absence_mode:'time',start_time:'22:00',end_time:'08:00'};
  const sum=annualLeaveMinutesForRecord(partial,emp,from,to);test(sum===600,'night-22-08: '+group+key,{sum,shift});
  const afterMidnight={...partial,start_time:'00:00',end_time:'08:00'};
  const nightMorning=annualLeaveMinutesForRecord(afterMidnight,emp,from,to);test(nightMorning===480,'night-00-08: '+group+key,{nightMorning});
 }
 if((shift==='주'||shift==='일근'||shift==='주2')&&eligible){
  const lunch={...rec,absence_mode:'time',start_time:'12:00',end_time:'13:00'};
  const sum=annualLeaveMinutesForRecord(lunch,emp,from,to);test(sum===0,'lunch-no-deduct: '+group+key,{sum,shift});
 }
 }
}
for(let n=0;n<366;n++){const dt=new Date(Date.UTC(2027,0,1+n));if(dt.getUTCFullYear()>2027)break;
 const key=dt.toISOString().slice(0,10),later=addDaysKey(key,1),prev=addDaysKey(later,-1);test(prev===key,'roundtrip-date:'+key,{prev});
}
return {checks,failed:errors.length,errorSamples:errors};});
console.log('QA256_ANNUAL_'+(result.failed?'FAIL':'PASS'),mobile?'mobile':'desktop',JSON.stringify({checks:result.checks,failed:result.failed,errorSamples:result.errorSamples.slice(0,12),pageErrors:errors}));
if(result.failed||errors.length)process.exitCode=1;await ctx.close();
}
}catch(e){console.log('QA256_ANNUAL_HARNESS_ERROR',String(e.stack||e));process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})();

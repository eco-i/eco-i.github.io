'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-285.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('285 baseline digest mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const r=await page.evaluate(()=>{
     let pass=0,fail=0,issues=[],testedDates=0,duplicateCases=0,partialCases=0;
     const ck=(tag,ok)=>{if(ok)pass++;else{fail++;if(issues.length<35)issues.push(tag)}};
     const anchor=Date.UTC(2026,8,1),DAY=86400000,base=Date.UTC(2026,0,1);
     const cycle={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
     const dayGroups=['A','B','C','D','DAY'];
     const oracleRole=(g,key,t)=>{
       const w=new Date(t).getUTCDay(),isHoliday=Object.prototype.hasOwnProperty.call(HOLIDAYS,key);
       if(g==='DAY')return w===0||w===6||isHoliday?'휴':'일근';
       if(key>='2026-10-01'&&key<='2026-10-15'){
        if(w===0||w===6||isHoliday)return '휴';
        return g==='C'&&key==='2026-10-15'?'야':'주2';
       }
       return cycle[g][(((t-anchor)/DAY)%8+8)%8];
     };
     const minutesUTC=(t,h,m=0)=>Math.floor(t/60000)+h*60+m;
     const expectedSegments=(shift,t)=>{
       if(shift==='주'||shift==='일근'||shift==='주2'){
        const daytime=shift==='주';
        return [{start:minutesUTC(t,daytime?8:9),end:minutesUTC(t,12)},
                {start:minutesUTC(t,13),end:minutesUTC(t,daytime?20:18)}];
       }
       if(shift==='야')return [{start:minutesUTC(t,20),end:minutesUTC(t,21)},
                              {start:minutesUTC(t,22),end:minutesUTC(t,32)}];
       return [];
     };
     const backup={me:state.me,employees:state.employees,personnelAssignments:state.personnelAssignments,personnelBackendReady:state.personnelBackendReady,holidayWorks:state.holidayWorks};
     try{
      state.personnelAssignments=[];state.personnelBackendReady=true;state.holidayWorks=[];
      ck('APP_VERSION protected',APP_VERSION==='ver20260927-0944');
      ck('2026 annual deduction starts Sep12',annualLeaveAutoStartForYear(2026)==='2026-09-12');
      ck('2027 annual deduction starts Jan1',annualLeaveAutoStartForYear(2027)==='2027-01-01');
      ck('annual leave type recognized',annualLeaveCountsRecord({attendance_type:'연가'}));
      ck('non-deductible sick excluded',!annualLeaveCountsRecord({attendance_type:'병가',annual_leave_deduct:false}));
      ck('explicit deductible sick recognized',annualLeaveCountsRecord({attendance_type:'병가',annual_leave_deduct:true}));
      for(let i=0;i<730;i++){
       const t=base+i*DAY,date=new Date(t).toISOString().slice(0,10),yr=Number(date.slice(0,4)),yearStart=annualLeaveAutoStartForYear(yr);
       const month=Number(date.slice(5,7))-1,day=Number(date.slice(8));
       for(const group of dayGroups){
        const emp={id:285,display_name:'QA285',group_code:group,category:group==='DAY'?'일근(현장)':group+'조',active_from:'2020-01-01',active_to:null,sort_order:1,is_admin:false,personnel_account_status:'active'};
        state.me={employee_id:emp.id,display_name:emp.display_name,group_code:group,is_admin:false};
        state.employees=[emp];
        const shift=oracleRole(group,date,t),expected=expectedSegments(shift,t),mins=expected.reduce((n,s)=>n+s.end-s.start,0);
        const actual=annualLeaveWorkSegments(emp,date);
        const tag=date+' '+group+' expected='+shift;
        ck(tag+' independent shift label',shiftForEmployee(emp,yr,month,day)===shift);
        ck(tag+' exact overnight/day work segments',JSON.stringify(actual)===JSON.stringify(expected));
        ck(tag+' full day minutes',annualLeaveFullDayMinutes(emp,date)===mins);
        const record={id:1001,employee_id:285,attendance_type:'연가',absence_mode:'all_day',start_date:date,end_date:date};
        const inPeriod=date>=yearStart,expectedMins=inPeriod?mins:0;
        const raw=annualLeaveMinutesForRecord(record,emp,yearStart,yr+'-12-31');
        ck(tag+' year-clamped raw deduction',raw===expectedMins);
        if(i%3===0){
         const r1={...record,id:1001},r2={...record,id:1002};
         const breakdown=annualLeaveUsageBreakdown([r1,r2],yr);
         ck(tag+' duplicate no double debit',breakdown.total===expectedMins);
         ck(tag+' duplicate overlap transparent',expectedMins===0?breakdown.rows.length===0:breakdown.rows.length===2&&breakdown.rows[0].minutes===expectedMins&&breakdown.rows[1].minutes===0&&breakdown.rows[1].overlapMinutes===expectedMins);
         duplicateCases++;
        }
        if(i%5===0){
         const sameDay=(start,end)=>({id:2001,employee_id:285,attendance_type:'연가',absence_mode:'time',start_date:date,end_date:date,start_time:start,end_time:end});
         const first=annualLeaveMinutesForRecord(sameDay('09:00','11:00'),emp,yearStart,yr+'-12-31');
         const expFirst=inPeriod&&['주','주2','일근'].includes(shift)?120:0;
         ck(tag+' 09:00~11:00 only day-shift',first===expFirst);
         const second=annualLeaveMinutesForRecord(sameDay('22:00','02:00'),emp,yearStart,yr+'-12-31');
         const expSecond=inPeriod&&shift==='야'?240:0;
         ck(tag+' 22:00~02:00 only night-shift',second===expSecond);
         partialCases++;
        }
        testedDates++;
       }
      }
      // Date boundaries must exclude non-working day rather than charge even one minute.
      const disabled={id:285,display_name:'QA285',group_code:'A',category:'A조',active_from:'2028-01-01',active_to:null};
      ck('nonactive employee accrues no work',annualLeaveFullDayMinutes(disabled,'2027-12-31')===0);
     }finally{Object.assign(state,backup)}
     return {pass,fail,issues,testedDates,duplicateCases,partialCases};
    });
    pass+=r.pass;fail+=r.fail+errors.length;contexts++;
    if(r.fail||errors.length)issues.push({tz,mobile,result:r.issues,pageErrors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1600)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1600)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA285_ANNUAL_LEAVE_WORKTIME_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();
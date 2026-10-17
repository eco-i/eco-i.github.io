'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-286.html','utf8');
const hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA286 expected baseline SHA mismatch');
(async()=>{
 let browser,server,pass=0,fail=0,contexts=0,issues=[],sampleCount=0;
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const data=await page.evaluate(()=>{
     const shiftCycle={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
     const anchor=Date.UTC(2026,8,1),origin=Date.UTC(2026,0,1),msDay=86400000;
     const allGroups=['A','B','C','D','DAY'];
     let pass=0,fail=0,issues=[],samples=0,shifts={};
     const ck=(name,result)=>{if(result)pass++;else{fail++;if(issues.length<40)issues.push(name)}};
     const expectedRole=(group,date,utc)=>{
      const weekday=new Date(utc).getUTCDay(),holiday=Object.prototype.hasOwnProperty.call(HOLIDAYS,date);
      if(group==='DAY')return weekday===0||weekday===6||holiday?'휴':'일근';
      if(date>='2026-10-01'&&date<='2026-10-15'){
       if(weekday===0||weekday===6||holiday)return '휴';
       if(group==='C'&&date==='2026-10-15')return '야';
       return '주2';
      }
      return shiftCycle[group][(((utc-anchor)/msDay)%8+8)%8];
     };
     const min=(dateMs,h)=>Math.floor(dateMs/60000)+h*60;
     const segments=(role,utc)=>{
      if(role==='주')return[[min(utc,8),min(utc,12)],[min(utc,13),min(utc,20)]];
      if(role==='주2'||role==='일근')return[[min(utc,9),min(utc,12)],[min(utc,13),min(utc,18)]];
      if(role==='야')return[[min(utc,20),min(utc,21)],[min(utc,22),min(utc,32)]];
      return[];
     };
     const patterns=[
      {name:'empty',windows:[]},
      {name:'all-day',all:true},
      {name:'day-09-11',windows:[['09:00','11:00']]},
      {name:'night-22-02',windows:[['22:00','02:00']]},
      {name:'full-day-split',windows:[['08:00','12:00'],['13:00','20:00']]},
      {name:'full-night-split',windows:[['20:00','21:00'],['22:00','08:00']]},
      {name:'duplicate-day-overlap',windows:[['09:00','11:00'],['09:00','11:00']]},
      {name:'night-next-day-morning',windows:[['02:00','08:00']]},
      {name:'invalid-zero-window',windows:[['09:00','09:00']]},
      {name:'day-plus-all-day',windows:[['09:00','11:00']],all:true},
      {name:'other-employee-only',windows:[['09:00','11:00']],otherOnly:true}
     ];
     const old={me:state.me,employees:state.employees,personnelAssignments:state.personnelAssignments,personnelBackendReady:state.personnelBackendReady,attendance:state.attendance,holidayWorks:state.holidayWorks};
     try{
      state.personnelAssignments=[];state.personnelBackendReady=true;state.holidayWorks=[];
      ck('APP_VERSION unchanged',APP_VERSION==='ver20260927-0944');
      for(let i=0;i<730;i++){
       const utc=origin+i*msDay,date=new Date(utc).toISOString().slice(0,10),year=Number(date.slice(0,4)),month=Number(date.slice(5,7))-1,day=Number(date.slice(8));
       for(const group of allGroups){
        const emp={id:286,display_name:'QA 286',group_code:group,category:group==='DAY'?'일근(현장)':group+'조',active_from:'2020-01-01',active_to:null,sort_order:1,is_admin:false,personnel_account_status:'active'};
        state.me={employee_id:286,is_admin:false};
        state.employees=[emp];
        const role=expectedRole(group,date,utc),work=segments(role,utc);
        shifts[role]=(shifts[role]||0)+1;
        ck(date+' '+group+' independently anchored role',shiftForEmployee(emp,year,month,day)===role);
        for(const pat of patterns){
         const rows=[];
         if(pat.all)rows.push({id:9800,employee_id:286,attendance_type:'연가',absence_mode:'all_day',start_date:date,end_date:date});
         for(let n=0;n<(pat.windows||[]).length;n++){
          const [startTime,endTime]=pat.windows[n];
          rows.push({id:9801+n,employee_id:pat.otherOnly?999:286,attendance_type:'연가',absence_mode:'time',start_date:date,end_date:date,start_time:startTime,end_time:endTime});
         }
         state.attendance=rows;
         const occupied=[];
         let active=0;
         for(const row of rows){
          if(row.employee_id!==286)continue;
          if(row.absence_mode==='all_day'){
           if(work.length){for(const seg of work)occupied.push([...seg]);active++}
           continue;
          }
          let startH=Number(row.start_time.slice(0,2)),startM=Number(row.start_time.slice(3,5));
          let endH=Number(row.end_time.slice(0,2)),endM=Number(row.end_time.slice(3,5));
          if(startH===endH&&startM===endM)continue;
          if(role==='야'){
           if(startH<8)startH+=24;
           if((endH*60+endM)<(Number(row.start_time.slice(0,2))*60+startM)||endH<=8)endH+=24;
          }
          const a=min(utc,startH)+startM,b=min(utc,endH)+endM;
          if(b<=a)continue;
          let hit=false;
          for(const [ws,we] of work){
           const x=Math.max(a,ws),y=Math.min(b,we);
           if(y>x){occupied.push([x,y]);hit=true}
          }
          if(hit)active++;
         }
         const sorted=occupied.sort((a,b)=>a[0]-b[0]),merged=[];
         for(const p of sorted){
          const last=merged[merged.length-1];
          if(last&&last[1]>=p[0])last[1]=Math.max(last[1],p[1]);
          else merged.push([...p]);
         }
         const expectedCoverage=merged.reduce((sum,p)=>sum+p[1]-p[0],0);
         const workTotal=work.reduce((sum,p)=>sum+p[1]-p[0],0);
         const expectedKind=workTotal===0||expectedCoverage===0?'available':expectedCoverage>=workTotal?'full':'partial';
         const actual=attendanceStatusForEmployeeDate(emp,date);
         const fullIds=fullAbsentIds(date);
         const trace=date+' '+group+' '+pat.name;
         ck(trace+' status',actual.kind===expectedKind);
         ck(trace+' active rows',actual.rows.length===active);
         ck(trace+' full absent ids',fullIds.has(286)===(expectedKind==='full'));
         ck(trace+' unaffected other ids',!fullIds.has(999));
         if(pat.name==='all-day'){
          const eff=effectiveAbsenceForDate(rows[0],date);
          ck(trace+' all-day effective',expectedKind==='full'?eff?.kind==='full':eff===null);
         }
         samples++;
        }
       }
      }
     }finally{Object.assign(state,old)}
     return{pass,fail,issues,samples,shifts};
    });
    pass+=data.pass;fail+=data.fail+errors.length;contexts++;sampleCount+=data.samples;
    if(data.fail||errors.length)issues.push({tz,mobile,oracle:data.issues,errors:errors.slice(0,4),shifts:data.shifts});
   }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1600)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1600)})}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
 console.log('QA286_ABSENCE_COVERAGE_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,samples:sampleCount,sha256:hash,issues}));
 if(fail)process.exitCode=1;
})();
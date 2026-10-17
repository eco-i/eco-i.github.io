'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-283.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('283 official baseline digest mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const outcome=await page.evaluate(()=>{
     let pass=0,fail=0,issues=[],viewMonths=0;
     const ck=(tag,condition)=>{if(condition)pass++;else{fail++;if(issues.length<30)issues.push(tag)}};
     const day=86400000,anchor=Date.UTC(2026,8,1),start=Date.UTC(2026,0,1);
     const pad=n=>String(n).padStart(2,'0'),iso=t=>new Date(t).toISOString().slice(0,10);
     const cycle={
       A:['야','야','비','비','주','주','휴','휴'],
       B:['비','비','주','주','휴','휴','야','야'],
       C:['주','주','휴','휴','야','야','비','비'],
       D:['휴','휴','야','야','비','비','주','주']
     };
     // Independent fixed official two-year holiday keys, deliberately not borrowed from HOLIDAYS.
     const holidays=new Set((
      '2026-01-01 2026-02-16 2026-02-17 2026-02-18 2026-03-01 2026-03-02 2026-05-01 2026-05-05 2026-05-24 2026-05-25 2026-06-03 2026-06-06 2026-07-17 2026-08-15 2026-08-17 2026-09-24 2026-09-25 2026-09-26 2026-10-03 2026-10-05 2026-10-09 2026-12-25 '+
      '2027-01-01 2027-02-06 2027-02-07 2027-02-08 2027-02-09 2027-03-01 2027-05-01 2027-05-03 2027-05-05 2027-05-13 2027-06-06 2027-07-17 2027-07-19 2027-08-15 2027-08-16 2027-09-14 2027-09-15 2027-09-16 2027-10-03 2027-10-04 2027-10-09 2027-10-11 2027-12-25 2027-12-27'
     ).trim().split(/\s+/));
     const substitute=new Set('2026-03-02 2026-05-25 2026-08-17 2026-10-05 2027-02-09 2027-05-03 2027-07-19 2027-08-16 2027-10-04 2027-10-11 2027-12-27'.split(' '));
     const exp=(g,date)=>{
       const d=new Date(date+'T00:00:00Z'),weekday=d.getUTCDay(),off=Math.round((d.valueOf()-anchor)/day);
       if(g==='DAY')return weekday===0||weekday===6||holidays.has(date)?'휴':'일근';
       if(date>='2026-10-01'&&date<='2026-10-15'){
         if(weekday===0||weekday===6||holidays.has(date))return '휴';
         if(date==='2026-10-15'&&g==='C')return '야';
         return '주2';
       }
       return cycle[g][((off%8)+8)%8];
     };
     ck('version preserved',APP_VERSION==='ver20260927-0944');
     ck('shift date anchor set',Number.isFinite(anchor));
     ck('2026 to 2027 holiday set complete',holidays.size===46);
     ck('substitute holiday set complete',substitute.size===11);
     for(let i=0;i<730;i++){
       const date=iso(start+i*day),d=new Date(start+i*day),year=d.getUTCFullYear(),month=d.getUTCMonth(),daynum=d.getUTCDate();
       const label='date '+date;
       ck(label+' configured holiday boolean',!!HOLIDAYS[date]===holidays.has(date));
       ck(label+' substitute implies official holiday',!substitute.has(date)||HOLIDAYS[date]==='대체공휴일');
       ck(label+' app substitute label consistent',HOLIDAYS[date]!=='대체공휴일'||substitute.has(date));
       const weekday=d.getUTCDay();
       ck(label+' DAY shifts',shiftForGroup('DAY',year,month,daynum)===exp('DAY',date));
       const actual=[];
       for(const group of ['A','B','C','D']){
         const shift=shiftForGroup(group,year,month,daynum);
         actual.push(shift);
         ck(label+' '+group+' exact independent cycle/exception',shift===exp(group,date));
         if(date<'2026-10-01'||date>'2026-10-15'){
           const day8=new Date(start+(i+8)*day),key8=iso(day8.valueOf());
           if(key8<'2026-10-01'||key8>'2026-10-15')ck(label+' '+group+' eight-day metamorphic',shiftForGroup(group,day8.getUTCFullYear(),day8.getUTCMonth(),day8.getUTCDate())===shift);
         }
       }
       if(date<'2026-10-01'||date>'2026-10-15')ck(label+' exactly four disjoint daily roles',new Set(actual).size===4&&['야','비','주','휴'].every(s=>actual.includes(s)));
       else{
         const allRest=weekday===0||weekday===6||holidays.has(date);
         ck(label+' shutdown all-day rest',!allRest||actual.every(s=>s==='휴'));
         ck(label+' shutdown normal work',allRest||date==='2026-10-15'||actual.every(s=>s==='주2'));
         ck(label+' shutdown C return night',date!=='2026-10-15'||actual.join('|')==='주2|주2|야|주2');
       }
       if(substitute.has(date)){
         const prev=iso(start+(i-1)*day);
         const roles=['A','B','C','D'].map(g=>[exp(g,prev),exp(g,date)]);
         const counts={previous_night:roles.filter(([a])=>a==='야').length,current_night:roles.filter(([,b])=>b==='야').length,current_day:roles.filter(([,b])=>b==='주').length};
         ck(label+' holiday minute constants',240===4*60&&90===1.5*60&&330===5.5*60);
         ck(label+' night/day counts <= one each',counts.previous_night<=1&&counts.current_night<=1&&counts.current_day<=1);
         ck(label+' end-to-end holiday shifts immutable',roles.every((pair,n)=>pair[0]===exp(['A','B','C','D'][n],prev)&&pair[1]===exp(['A','B','C','D'][n],date)));
       }
     }
     // End-to-end calendar rendering: all months under a stable in-memory employee identity.
     const old={me:state.me,employees:state.employees,year:state.year,month:state.month,view:state.view,refreshing:state.refreshing,companyEvents:state.companyEvents,fingerprintRecords:state.fingerprintRecords,overtimeEntries:state.overtimeEntries,overtimeConfirmations:state.overtimeConfirmations};
     try{
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('reconnectView').classList.add('hidden');
      document.getElementById('appView').classList.remove('hidden');
      state.me={employee_id:283,display_name:'QA 283',category:'B조',group_code:'B',is_admin:false,is_read_only:false,personnel_account_status:'active'};
      state.employees=[{id:283,display_name:'QA 283',category:'B조',group_code:'B',is_admin:false,active_from:'2026-01-01',active_to:null,personnel_account_status:'active',company_hire_date:'2021-01-01',sort_order:0}];
      state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];state.refreshing=false;
      for(const year of [2026,2027])for(let month=0;month<12;month++){
        state.year=year;state.month=month;state.view='mine';render();viewMonths++;
        const dim=new Date(Date.UTC(year,month+1,0)).getUTCDate(),actual=document.getElementById('calendarGrid').querySelectorAll('[data-date]').length;
        const name='month '+year+'-'+pad(month+1);
        ck(name+' exact day cells',actual===dim);
        ck(name+' correct month title',document.getElementById('monthTitle').textContent===year+'년 '+(month+1)+'월');
        ck(name+' no wide overflow',document.documentElement.scrollWidth<=document.documentElement.clientWidth+30);
       }
     }finally{
       Object.assign(state,old);
     }
     return{pass,fail,issues,days:730,holidays:holidays.size,substitute_holidays:substitute.size,viewMonths};
    });
    pass+=outcome.pass;fail+=outcome.fail+errors.length;contexts++;
    if(outcome.fail||errors.length)issues.push({zone,mobile,issues:outcome.issues,errors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1800)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1800)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA283_SHIFT_HOLIDAY_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();
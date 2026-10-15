'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-260.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('SHA drift');
(async()=>{let srv,browser,pass=0,fail=0,results=[];
try{
 srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const width of [320,360,390,430,768,1024,1280])for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<=430,hasTouch:width<=430,deviceScaleFactor:width<=430?2:1});
  const p=await ctx.newPage(),err=[];p.on('pageerror',e=>err.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(180);
  const d=await p.evaluate(theme=>{
   document.documentElement.dataset.theme=theme;
   const loginButton=$('loginBtn'),loginRect=loginButton.getBoundingClientRect();
   const login={scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,btnVisible:loginRect.width>0&&loginRect.left>=-2&&loginRect.right<=innerWidth+2};
   $('loginView').classList.add('hidden');$('reconnectView').classList.add('hidden');$('appView').classList.remove('hidden');
   state.me={employee_id:260,display_name:'테스트 관리자',category:'B조',group_code:'B',is_admin:false,is_read_only:false};
   state.employees=[{id:260,display_name:'테스트 관리자',category:'B조',group_code:'B',active_from:'2026-01-01',active_to:null,company_hire_date:'2021-01-01',sort_order:0,is_admin:false,personnel_account_status:'active'}];
   state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];
   state.view='mine';state.year=2027;state.month=11;state.refreshing=false;
   render();
   const appRect=$('appView').getBoundingClientRect();
   const activeTabs=document.querySelectorAll('.tab.active').length;
   const cells=$('calendarGrid').querySelectorAll('[data-date]').length;
   const showCalendar=!$('calendarCard').classList.contains('hidden');
   const app={scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,appLeft:appRect.left,appWidth:appRect.width,cells,showCalendar,month:$('monthTitle').textContent,activeTabs};
   return {login,app};
  },theme);
  const checks=[d.login.btnVisible,d.app.showCalendar,d.app.month==='2027년 12월',d.app.activeTabs===1,d.app.cells>=28,d.login.scroll<=d.login.client+5,d.app.scroll<=d.app.client+30,err.length===0];
  pass+=checks.filter(Boolean).length;fail+=checks.filter(x=>!x).length;
  results.push({width,theme,checks,d,err:err.slice(0,2)});
  await ctx.close();
 }
}catch(e){fail++;results.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA260_RESPONSIVE_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha,results:results.filter(x=>x.checks?.some(y=>!y)).slice(0,12),all:results.map(x=>({width:x.width,theme:x.theme,loginOver:x.d?.login?.scroll-x.d?.login?.client,appOver:x.d?.app?.scroll-x.d?.app?.client,calendarCells:x.d?.app?.cells}))}));
if(fail)process.exitCode=1;
})();
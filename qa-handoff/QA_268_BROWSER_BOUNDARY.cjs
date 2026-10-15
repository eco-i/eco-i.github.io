'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.before-2-8-268.html','utf8');
const sha=crypto.createHash('sha256').update(source).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('264 immutable baseline mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,issues=[],details=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const width of [360,390,1280]){
   const mobile=width<500;
   const cx=await browser.newContext({viewport:{width,height:mobile?820:900},timezoneId:zone,isMobile:mobile,hasTouch:mobile});
   const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
   const out=await page.evaluate(()=>{
    let pass=0,fail=0,issues=[];
    const ck=(label,ok)=>{if(ok)pass++;else{fail++;if(issues.length<16)issues.push(label)}};
    const m='ver20260927-0944';
    ck('version',APP_VERSION===m);
    ck('login shown',!$('loginView').classList.contains('hidden'));
    ck('no app before auth',$('appView').classList.contains('hidden'));
    ck('login native button',$('loginBtn')?.tagName==='BUTTON');
    ck('login error alert',$('loginError')?.getAttribute('role')==='alert');
    ck('file input exists',$('fingerprintPhotoInput')?.tagName==='INPUT');
    ck('file picker type',$('fingerprintPhotoInput')?.type==='file');
    const dangerous=['<img src=x onerror=alert(1)>','a&b<c>','"&\u0027','한글 😀 🎆'];
    for(const s of dangerous){const holder=document.createElement('div');holder.innerHTML=escapeHtml(s);
      ck('escaping dangerous input '+s,holder.textContent===s&&holder.querySelectorAll('*').length===0);}
    const cases=[
     [2026,8,30,null],[2026,9,1,'주2'],[2026,9,2,'주2'],
     [2026,9,3,'휴'],[2026,9,4,'휴'],[2026,9,5,'휴'],
     [2026,9,14,'주2'],[2026,9,15,'주2'],[2026,9,16,null],
     [2027,0,1,null],[2027,11,31,null]];
    for(const [y,mo,d,expect] of cases){
     const iso=String(y)+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
     const group=['A','B','C','D'].map(g=>shiftForGroup(g,y,mo,d));
     ck('valid shift values '+iso,group.every(v=>['야','비','주','휴','주2'].includes(v)));
     if(expect){for(const g of ['A','B','C','D']){
       let target=expect;if(y===2026&&mo===9&&d===15&&g==='C')target='야';
       ck('overhaul oracle '+iso+' '+g,shiftForGroup(g,y,mo,d)===target);
     }}
     if(y===2026&&mo===9&&d===16)ck('end of overhaul restores unique rota',new Set(group).size===4);
     if(y===2027)ck('next-year no overhaul',group.every(v=>v!=='주2'));
    }
    $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');$('reconnectView').classList.add('hidden');
    state.me={employee_id:262,display_name:'262 통합 검수',category:'B조',group_code:'B',is_admin:false,is_read_only:false};
    state.employees=[{id:262,display_name:'262 통합 검수',category:'B조',group_code:'B',active_from:'2026-01-01',active_to:null,is_admin:false,personnel_account_status:'active'}];
    state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];
    state.view='mine';state.refreshing=false;
    for(const [year,month,n] of [[2026,9,31],[2026,11,31],[2027,0,31],[2027,1,28],[2027,11,31]]){
      state.year=year;state.month=month;render();
      ck('rendered month '+year+'/'+month,$('monthTitle')?.textContent===(year+'년 '+(month+1)+'월'));
      ck('calendar count '+year+'/'+month,$('calendarGrid')?.querySelectorAll('[data-date]').length===n);
      ck('single selected view',document.querySelectorAll('.tab.active').length===1);
      ck('horizontal overflow <=30',document.documentElement.scrollWidth<=document.documentElement.clientWidth+30);
    }
    for(const view of ['mine','all','leave','longservice']){
      state.view=view;renderTabs();
      ck('tab active '+view,document.querySelectorAll('.tab.active').length===1);
      ck('tab aria '+view,document.querySelectorAll('.tab[aria-current="page"]').length===1);
    }
    return {pass,fail,issues,layout:{width:innerWidth,scrollWidth:document.documentElement.scrollWidth}};
   });
   pass+=out.pass;fail+=out.fail+errors.length;
   if(out.fail||errors.length)issues.push({zone,width,fail:out.fail,issues:out.issues,errors:errors.slice(0,3)});
   details.push({zone,width,passed:out.pass,failed:out.fail,overflow:out.layout.scrollWidth-out.layout.width});
   for(const time of ['2026-10-15T14:59:30Z','2026-10-15T15:00:30Z','2026-12-31T14:59:30Z','2026-12-31T15:00:30Z']){
     await page.clock.setFixedTime(new Date(time));
     const d=await page.evaluate(()=>({today:todayKey(),kst:koreaTodayKey()}));
     const expected=new Date(Date.parse(time)+9*3600000).toISOString().slice(0,10);
     if(d.today===expected&&d.kst===expected)pass++;else{fail++;issues.push({zone,width,time,expected,got:d})}
   }
   await cx.close();
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e)})}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
 console.log('QA268_BROWSER_BOUNDARY_SUMMARY',JSON.stringify({pass,fail,sha,contexts:details.length,details,issues}));
 if(fail)process.exitCode=1;
})();
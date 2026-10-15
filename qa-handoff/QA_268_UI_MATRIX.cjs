'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.before-2-8-268.html','utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('264 immutable source mismatch');
(async()=>{let server,browser,pass=0,fail=0,issues=[],profiles=0,months=0;
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(source)});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const width of [320,390,1280]){
  const mobile=width<500,ctx=await browser.newContext({viewport:{width,height:mobile?830:900},timezoneId:zone,isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   let passed=0,failed=0,issues=[],count=0;
   const ck=(label,ok)=>{if(ok)passed++;else{failed++;if(issues.length<18)issues.push(label)}};
   ck('login view visible',!$('loginView').classList.contains('hidden'));
   ck('protected app hidden',$('appView').classList.contains('hidden'));
   ck('login no autocomplete leak',$('loginPin')?.getAttribute('autocomplete')==='current-password');
   ck('login error alert',$('loginError')?.getAttribute('role')==='alert');
   ck('photo input requires file',$('fingerprintPhotoInput')?.type==='file');
   $('loginView').classList.add('hidden');$('reconnectView').classList.add('hidden');$('appView').classList.remove('hidden');
   state.me={employee_id:263,display_name:'QA 263 사용자',category:'B조',group_code:'B',is_admin:false,is_read_only:false,personnel_account_status:'active'};
   state.employees=[{id:263,display_name:'QA 263 사용자',category:'B조',group_code:'B',is_admin:false,active_from:'2026-01-01',active_to:null,personnel_account_status:'active',company_hire_date:'2021-01-01',sort_order:0}];
   state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];state.refreshing=false;
   const seen=[];
   for(const year of [2026,2027])for(let month=0;month<12;month++){
    state.year=year;state.month=month;state.view='mine';
    render();count++;
    const days=new Date(year,month+1,0).getDate();
    const actual=$('calendarGrid').querySelectorAll('[data-date]').length;
    ck('month title '+year+'/'+month,$('monthTitle').textContent===year+'년 '+(month+1)+'월');
    ck('month exact dates '+year+'/'+month,actual===days);
    ck('one active tab '+year+'/'+month,document.querySelectorAll('.tab.active').length===1);
    ck('no page overflow '+year+'/'+month,document.documentElement.scrollWidth<=document.documentElement.clientWidth+30);
    ck('boundary calendar year valid '+year+'/'+month,[28,30,31].includes(actual));
    if(month===0||month===11)seen.push({year,month,days:actual});
   }
   for(const view of ['mine','all','leave','longservice']){
    state.view=view;renderTabs();
    const btn=document.querySelector('.tab[data-view="'+view+'"]');
    ck('single visible tab '+view,document.querySelectorAll('.tab.active').length===1);
    ck('aria-current '+view,document.querySelectorAll('.tab[aria-current="page"]').length===1);
    ck('keyboard focusable '+view,btn?.tagName==='BUTTON'&&btn?.tabIndex===0);
    btn?.focus();ck('focus reachable '+view,document.activeElement===btn);
    ck('leave container switch '+view,$('annualLeaveCard').classList.contains('hidden')===(view!=='leave'));
    ck('longservice switch '+view,$('longServiceCard').classList.contains('hidden')===(view!=='longservice'));
   }
   return {passed,failed,issues,count,seen};
  });
  pass+=result.passed;fail+=result.failed+errors.length;profiles++;months+=result.count;
  if(result.failed||errors.length)issues.push({zone,width,fail:result.failed,issues:result.issues,jsErrors:errors.slice(0,3)});
  await ctx.close();
 }
 // Simulate denied browser storage and Web Locks separately from the 24-month matrix.
 for(const mobile of [false,true])for(const deny of ['local-read','session-read','local-write','session-write','both-read','no-locks']){
  const cx=await browser.newContext({viewport:{width:mobile?390:1280,height:850},isMobile:mobile,hasTouch:mobile});
  await cx.addInitScript(mode=>{
    if(mode==='no-locks'){try{Object.defineProperty(navigator,'locks',{value:undefined,configurable:true})}catch(e){}return}
    const proto=Storage.prototype,originalRead=proto.getItem,originalWrite=proto.setItem;
    proto.getItem=function(k){if((mode==='local-read'||mode==='both-read')&&this===localStorage||(mode==='session-read'||mode==='both-read')&&this===sessionStorage)throw new DOMException('Permission denied','SecurityError');return originalRead.call(this,k)};
    proto.setItem=function(k,v){if(mode==='local-write'&&this===localStorage||mode==='session-write'&&this===sessionStorage)throw new DOMException('Permission denied','SecurityError');return originalWrite.call(this,k,v)};
  },deny);
  const p=await cx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(150);
  const x=await p.evaluate(()=>({login:!$('loginView').classList.contains('hidden'),version:APP_VERSION,disabled:$('loginBtn').disabled,scroll:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  const tests=[x.login,x.version==='ver20260927-0944',x.disabled===false,x.scroll<=5,errs.length===0];
  pass+=tests.filter(Boolean).length;fail+=tests.filter(t=>!t).length;
  if(tests.some(t=>!t))issues.push({mobile,deny,result:x,errors:errs.slice(0,3)});
  await cx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA268_UI_MATRIX_SUMMARY',JSON.stringify({pass,fail,profiles,calendarMonths:months,storageProfiles:12,sha256:hash,issues}));if(fail)process.exitCode=1;
})();
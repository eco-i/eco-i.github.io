'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA261 candidate changed');
(async()=>{let browser,server,pass=0,fail=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   let pass=0,fail=0,issues=[];const ck=(n,ok)=>{if(ok)pass++;else{fail++;if(issues.length<8)issues.push(n)}};
   ck('login user field has label',$('loginName')?.labels?.[0]?.textContent?.includes('로그인 이름')===true);
   ck('pin field has label',$('loginPin')?.labels?.[0]?.textContent?.includes('비밀번호')===true);
   ck('login button is native button',$('loginBtn')?.tagName==='BUTTON');
   ck('login error aria alert',$('loginError')?.getAttribute('role')==='alert');
   $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');
   state.me={employee_id:261,display_name:'QA 탭 이동',category:'B조',group_code:'B',is_admin:false,is_read_only:false};
   state.employees=[{id:261,display_name:'QA 탭 이동',category:'B조',group_code:'B',is_admin:false,personnel_account_status:'active',active_from:'2026-01-01',active_to:null}];
   state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];state.year=2027;state.month=0;state.refreshing=false;
   for(const view of ['mine','all','leave','longservice']){
     state.view=view;
     renderTabs();
     const active=document.querySelectorAll('.tab.active'),byCurrent=document.querySelectorAll('.tab[aria-current="page"]'),button=document.querySelector('.tab[data-view="'+view+'"]');
     ck('one active view '+view,active.length===1&&active[0]===button);
     ck('ARIA current tab '+view,byCurrent.length===1&&byCurrent[0]===button);
     ck('tab supports keyboard '+view,button?.tagName==='BUTTON'&&button?.tabIndex===0);
     button.focus();ck('keyboard focus target '+view,document.activeElement===button);
     ck('calendar toggles '+view,$('calendarCard').classList.contains('hidden')===['leave','longservice'].includes(view));
     ck('annual leave tab toggles '+view,$('annualLeaveCard').classList.contains('hidden')===(view!=='leave'));
     ck('long service tab toggles '+view,$('longServiceCard').classList.contains('hidden')===(view!=='longservice'));
   }
   return {pass,fail,issues};
  });
  pass+=result.pass;fail+=result.fail+errors.length;issues.push({mobile,pass:result.pass,fail:result.fail,issues:result.issues,jsErrors:errors.slice(0,5)});
  await ctx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA261_NAV_A11Y_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha:hash,issues}));
if(fail)process.exitCode=1;
})();
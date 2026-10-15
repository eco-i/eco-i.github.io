'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('source mismatch');
(async()=>{let server,browser,pass=0,fail=0,issues=[],total=0,maxOverflow=0;
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const width of [320,360,390,430,768,1280])for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<=430,hasTouch:width<=430});
  const p=await ctx.newPage(),jsErrors=[];p.on('pageerror',e=>jsErrors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const v=await p.evaluate(theme=>{
   $('loginView').classList.add('hidden');$('reconnectView').classList.add('hidden');$('appView').classList.remove('hidden');
   state.me={employee_id:261,display_name:'글자 확대 테스트',category:'B조',group_code:'B',is_admin:false,is_read_only:false};
   state.employees=[{id:261,display_name:'글자 확대 테스트',category:'B조',group_code:'B',active_from:'2026-01-01',active_to:null,is_admin:false,personnel_account_status:'active'}];
   state.companyEvents=[];state.fingerprintRecords=[];state.overtimeEntries=[];state.overtimeConfirmations=[];
   state.view='mine';state.year=2027;state.month=11;state.refreshing=false;
   applyTheme(theme,false);
   let v=[];
   for(const level of [1,7,11,15,21]){
     applyTextSizeLevel(level,false);render();
     const overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;
     v.push({level,scale:getComputedStyle(document.documentElement).getPropertyValue('--text-scale').trim(),overflow,month:$('monthTitle').textContent,cells:$('calendarGrid').querySelectorAll('[data-date]').length,mode:document.documentElement.dataset.theme,selected:currentTextSizeLevel});
   }
   return v;
  },theme);
  for(const row of v){
   total++;
   const checks=[row.scale.length>0,row.selected===row.level,row.overflow<=2,row.month==='2027년 12월',row.cells===31,row.mode===theme];
   pass+=checks.filter(Boolean).length;fail+=checks.filter(x=>!x).length;
   maxOverflow=Math.max(maxOverflow,row.overflow);
   if(checks.some(x=>!x)&&issues.length<14)issues.push({width,theme,row,checks});
  }
  if(jsErrors.length){fail+=jsErrors.length;issues.push({width,theme,jsErrors:jsErrors.slice(0,4)})}
  await ctx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA261_TEXT_SCALE_SUMMARY',JSON.stringify({pass,fail,contexts:total,maxOverflow,sha,issues}));
if(fail)process.exitCode=1;
})();
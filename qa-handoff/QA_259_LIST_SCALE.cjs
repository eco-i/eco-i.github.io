'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-259.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('baseline mismatch');
(async()=>{let srv,browser,pass=0,fail=0,results=[];
try{
 srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1240,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
  const d=await p.evaluate(()=>{
   const attack='<img src=x onerror="window.__qa259Injected=1"> & 漢字 ✅';
   window.__qa259Injected=0;
   state.me={employee_id:259,display_name:'QA',is_admin:false,is_read_only:false};
   state.companyEventBackendReady=true;
   state.companyEvents=Array.from({length:500},(_,i)=>({id:i+1,start_date:'2027-02-01',end_date:'2027-12-31',memo_text:attack+' #'+i,created_by:259,updated_at:'2026-10-15T10:00:00+09:00'}));
   let start=performance.now();
   renderCompanyEventsList();
   const eventTime=performance.now()-start;
   const events=$('companyEventsBody');
   const eventsRendered=events?.querySelectorAll('.company-event-list-row').length||0;
   const eventsEscaped=eventsRendered===500&&!events.querySelector('img,script,iframe,svg')&&events.textContent.includes(attack);
   state.employees=[{id:259,display_name:'QA',category:'B조',group_code:'B',active_from:'2026-01-01',active_to:null,company_hire_date:'2026-01-01'}];
   state.memoDdays=[];memoListBackendReady=true;memoPastExpanded=true;memoDeleteMode=false;
   $('memoSearch').value='';
   const epoch=Date.UTC(2026,0,1);
   memoListRows=Array.from({length:400},(_,i)=>({id:i+1,memo_date:new Date(epoch+i*86400000).toISOString().slice(0,10),memo_text:attack+' memo '+i}));
   start=performance.now();
   renderMemoList();
   const memoTime=performance.now()-start;
   const memoBody=$('memoListBody');
   const renderedMemos=memoBody?.querySelectorAll('.memo-list-row').length||0;
   const memoEscaped=renderedMemos===400&&!memoBody.querySelector('img,script,iframe,svg')&&memoBody.textContent.includes(attack);
   const rowMax=Array.from(memoBody.querySelectorAll('.memo-list-row')).length;
   return {eventTime,memoTime,eventsRendered,renderedMemos,rowMax,eventsEscaped,memoEscaped,codeExecuted:window.__qa259Injected!==0,version:APP_VERSION};
  });
  const checks=[d.eventsEscaped,d.memoEscaped,!d.codeExecuted,d.version==='ver20260927-0944',d.eventTime<10000,d.memoTime<10000,errors.length===0];
  pass+=checks.filter(Boolean).length;fail+=checks.filter(x=>!x).length;
  results.push({mobile,d,checks,errors:errors.slice(0,4)});
  await ctx.close();
 }
}catch(e){fail++;results.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(done=>srv.close(done))}
console.log('QA259_LIST_SCALE_SUMMARY',JSON.stringify({passed:pass,failed:fail,results,sha}));if(fail)process.exitCode=1;
})();
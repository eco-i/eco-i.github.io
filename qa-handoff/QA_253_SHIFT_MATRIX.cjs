'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');const html=fs.readFileSync('qa-handoff/index.before-2-8-253.html','utf8');
if(crypto.createHash('sha256').update(html).digest('hex')!=='32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb')throw Error('253 shift matrix wrong baseline');
(async()=>{let srv,browser;try{srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(res=>srv.listen(0,'127.0.0.1',res));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});const ctx=await browser.newContext({viewport:{width:1024,height:800}}),p=await ctx.newPage();await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
const stats=await p.evaluate(()=>{
 let pass=0,fail=0,samples=[];const ck=(cond,id,got)=>{if(cond)pass++;else{fail++;if(samples.length<12)samples.push({id,got})}};
 const special=k=>k>='2026-10-01'&&k<='2026-10-15';
 for(let day=0;day<730;day++){const dt=new Date(Date.UTC(2026,0,1+day)),y=dt.getUTCFullYear(),m=dt.getUTCMonth(),d=dt.getUTCDate(),key=dateKey(y,m,d),dt8=new Date(Date.UTC(y,m,d+8)),key8=dateKey(dt8.getUTCFullYear(),dt8.getUTCMonth(),dt8.getUTCDate());
  if(y>2027)continue;const wd=new Date(y,m,d).getDay(),holiday=!!HOLIDAYS[key];const expectedDay=(wd===0||wd===6||holiday)?'휴':'일근';
  ck(shiftForGroup('DAY',y,m,d)===expectedDay,'office-day-'+key,shiftForGroup('DAY',y,m,d));
  for(const group of ['A','B','C','D']){
    const shift=shiftForGroup(group,y,m,d);ck(['주','야','휴','비','주2'].includes(shift),'allowed-'+group+key,shift);
    if(special(key)){const expected=(wd===0||wd===6||holiday)?'휴':(group==='C'&&key==='2026-10-15'?'야':'주2');ck(shift===expected,'overhaul-'+group+key,shift);}
    if(!special(key)&&!special(key8)){const t=shiftForGroup(group,dt8.getUTCFullYear(),dt8.getUTCMonth(),dt8.getUTCDate());ck(shift===t,'8cycle-'+group+key,shift+' vs '+t);}
  }
 }
 for(const group of ['A','B','C','D']){const start=new Date(2027,5,4),tally={};for(let i=0;i<8;i++){let d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);let shift=shiftForGroup(group,d.getFullYear(),d.getMonth(),d.getDate());tally[shift]=(tally[shift]||0)+1;}ck(tally['주']===2&&tally['야']===2&&tally['휴']===2&&tally['비']===2,'8day-count-'+group,tally);}
 return {pass,fail,samples};
});
console.log('QA253_SHIFT_SUMMARY',JSON.stringify(stats));if(stats.fail)process.exitCode=1;await ctx.close();
}catch(e){console.log('QA253_SHIFT_HARNESS_ERROR',String(e.stack||e));process.exitCode=1;}finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r));}})();

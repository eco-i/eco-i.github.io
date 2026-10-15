'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('source SHA mismatch');
(async()=>{let server,browser,pass=0,fail=0,items=[];
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1250,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const x=await page.evaluate(()=>{
   let pass=0,fail=0,details=[],days=0;
   const check=(name,ok,actual)=>{if(ok)pass++;else{fail++;if(details.length<10)details.push({name,actual})}};
   const groups=['A','B','C','D'];
   const patterns={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
   const anchor=Date.UTC(2026,8,1),utc=d=>new Date(d+'T00:00:00Z');
   const oracle=(group,key)=>{
     const d=utc(key),y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate(),wd=d.getUTCDay();
     if(key>='2026-10-01'&&key<='2026-10-15')return wd===0||wd===6||!!HOLIDAYS[key]?'휴':group==='C'&&key==='2026-10-15'?'야':'주2';
     const phase=((Math.round((Date.UTC(y,m,day)-anchor)/86400000)%8)+8)%8;return patterns[group][phase];
   };
   const names=['가나다<script>alert(1)</script>','테스트 두번째','오늘 새배치','교대근무 안전'];
   const employees=groups.map((g,i)=>({id:i+1,display_name:names[i],category:g+'조',group_code:g,sort_order:i,active_from:'2026-01-01',active_to:null}));
   state.employees=structuredClone(employees);
   const keys=Object.keys(HOLIDAYS).filter(key=>HOLIDAYS[key]==='대체공휴일').sort();
   check('substitute holidays exist',keys.length>=10,keys.length);
   let changed=null;
   for(const key of keys){
     days++;
     const previous=new Date(utc(key).getTime()-86400000).toISOString().slice(0,10);
     const result=substituteHolidayCompensationForDate(key).sort((a,b)=>a.group.localeCompare(b.group));
     const expected=groups.map(g=>{
       let minutes=0;
       if(oracle(g,previous)==='야')minutes+=240;
       if(oracle(g,key)==='야')minutes+=90;
       if(oracle(g,key)==='주')minutes+=330;
       return {group:g,minutes};
     }).filter(x=>x.minutes>0);
     check('correct groups:'+key,JSON.stringify(result.map(({group,minutes})=>({group,minutes})))===JSON.stringify(expected),{result,expected});
     for(const row of result){
       check('valid minutes:'+key+row.group,row.minutes>0&&[90,240,330,420,570,660].includes(row.minutes),row);
       check('visible assigned name:'+key+row.group,row.detail.includes(names[groups.indexOf(row.group)]),row.detail);
     }
     if(!changed)for(const g of groups)if(oracle(g,previous)==='야'&&oracle(g,key)==='야'){changed={key,previous,g};break}
   }
   check('all original shift assignments unchanged',state.employees.length===4);
   const malicious=names[0];
   state.view='all';state.year=2027;state.month=4;
   renderSubstituteHolidayCompensation();
   const view=$('substituteHolidayCompList');
   check('no HTML script injection from names',!view.querySelector('script,img,svg,iframe'),view.innerHTML.slice(0,250));
   check('all rendered holiday compensation has safe names',!String(view.innerHTML).includes('<script>alert(1)</script>'),view.innerHTML.slice(0,250));
   if(changed){
     const {key,previous,g}=changed,groupIndex=groups.indexOf(g);
     const old=structuredClone(employees[groupIndex]);old.id=51;old.display_name='이전근무자';old.active_to=previous;
     const newer={...old,id:52,display_name:'새 근무자',active_from:key,active_to:null};
     state.employees=[...employees.filter(x=>x.group_code!==g),old,newer];
     const split=substituteHolidayCompensationForDate(key).filter(r=>r.group===g);
     check('personnel-boundary split into two salary claims',split.length===2,split);
     check('prior work shift stays old staff',split.some(r=>r.minutes===240&&r.detail.includes('이전근무자')&&!r.detail.includes('새 근무자')),split);
     check('next work shift goes new staff',split.some(r=>r.minutes===90&&r.detail.includes('새 근무자')&&!r.detail.includes('이전근무자')),split);
   }
   return {pass,fail,details,days,changed};
  });
  pass+=x.pass;fail+=x.fail+errors.length;items.push({mobile,passed:x.pass,failed:x.fail,details:x.details,days:x.days,changed:x.changed,errors:errors.slice(0,4)});
  await ctx.close();
 }
}catch(e){fail++;items.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA261_SUBSTITUTE_HOLIDAY_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha,items}));
if(fail)process.exitCode=1;
})();
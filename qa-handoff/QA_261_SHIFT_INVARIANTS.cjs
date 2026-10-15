'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('official source mismatch');
(async()=>{let b,s,pass=0,fail=0,obs=[];
try{
 s=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));
 b=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const cx=await b.newContext({viewport:{width:mobile?390:1270,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await cx.newPage(),jsErrors=[];p.on('pageerror',e=>jsErrors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+s.address().port+'/',{waitUntil:'domcontentloaded'});
  const x=await p.evaluate(()=>{
   let pass=0,fail=0,issues=[],days=0,breakdown={ordinary:0,overhaul:0,holiday:0,day:0};
   const ck=(name,result)=>{if(result)pass++;else{fail++;if(issues.length<14)issues.push(name)}};
   const patterns={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
   const anchor=Date.UTC(2026,8,1);
   for(const yr of [2026,2027])for(let month=0;month<12;month++){
     const dim=new Date(yr,month+1,0).getDate();
     for(let day=1;day<=dim;day++){
       const d=new Date(yr,month,day),key=String(yr)+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0'),wk=d.getDay();
       const regular=!((key>='2026-10-01')&&(key<='2026-10-15'));
       const holiday=!!HOLIDAYS[key],weekend=wk===0||wk===6;
       const diff=Math.round((Date.UTC(yr,month,day)-anchor)/86400000),idx=((diff%8)+8)%8;
       const vals=['A','B','C','D'].map(g=>shiftForGroup(g,yr,month,day));
       if(regular){
         for(const g of ['A','B','C','D'])ck('rotation:'+g+key,shiftForGroup(g,yr,month,day)===patterns[g][idx]);
         ck('one each shift:'+key,['야','비','주','휴'].every(x=>vals.filter(v=>v===x).length===1));
         breakdown.ordinary++;
       }else{
         for(const g of ['A','B','C','D']){const expected=weekend||holiday?'휴':(g==='C'&&key==='2026-10-15'?'야':'주2');ck('overhaul:'+g+key,shiftForGroup(g,yr,month,day)===expected)}
         breakdown.overhaul++;
       }
       ck('DAY independent:'+key,shiftForGroup('DAY',yr,month,day)===(weekend||holiday?'휴':'일근'));
       breakdown.day++;
       ck('invalid group:'+key,shiftForGroup('UNKNOWN',yr,month,day)==='');
       if(holiday)breakdown.holiday++;
       days++;
     }
   }
   // All 8 phases must preserve the cyclic 2-2-2-2 A/B/C/D pattern except explicit overhaul boundaries.
   for(const g of ['A','B','C','D']){
     const actual=[];
     for(let i=0;i<16;i++){const date=new Date(Date.UTC(2027,0,10+i));actual.push(shiftForGroup(g,date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()))}
     ck('8-day cycle '+g,actual.slice(0,8).every((v,i)=>v===actual[i+8]));
   }
   for(const [g,y,m,d,expected] of [['A',2026,9,15,'주2'],['B',2026,9,15,'주2'],['C',2026,9,15,'야'],['D',2026,9,15,'주2'],['A',2026,9,3,'휴'],['C',2026,9,3,'휴']]){
     ck('critical overhaul boundary '+g,shiftForGroup(g,y,m,d)===expected);
   }
   return {pass,fail,issues,days,breakdown};
  });
  pass+=x.pass;fail+=x.fail+jsErrors.length;obs.push({mobile,pass:x.pass,fail:x.fail,issues:x.issues,days:x.days,breakdown:x.breakdown,jsErrors:jsErrors.slice(0,3)});
  await cx.close();
 }
}catch(e){fail++;obs.push({harness:String(e.stack||e)})}
finally{if(b)await b.close();if(s)await new Promise(r=>s.close(r))}
console.log('QA261_SHIFT_INVARIANT_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha,observations:obs}));
if(fail)process.exitCode=1;
})();
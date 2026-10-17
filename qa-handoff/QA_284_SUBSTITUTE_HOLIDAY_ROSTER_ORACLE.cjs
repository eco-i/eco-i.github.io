'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-284.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('284 baseline digest mismatch');
(async()=>{
let browser,server,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const timezoneId of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
  const context=await browser.newContext({timezoneId,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  try{
   const page=await context.newPage(),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(String(e.message||e)));await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
   const out=await page.evaluate(()=>{
    let pass=0,fail=0,issues=[],cases=0,segmented=0,combined=0;
    const ck=(tag,yes)=>{if(yes)pass++;else{fail++;if(issues.length<35)issues.push(tag)}};
    const days=['2026-03-02','2026-05-25','2026-08-17','2026-10-05','2027-02-09','2027-05-03','2027-07-19','2027-08-16','2027-10-04','2027-10-11','2027-12-27'];
    const groups=['A','B','C','D'],roles={A:['야','야','비','비','주','주','휴','휴'],B:['비','비','주','주','휴','휴','야','야'],C:['주','주','휴','휴','야','야','비','비'],D:['휴','휴','야','야','비','비','주','주']};
    const anchor=Date.UTC(2026,8,1),MS=86400000;
    const date=t=>new Date(t).toISOString().slice(0,10);
    const previous=key=>date(Date.parse(key+'T00:00:00Z')-MS);
    const expRole=(group,key)=>{
      const d=new Date(key+'T00:00:00Z'),wd=d.getUTCDay();
      const holiday=new Set(['2026-10-03','2026-10-05','2026-10-09']);
      if(key>='2026-10-01'&&key<='2026-10-15'){
       if(wd===0||wd===6||holiday.has(key))return '휴';
       if(group==='C'&&key==='2026-10-15')return '야';
       return '주2';
      }
      return roles[group][(((Date.parse(key+'T00:00:00Z')-anchor)/MS)%8+8)%8];
    };
    const old={employees:state.employees,personnelAssignments:state.personnelAssignments,personnelBackendReady:state.personnelBackendReady,me:state.me};
    try{
     state.personnelAssignments=[];state.personnelBackendReady=true;state.me=null;
     ck('proper APP_VERSION',APP_VERSION==='ver20260927-0944');
     for(const holiday of days)for(let mask=0;mask<96;mask++){
      const prior=previous(holiday),roster=[];
      // Six tenure-range masks, permuted independently by group; deterministic, no random dependence.
      for(let gi=0;gi<4;gi++)for(let pi=0;pi<3;pi++){
       const code=(mask*7+gi*13+pi*19)%9,id=3100+gi*100+pi,group=groups[gi];
       const bounds=[
        ['2020-01-01','2030-12-31'],
        ['2020-01-01',prior],
        [holiday,'2030-12-31'],
        [holiday,holiday],
        [prior,prior],
        [prior,holiday],
        ['2020-01-01',previous(prior)],
        [date(Date.parse(holiday+'T00:00:00Z')+MS),'2030-12-31'],
        ['2020-01-01','2030-12-31']
       ][code];
       roster.push({id,display_name:'QA_'+group+'_'+pi,group_code:group,category:group+'조',active_from:bounds[0],active_to:bounds[1],sort_order:id,is_admin:false,personnel_account_status:'active'});
      }
      // Independent oracle derives recipients directly from boundary math (not app assignment helper).
      const expected=[];
      for(const group of groups){
       const rules=[{key:prior,shift:'야',minutes:240,label:(new Date(prior+'T00:00:00Z').getUTCMonth()+1)+'/'+new Date(prior+'T00:00:00Z').getUTCDate()+' 야간 4시간'},
        {key:holiday,shift:'야',minutes:90,label:(new Date(holiday+'T00:00:00Z').getUTCMonth()+1)+'/'+new Date(holiday+'T00:00:00Z').getUTCDate()+' 야간 1.5시간'},
        {key:holiday,shift:'주',minutes:330,label:(new Date(holiday+'T00:00:00Z').getUTCMonth()+1)+'/'+new Date(holiday+'T00:00:00Z').getUTCDate()+' 주간 5.5시간'}];
       const parts=[];
       for(const rule of rules){
        if(expRole(group,rule.key)!==rule.shift)continue;
        const people=roster.filter(e=>e.group_code===group&&e.active_from<=rule.key&&e.active_to>=rule.key).sort((a,b)=>a.id-b.id);
        if(!people.length)continue;
        parts.push({ids:people.map(x=>x.id).join(','),minutes:rule.minutes,label:rule.label,names:people.map(x=>x.display_name).join(', ')});
       }
       if(!parts.length)continue;
       const same=parts.every(p=>p.ids===parts[0].ids);
       if(same){expected.push({group,minutes:parts.reduce((n,p)=>n+p.minutes,0),detail:parts[0].names+' · '+parts.map(p=>p.label).join(' + ')});combined++}
       else{for(const p of parts){expected.push({group,minutes:p.minutes,detail:p.names+' · '+p.label});segmented++}}
      }
      state.employees=roster;
      const got=substituteHolidayCompensationForDate(holiday);
      const tag=holiday+' mask='+mask;
      ck(tag+' exact independent recipient segmentation',JSON.stringify(got)===JSON.stringify(expected));
      ck(tag+' app unchanged roster size',state.employees.length===12);
      ck(tag+' valid group',got.every(r=>groups.includes(r.group)));
      ck(tag+' positive valid minutes',got.every(r=>[90,240,330,420,570,660].includes(r.minutes)));
      ck(tag+' no forged names',got.every(r=>r.detail.includes('QA_')&&!r.detail.includes('undefined')));
      ck(tag+' deterministic replay',JSON.stringify(substituteHolidayCompensationForDate(holiday))===JSON.stringify(got));
      ck(tag+' group display ordering',got.every((r,i)=>i===0||groups.indexOf(got[i-1].group)<=groups.indexOf(r.group)));
      const minutes=got.reduce((sum,r)=>sum+r.minutes,0);
      const expectedMinutes=expected.reduce((sum,r)=>sum+r.minutes,0);
      ck(tag+' total minute conservation',minutes===expectedMinutes);
      cases++;
     }
    }finally{Object.assign(state,old)}
    return{pass,fail,issues,cases,segmented,combined,holidays:days.length};
   });
   pass+=out.pass;fail+=out.fail+pageErrors.length;contexts++;
   if(out.fail||pageErrors.length)issues.push({timezoneId,mobile,detail:out.issues,pageErrors:pageErrors.slice(0,4),cases:out.cases});
  }catch(e){fail++;issues.push({timezoneId,mobile,error:String(e.stack||e).slice(0,1700)})}
  finally{await context.close()}
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1700)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA284_SUBSTITUTE_HOLIDAY_ROSTER_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
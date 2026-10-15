'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-260.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA260 source hash drift');
(async()=>{let srv,browser,pass=0,fail=0,items=[];
try{
 srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const cx=await browser.newContext({viewport:{width:mobile?390:1230,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
  const d=await p.evaluate(()=>{
   let pass=0,fail=0,problems=[];const ck=(name,ok)=>{if(ok)pass++;else{fail++;if(problems.length<12)problems.push(name)}};
   const ts='2026-10-15T13:00:00+09:00',audit={id:17,actor_name:'관리자',target_employee_id:8,target_name:'직원',action_type:'update',summary:'근태 변경',created_at:ts};
   const acceptedAudit=v=>{try{return strictAuditRpcRows([v],{maxRows:50}).length===1}catch(_){return false}};
   ck('valid audit',acceptedAudit(audit));
   const auditBad=[
     ['id-0',v=>v.id=0],['id-float',v=>v.id=1.5],['negative-target',v=>v.target_employee_id=-1],
     ['actor-type',v=>v.actor_name=[]],['target-type',v=>v.target_name=7],['action-null',v=>v.action_type=null],
     ['action-empty',v=>v.action_type='  '],['summary-number',v=>v.summary=7],['timestamp-invalid',v=>v.created_at='2026-02-30T00:00:00Z'],
   ];
   for(let i=0;i<100;i++)for(const [name,mutation] of auditBad){
    const v=structuredClone(audit);v.id=i+1;mutation(v);ck('audit:'+i+name,!acceptedAudit(v));
   }
   ck('audit duplicated id',(()=>{try{strictAuditRpcRows([audit,audit]);return false}catch(_){return true}})());
   ck('audit existing id',(()=>{try{strictAuditRpcRows([audit],{existingIds:new Set([17])});return false}catch(_){return true}})());
   ck('audit too many rows',(()=>{try{strictAuditRpcRows([audit,audit],{maxRows:1});return false}catch(_){return true}})());
   const capacity={db_bytes:100,db_limit_bytes:1000000000,storage_bytes:100,storage_limit_bytes:2000000000,public_tables:[{table_name:'employees',bytes:1000},{table_name:'attendance',bytes:1000}]};
   const acceptsCap=v=>{try{return !!strictCapacityUsageRpc(v)}catch(_){return false}};
   ck('valid capacity',acceptsCap(capacity));
   ck('numeric string compatible',acceptsCap({...capacity,db_bytes:'100',db_limit_bytes:'1000000000'}));
   const capBad=[
    ['db-negative',v=>v.db_bytes=-1],['db-nan',v=>v.db_bytes='NaN'],['db-infinite',v=>v.db_bytes=Infinity],
    ['db-limit-zero',v=>v.db_limit_bytes=0],['storage-negative',v=>v.storage_bytes=-1],
    ['storage-limit-zero',v=>v.storage_limit_bytes=0],['tables-not-array',v=>v.public_tables={}],
    ['tables-empty',v=>v.public_tables=[]],['table-name-empty',v=>v.public_tables[0].table_name=' '],
    ['table-bytes-negative',v=>v.public_tables[0].bytes=-1],['table-duplicate',v=>v.public_tables[1].table_name='employees']
   ];
   for(let i=0;i<100;i++)for(const [name,f] of capBad){const v=structuredClone(capacity);f(v);ck('capacity:'+i+name,!acceptsCap(v))}
   const exclusion={id:4,start_date:'2022-01-01',end_date:'2022-02-01',reason:'휴직'};
   const acceptsEx=v=>{try{return strictLongServiceExclusionRpcRows([v],{hireDate:'2021-01-01'}).length===1}catch(_){return false}};
   ck('valid long-service exclusion',acceptsEx(exclusion));
   const exclBad=[
    ['id-zero',v=>v.id=0],['date-invalid',v=>v.start_date='2022-02-30'],['end-invalid',v=>v.end_date='2022-02-30'],
    ['reversed',v=>v.end_date='2021-12-01'],['before-hire',v=>v.start_date='2020-01-01'],
    ['reason-array',v=>v.reason=[]],['reason-overlong',v=>v.reason='x'.repeat(81)]
   ];
   for(let i=0;i<100;i++)for(const [name,f] of exclBad){const v=structuredClone(exclusion);v.id=i+1;f(v);ck('longservice:'+i+name,!acceptsEx(v))}
   ck('longservice hire missing',(()=>{try{strictLongServiceExclusionRpcRows([exclusion],{hireDate:null});return false}catch(_){return true}})());
   ck('longservice duplicate id',(()=>{try{strictLongServiceExclusionRpcRows([exclusion,exclusion],{hireDate:'2021-01-01'});return false}catch(_){return true}})());
   const attack='<img src=x onerror=alert(1)> TEST & 漢字';
   $('auditList').innerHTML='';
   auditRows=[{...audit,id:18,actor_name:attack,target_name:attack,summary:attack,action_type:attack}];
   renderAudit();
   ck('audit markup escape',!$('auditList').querySelector('img,script,iframe,svg')&&$('auditList').textContent.includes(attack));
   return {pass,fail,problems};
  });
  pass+=d.pass;fail+=d.fail+errors.length;items.push({mobile,pass:d.pass,fail:d.fail,problems:d.problems,errors:errors.slice(0,5)});
  await cx.close();
 }
}catch(e){fail++;items.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA260_ADMIN_SECURITY_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha,items}));if(fail)process.exitCode=1;
})();
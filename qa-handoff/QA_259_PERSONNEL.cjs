'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-259.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA259 baseline mismatch');
(async()=>{let srv,browser,passed=0,failed=0,logs=[];
try{
 srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const cx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await cx.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>{
   let pass=0,fail=0,issues=[];const check=(name,ok,v)=>{if(ok)pass++;else{fail++;if(issues.length<7)issues.push({name,v})}};
   const valid={id:41,sort_order:0,display_name:'김검수',login_name:'qaUser41',personnel_account_status:'active',is_admin:false,category:'B조',group_code:'B',active_from:'2026-01-01',active_to:null,company_hire_date:'2021-01-01',employee_origin:null};
   const accepts=r=>{try{return strictEmployeePersonnelRpcRows([r],41).length===1}catch(_){return false}};
   check('valid employee record',accepts(valid));
   check('bigint numeric ID string compatibility',accepts({...valid,id:'41',sort_order:'0'}));
   const corrupt=[
    ['id-zero',r=>r.id=0],['id-float',r=>r.id=2.1],['sort-negative',r=>r.sort_order=-1],
    ['empty-display',r=>r.display_name=' '],['invalid-login',r=>r.login_name='  '],
    ['admin-wrong-type',r=>r.is_admin='false'],['status-null',r=>r.personnel_account_status=null],
    ['status-invalid',r=>r.personnel_account_status='pending'],['category-mismatch',r=>r.category='A조'],
    ['category-unknown',r=>r.category='X조'],['group-invalid',r=>r.group_code='X'],
    ['from-invalid',r=>r.active_from='2026-02-30'],['to-invalid',r=>r.active_to='2027-02-30'],
    ['from-later-than-to',r=>r.active_to='2025-12-31'],
    ['from-null-with-to',r=>{r.active_from=null;r.active_to='2027-01-01'}],
    ['hire-later-than-active',r=>r.company_hire_date='2027-01-01'],
    ['hire-invalid',r=>r.company_hire_date='2021-02-30'],
    ['origin-array',r=>r.employee_origin=[]]
   ];
   for(let i=0;i<64;i++)for(const [name,mut] of corrupt){
    const row=structuredClone(valid);mut(row);
    check('personnel:'+i+':'+name,!accepts(row));
   }
   check('missing identity actor',(()=>{try{strictEmployeePersonnelRpcRows([valid],42);return false}catch(_){return true}})());
   check('duplicate employee ID',(()=>{try{strictEmployeePersonnelRpcRows([valid,{...valid,login_name:'different'}]);return false}catch(_){return true}})());
   check('case insensitive duplicate login',(()=>{try{strictEmployeePersonnelRpcRows([valid,{...valid,id:42,login_name:'QAUSER41'}]);return false}catch(_){return true}})());
   const identity={employee_id:41,display_name:'김검수',is_admin:false,category:'B조',group_code:'B'};
   const acceptsIdentity=r=>{try{return strictEmployeeIdentityRpcRow(r)?.employee_id===41}catch(_){return false}};
   check('valid identity',acceptsIdentity([identity]));
   const mutId=[
    ['missing-list',null],['empty-list',[]],['multiple',[identity,identity]],['wrong-id',[{...identity,employee_id:-1}]],
    ['not-admin-boolean',[{...identity,is_admin:1}]],['unknown-group',[{...identity,group_code:'D'}]],
    ['unknown-category',[{...identity,category:'unknown'}]],['empty-name',[{...identity,display_name:' '}]]
   ];
   for(let rep=0;rep<42;rep++)for(const [name,fixture] of mutId)check('identity:'+rep+':'+name,!acceptsIdentity(fixture));
   const payload='<img src=x onerror=alert(1)> "한국어" & 漢字';
   state.me={employee_id:41,is_admin:true,is_read_only:false};state.employees=[{...valid,display_name:payload}];
   // Always verify the markup helper, independent of administrator unlock.
   const escaped=escapeHtml(payload);
   check('escape employee display',escaped.includes('&lt;img')&&!escaped.includes('<img'));
   return {pass,fail,issues};
  });
  passed+=out.pass;failed+=out.fail+errs.length;logs.push({mobile,passed:out.pass,failed:out.fail,issues:out.issues,pageErrors:errs.slice(0,3)});
  await cx.close();
 }
}catch(e){failed++;logs.push({error:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA259_PERSONNEL_SUMMARY',JSON.stringify({passed,failed,sha,logs}));if(failed)process.exitCode=1;
})();
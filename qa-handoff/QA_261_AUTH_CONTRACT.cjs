'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('261 official baseline digest mismatch');
(async()=>{let browser,server,passed=0,failed=0,observations=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(done=>server.listen(0,'127.0.0.1',done));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   let pass=0,fail=0,issues=[];const ck=(label,correct)=>{if(correct)pass++;else{fail++;if(issues.length<14)issues.push(label)}};
   const token='12345678-1234-4234-9234-123456789abc';
   const valid={token,employee_id:261,display_name:'테스트 직원',is_admin:false,expires_at:'2027-11-30T13:00:00+09:00',category:'B조',group_code:'B'};
   const accepted=r=>{try{return strictLoginRpcRow([r])?.employee_id===261}catch(_){return false}};
   ck('valid login',accepted(valid));
   ck('bigint login employee id',accepted({...valid,employee_id:'261'}));
   const invalid=[
     ['token-missing',r=>delete r.token],['token-nonuuid',r=>r.token='x'.repeat(36)],
     ['token-shape',r=>r.token='12345678123442349234123456789abc'],
     ['token-v7',r=>r.token='12345678-1234-7234-9234-123456789abc'],
     ['token-zero-version',r=>r.token='12345678-1234-0234-9234-123456789abc'],
     ['token-wrong-variant',r=>r.token='12345678-1234-4234-1234-123456789abc'],
     ['employee-zero',r=>r.employee_id=0],['employee-float',r=>r.employee_id=261.5],
     ['name-whitespace',r=>r.display_name='   '],['name-nonstring',r=>r.display_name=[]],
     ['admin-string',r=>r.is_admin='false'],['admin-null',r=>r.is_admin=null],
     ['expires-empty',r=>r.expires_at=''],['expires-invalid-day',r=>r.expires_at='2027-02-30T13:00:00+09:00'],
     ['expires-invalid-time',r=>r.expires_at='2027-11-30T25:00:00+09:00'],
     ['expires-no-timezone',r=>r.expires_at='2027-11-30T13:00:00'],
     ['category-unknown',r=>r.category='E조'],['group-bad',r=>r.group_code='A'],
     ['category-null',r=>r.category=null],['group-null',r=>r.group_code=null]
   ];
   for(let repeat=0;repeat<80;repeat++)for(const [name,mutate] of invalid){
     const row=structuredClone(valid);mutate(row);
     ck('bad-login:'+name+':'+repeat,!accepted(row));
   }
   const sentinel='__INVALID_LOGIN__';
   const invalidLogin={display_name:sentinel,is_admin:false,token:null,employee_id:null,category:null,group_code:null,expires_at:null};
   ck('valid error sentinel',strictLoginRpcRow([invalidLogin]).display_name===sentinel);
   for(const name of ['__INVALID_LOGIN__','__LOGIN_RATE_LIMITED__','__ADMIN_PIN_INVALID__']){
     const row={...invalidLogin,display_name:name};
     ck('sentinel '+name,strictLoginRpcRow([row]).display_name===name);
     for(const [label,bad] of [['token',{token}],['employee',{employee_id:261}],['admin',{is_admin:true}],['group',{group_code:'B'}],['expiry',{expires_at:valid.expires_at}]]){
       let ok=false;try{strictLoginRpcRow([{...row,...bad}])}catch(_){ok=true}
       ck('sentinel bound '+name+label,ok);
     }
   }
   for(const malformed of [null,[],[valid,valid],valid,[null],['hello'],[[valid]]]){
     let ok=false;try{strictLoginRpcRow(malformed)}catch(_){ok=true}ck('malformed list',ok);
   }
   const id={employee_id:261,display_name:'테스트 직원',category:'B조',group_code:'B',is_admin:false};
   ck('identity matching',strictEmployeeIdentityRpcRow([id]).employee_id===261);
   const authBad=[
     ['employee-zero',r=>r.employee_id=0],['employee-decimal',r=>r.employee_id=261.5],
     ['display-empty',r=>r.display_name=' '],['display-array',r=>r.display_name=[]],
     ['admin-number',r=>r.is_admin=1],['bad-category',r=>r.category='Z조'],['bad-group',r=>r.group_code='C']
   ];
   for(let i=0;i<80;i++)for(const [name,mut] of authBad){
     const v=structuredClone(id);mut(v);
     let ok=false;try{strictEmployeeIdentityRpcRow([v])}catch(_){ok=true}
     ck('identity invalid '+name+':'+i,ok);
   }
   return {pass,fail,issues};
  });
  passed+=result.pass;failed+=result.fail+jsErrors.length;observations.push({mobile,pass:result.pass,fail:result.fail,issues:result.issues,pageErrors:jsErrors.slice(0,5)});
  await context.close();
 }
}catch(e){failed++;observations.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA261_AUTH_CONTRACT_SUMMARY',JSON.stringify({passed,failed,sha,observations}));
if(failed)process.exitCode=1;
})();
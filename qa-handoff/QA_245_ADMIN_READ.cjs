'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');
const {chromium}=require('playwright-core');
const source=fs.readFileSync('qa-handoff/index.before-2-8-245.html');
const html=fs.readFileSync('qa-handoff/index.working-2-8-245.html','utf8');
const baseline=crypto.createHash('sha256').update(source).digest('hex');
if(baseline!=='9bfce02ca8be15ae1a59eebec2d3b05d1563784719ebec6308b7537e8fb9d9ab'||source.length!==1168824)throw Error('Official immutable 245 baseline mismatch');
(async()=>{
 let srv,browser;const all=[];
 try{
  srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const mobile of [true,false]){
   const label=mobile?'mobile':'desktop';
   const context=await browser.newContext({viewport:{width:mobile?390:1100,height:844},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0.0.0 Mobile Safari/537.36'}:{})});
   const page=await context.newPage(),pageErrors=[];page.on('pageerror',err=>pageErrors.push(String(err)));
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(350);
   const actual=await page.evaluate(async label=>{
      const oldFetch=window.fetch,oldConfig=window.configured,requests=[];
      const token='qa245adminRead-'+label;
      window.configured=()=>true;
      window.fetch=async(url,opts)=>{if(String(url).includes('/rest/v1/rpc/')){const fn=String(url).split('/').pop();requests.push(fn);return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return oldFetch(url,opts)};
      state.sessionToken=token;state.me={employee_id:245,is_admin:true,display_name:'QA245',is_read_only:false,personnel_account_status:'active'};
      state.initialPinRequired=false;state.accountStatusPersonnelAuthoritative=true;state.employees=[];
      localStorage.setItem(SESSION_KEY,token);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      if(label==='desktop')sessionStorage.setItem(SESSION_KEY,token);
      localStorage.removeItem(ADMIN_UNLOCK_KEY);sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
      const probe=async name=>{const before=requests.length;let error='';
        try{await rpc(name,{p_token:token})}catch(e){error=String(e?.message||e)}
        return {name,sent:requests.length-before,error};
      };
      const forbidden=['list_recent_audit_page','list_personnel_snapshots','list_employee_pin_status'];
      const before=[];for(const name of forbidden)before.push(await probe(name));
      const mine=await probe('list_my_memos');
      if(label==='desktop')sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);else localStorage.setItem(ADMIN_UNLOCK_KEY,token);
      const allowed=[];for(const name of forbidden)allowed.push(await probe(name));
      window.fetch=oldFetch;window.configured=oldConfig;
      return {before,mine,allowed,requests};
   },label);
   for(const x of actual.before){const pass=x.sent===0;all.push(pass);console.log('QA245_'+(pass?'PASS':'FAIL'),label+' revoked '+x.name,JSON.stringify(x))}
   const personal=actual.mine.sent===1;all.push(personal);console.log('QA245_'+(personal?'PASS':'FAIL'),label+' personal read remains usable',JSON.stringify(actual.mine));
   for(const x of actual.allowed){const pass=x.sent===1;all.push(pass);console.log('QA245_'+(pass?'PASS':'FAIL'),label+' unlocked '+x.name,JSON.stringify(x))}
   const errors=pageErrors.length===0;all.push(errors);console.log('QA245_'+(errors?'PASS':'FAIL'),label+' browser exceptions',JSON.stringify(pageErrors));
   await context.close();
  }
 }catch(e){console.log('QA245_HARNESS_ERROR',String(e.stack||e));process.exitCode=1;}
 finally{if(browser)await browser.close();if(srv)await new Promise(resolve=>srv.close(resolve))}
 console.log('QA245_ADMIN_READ_SUMMARY',JSON.stringify({passed:all.filter(Boolean).length,failed:all.filter(x=>!x).length,baseline_sha256:baseline}));
 if(all.some(x=>!x))process.exitCode=1;
})();
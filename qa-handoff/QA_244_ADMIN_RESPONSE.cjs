'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-244.html');
const expected='fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4';
if(crypto.createHash('sha256').update(baseline).digest('hex')!==expected)throw Error('baseline SHA failed');
const html=fs.readFileSync('qa-handoff/index.working-2-8-244.html','utf8'),out=[];
(async()=>{let server,browser;try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const mode of ['mobile','desktop']){
    const opts={viewport:{width:390,height:844},isMobile:mode==='mobile',hasTouch:mode==='mobile'};
    if(mode==='mobile')opts.userAgent='Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36';
    const ctx=await browser.newContext(opts),page=await ctx.newPage();
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(250);
    const data=await page.evaluate(async mode=>{
      const oldConfigured=window.configured,oldFetch=window.fetch;
      const token='qa244-response-'+mode;
      window.configured=()=>true;state.sessionToken=token;state.initialPinRequired=false;
      state.me={employee_id:244,is_admin:true,category:'A',display_name:'QA244',is_read_only:false,personnel_account_status:'active'};
      state.accountStatusPersonnelAuthoritative=true;
      localStorage.setItem(SESSION_KEY,token);localStorage.setItem(ADMIN_UNLOCK_KEY,token);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      if(mode==='desktop'){sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token)}
      async function test(name,revoked){
        let release=null;let began=null;const started=new Promise(resolve=>{began=resolve});
        window.fetch=async(url,options)=>{if(!String(url).includes('/rest/v1/rpc/'))return oldFetch(url,options);
          began();return new Promise(resolve=>{release=()=>resolve(new Response(JSON.stringify({sensitive:'qa244-confidential'}),{status:200,headers:{'Content-Type':'application/json'}}))});
        };
        const response=rpc(name,{p_token:token}).then(value=>({returned:true,value}),e=>({returned:false,error:String(e?.message||e)}));
        await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(Error('fetch never started')),5000))]);
        if(revoked){localStorage.removeItem(ADMIN_UNLOCK_KEY);sessionStorage.removeItem(ADMIN_UNLOCK_KEY)}
        release();
        const resolved=await response;
        if(revoked){if(mode==='desktop')sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);else localStorage.setItem(ADMIN_UNLOCK_KEY,token)}
        return {name,revoked,...resolved};
      }
      const cases=[await test('export_admin_data_v1',true),await test('admin_reset_data_v2',true),await test('export_admin_data_v1',false)];
      window.fetch=oldFetch;window.configured=oldConfigured;
      return {mode,cases};
    },mode);
    for(const test of data.cases){const pass=test.revoked?!test.returned:test.returned;out.push({mode,test,pass});console.log('QA244_RESPONSE_'+(pass?'PASS':'FAIL'),JSON.stringify({mode,...test}));}
    await ctx.close();
  }
}catch(e){console.error('QA244_RESPONSE_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
const failed=out.filter(x=>!x.pass);console.log('QA244_RESPONSE_SUMMARY',JSON.stringify({passed:out.length-failed.length,failed:failed.length,failedNames:failed.map(x=>x.mode+' '+x.test.name+' revoked='+x.test.revoked)}));if(failed.length)process.exitCode=1;
})();
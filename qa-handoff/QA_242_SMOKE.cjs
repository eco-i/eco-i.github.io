'use strict';
// QA 2-8-242: fresh Chromium regression for logout marker arriving while a
// synchronous confirm/prompt is open. No Supabase access, no deployment.
const fs=require('fs'),crypto=require('crypto'),http=require('http'),assert=require('assert');
const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-242.html','utf8');
const baseHash=crypto.createHash('sha256').update(html).digest('hex');
const expected='1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5';
if(baseHash!==expected||Buffer.byteLength(html)!==1165130||!html.includes('ver20260927-0944'))throw Error('QA242 official immutable baseline mismatch');
const observed=[];
function record(name,ok,detail){observed.push({name,pass:!!ok,detail:detail||null});console.log('QA242_'+(ok?'PASS':'FAIL'),name,detail||'');}
(async()=>{
 let server,browser;
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const host='http://127.0.0.1:'+server.address().port+'/';
  for(const setting of [
   {name:'mobile',isMobile:true,hasTouch:true,viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'},
   {name:'pc',isMobile:false,hasTouch:false,viewport:{width:1024,height:768}}
  ]){
   const ctx=await browser.newContext(setting),page=await ctx.newPage();
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
   await page.goto(host,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(350);
   const results=await page.evaluate((variant)=>{
    const out=[],report=(name,actual,expected,detail)=>out.push({name,pass:actual===expected,actual,expected,detail:detail||''});
    const priorConfigured=window.configured,priorConfirm=window.confirm,priorPrompt=window.prompt;
    window.configured=()=>true;
    const key=SESSION_KEY, marker=SHARED_SESSION_LOGOUT_SUPPRESSION_KEY, token='qa242-old-'+variant;
    try{
      localStorage.setItem(key,token);localStorage.removeItem(marker);
      sessionStorage.removeItem(key);
      if(variant==='pc')sessionStorage.setItem(key,token);
      state.sessionToken=token;state.me={employee_id:242,is_admin:true,display_name:'QA242'};state.initialPinRequired=false;
      localStorage.setItem(ADMIN_UNLOCK_KEY,token);
      if(variant==='pc')sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
      const before=fingerprintBlockingPromptSessionSnapshot();
      report(variant+' original snapshot is usable',before.mode,variant==='pc'?'tab':'shared',before.mode);
      localStorage.setItem(marker,token);
      const changed=fingerprintBlockingPromptSessionChanged(before);
      report(variant+' marker invalidates already-issued prompt snapshot',changed,true,'marker arrives AFTER snapshot while shared token stays same');
      report(variant+' current shared ownership already invalidates',sharedPersistentSessionMismatch(),true);
      report(variant+' admin unlock already invalidates',adminUnlockMatches(token),false);
      localStorage.removeItem(marker);
      window.confirm=()=>{localStorage.setItem(marker,token);return true};
      const confirmation=confirmMutationWithSessionGuard('QA242 synthetic confirmation');
      report(variant+' confirm mutation is rejected after in-dialog token revocation',confirmation,false);
      localStorage.removeItem(marker);
      window.prompt=()=>{localStorage.setItem(marker,token);return 'ok'};
      const promptResult=promptMutationWithSessionGuard('QA242 synthetic prompt','');
      report(variant+' prompt mutation is rejected after in-dialog token revocation',promptResult,null);
      localStorage.setItem(marker,token);
      const independent='qa242-independent-B';
      state.sessionToken=independent; state.me.employee_id=243;
      if(variant==='pc'){sessionStorage.setItem(key,independent);sessionStorage.setItem(ADMIN_UNLOCK_KEY,independent)}
      else {localStorage.setItem(key,independent);localStorage.setItem(ADMIN_UNLOCK_KEY,independent);}
      report(variant+' newer independent session unaffected by old marker',storedSessionTombstoned(independent),false);
      report(variant+' newer independent session live',sharedPersistentSessionMismatch(),false);
    }catch(e){out.push({name:variant+' test runtime',pass:false,actual:String(e.stack||e),expected:'no error'})}
    finally{window.confirm=priorConfirm;window.prompt=priorPrompt;window.configured=priorConfigured}
    return out;
   },setting.name);
   for(const x of results)record(x.name,x.pass,JSON.stringify({actual:x.actual,expected:x.expected,detail:x.detail}));
   record(setting.name+' no boot JS exception',pageErrors.length===0,pageErrors.join('\n').slice(0,300));
   await ctx.close();
  }
 }catch(e){record('QA242 harness ran',false,String(e.stack||e));}
 finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
 const fails=observed.filter(x=>!x.pass);
 console.log('QA242_SUMMARY',JSON.stringify({baseline_sha256:baseHash,passed:observed.length-fails.length,failed:fails.length,failed_checks:fails.map(x=>x.name)}));
 if(fails.length)process.exitCode=1;
})();
'use strict';
// QA 2-8-242 genuine two-tab Chrome JavaScript dialog + concurrent Storage mutation.
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const original=fs.readFileSync('qa-handoff/index.before-2-8-242.html','utf8');
const corrected=fs.readFileSync('qa-handoff/index.working-2-8-242.html','utf8');
const expected='1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5';
if(crypto.createHash('sha256').update(original).digest('hex')!==expected)throw Error('241 baseline hash changed');
(async()=>{
 let browser;
 const result=[];
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const [label,html,expectedAccepted] of [['red-original',original,true],['green-candidate',corrected,false]]){
   let server;try{
    server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html);});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin='http://127.0.0.1:'+server.address().port+'/';
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36'});
    const first=await ctx.newPage();const second=await ctx.newPage();
    await first.route('https://cdn.jsdelivr.net/**',r=>r.abort()); await second.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await Promise.all([first.goto(origin,{waitUntil:'domcontentloaded'}),second.goto(origin,{waitUntil:'domcontentloaded'})]);
    await first.waitForTimeout(450);
    const token='qa242-real-dialog-A';
    const setup=await first.evaluate(t=>{window.configured=()=>true;localStorage.setItem(SESSION_KEY,t);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);state.sessionToken=t;state.me={employee_id:242,is_admin:true,display_name:'QA242 two-tab'};return fingerprintBlockingPromptSessionSnapshot().mode},token);
    if(setup!=='shared')throw Error('Unexpected initial shared mode: '+setup);
    // Wait until second tab completes any login-storage-event boot/reload work.
    await second.waitForTimeout(800);
    let markerSet=false,dialogSeen=false,handlerError='';
    first.once('dialog',async dialog=>{dialogSeen=true;try{markerSet=await second.evaluate(t=>{localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,t);return localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)===t},token);}catch(e){handlerError=String(e)}finally{await dialog.accept().catch(()=>{});}});
    const diag=await Promise.race([first.evaluate(()=>{const before=fingerprintBlockingPromptSessionSnapshot();const accepted=confirmMutationWithSessionGuard('Two-tab live Chrome confirm');return {accepted,beforeMode:before.mode,marker:localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY),session:state.sessionToken,tombstoned:storedSessionTombstoned('qa242-real-dialog-A'),afterMode:fingerprintBlockingPromptSessionSnapshot().mode}}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Dialog timed out')),12000))]);
    const accepted=diag.accepted;
    const live={label,setup,dialogSeen,markerSet,accepted,expectedAccepted,handlerError,diag};
    result.push(live);console.log('QA242_REAL_DIALOG',JSON.stringify(live));
    await ctx.close();
   }finally{if(server)await new Promise(r=>server.close(r));}
  }
 }catch(e){console.log('QA242_REAL_DIALOG_ERROR',String(e.stack||e));process.exitCode=1;}
 finally{if(browser)await browser.close();}
 const ok=result.length===2&&result.every(x=>x.dialogSeen&&x.markerSet&&x.accepted===x.expectedAccepted&&!x.handlerError);
 console.log('QA242_REAL_DIALOG_SUMMARY',JSON.stringify({ok,completed:result.length,results:result}));
 if(!ok)process.exitCode=1;
})();
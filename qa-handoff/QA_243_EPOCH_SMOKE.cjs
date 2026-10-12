'use strict';
// QA243 actual Chrome epoch boundary regression: a same-token permission reset
// happens during the asynchronous pre-RPC task introduced by QA242.
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-243.html','utf8');
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-243.html');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const official='c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082';
if(hash(baseline)!==official||baseline.length!==1165913)throw Error('Official 243 baseline mismatch');
const results=[];
(async()=>{
 let browser,server;
 try{
  server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const mode of ['mobile','pc']){
   const opts={viewport:{width:390,height:844},isMobile:mode==='mobile',hasTouch:mode==='mobile'};
   if(mode==='mobile')opts.userAgent='Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile Safari/537.36';
   const ctx=await browser.newContext(opts);const page=await ctx.newPage();
   const errors=[];page.on('pageerror',x=>errors.push(String(x)));
   await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(250);
   const observed=await page.evaluate(async(mode)=>{
      const originalConfigured=window.configured,originalFetch=window.fetch;const captured=[];
      const token='qa243-'+mode+'-same-session';
      window.configured=()=>true;
      window.fetch=async (url,options)=>{if(String(url).includes('/rest/v1/rpc/')){captured.push({url:String(url),body:String(options?.body||'')});return new Response('null',{status:200,headers:{'Content-Type':'application/json'}})}return originalFetch(url,options)};
      state.sessionToken=token;state.me={employee_id:243,is_admin:true,display_name:'QA243',category:'A',is_read_only:false};state.initialPinRequired=false;
      localStorage.setItem(SESSION_KEY,token);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
      if(mode==='pc')sessionStorage.setItem(SESSION_KEY,token);
      const epochBefore=sessionContextEpoch;
      let gateOk=null, gateError='';
      setTimeout(()=>{try{gateOk=enterInitialPinGate({employee_id:243,is_admin:true,display_name:'QA243',category:'A'})}catch(e){gateError=String(e.stack||e)}},0);
      let rpcError='';
      try{await rpc('save_my_memo_v2',{p_token:token,p_memo_date:'2026-10-12',p_memo:'qa243 must not send'});}catch(e){rpcError=String(e.message||e);}
      const duringGateSent=captured.length;
      const epochAfter=sessionContextEpoch,gateRequired=state.initialPinRequired;
      // A protected action started while the mandatory PIN gate is already
      // visible must not be sent; the only necessary write is change_own_pin_v2.
      let gatedWriteError='',gatedExportError='';
      try{await rpc('save_my_memo_v2',{p_token:token,p_memo_date:'2026-10-12',p_memo:'blocked under gate'})}catch(e){gatedWriteError=String(e.message||e)}
      try{await rpc('export_my_data_v1',{p_token:token})}catch(e){gatedExportError=String(e.message||e)}
      const afterGateRestrictedSent=captured.length;
      // A brand-new PIN change after the gate is a legitimate authenticated request
      // and must not be rejected by the stale-request epoch guard.
      let pinError='';
      try{await rpc('change_own_pin_v2',{p_token:token,p_old_pin:'0000',p_new_pin:'1357'})}catch(e){pinError=String(e.message||e)}
      const afterPinSent=captured.length;
      // A concurrent authoritative account lock may arrive while another
      // protected RPC is parked at the QA242 browser-task boundary.
      setInitialPinGateUI(false);
      state.me.is_read_only=false;state.me.is_disabled=false;
      setTimeout(()=>{state.me.is_read_only=true;state.me.personnel_account_status='readonly'},0);
      let readOnlyWriteError='';
      try{await rpc('save_my_memo_v2',{p_token:token,p_memo_date:'2026-10-12',p_memo:'read only must not send'})}catch(e){readOnlyWriteError=String(e.message||e)}
      const afterReadOnlySent=captured.length;
      window.configured=originalConfigured;window.fetch=originalFetch;
      return {mode,epochBefore,epochAfter,gateOk,gateError,gateRequired,duringGateSent,afterGateRestrictedSent,afterPinSent,afterReadOnlySent,rpcError,pinError,gatedWriteError,gatedExportError,readOnlyWriteError,captured:captured.map(x=>x.url.slice(-60))};
   },mode);
   const ok=observed.gateOk===true&&observed.gateRequired&&observed.epochAfter>observed.epochBefore&&observed.duringGateSent===0&&observed.afterGateRestrictedSent===0&&observed.afterPinSent===1&&observed.afterReadOnlySent===1&&!observed.gateError;
   results.push({ok,...observed,pageErrors:errors});
   console.log('QA243_EPOCH_GATE_'+(ok?'PASS':'FAIL'),JSON.stringify({ok,...observed,pageErrors:errors}));
   await ctx.close();
  }
 }catch(e){console.error('QA243_HARNESS_ERROR',String(e.stack||e));process.exitCode=1}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
 const passed=results.filter(x=>x.ok).length;
 console.log('QA243_EPOCH_GATE_SUMMARY',JSON.stringify({passed,failed:results.length-passed,sha256:hash(html),bytes:Buffer.byteLength(html)}));
 if(passed!==2)process.exitCode=1;
})();

'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-254.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb')throw Error('QA254 final candidate SHA mismatch');
(async()=>{let browser,server,pass=0,fail=0;
const check=(name,ok,data)=>{if(ok)pass++;else fail++;console.log('QA254_UI_'+(ok?'PASS':'FAIL'),name,JSON.stringify(data))};
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url==='/blank'?'<!doctype html>other tab':html)});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mode of ['quota-clear','quota-token-delete','normal-clear','isolated-tab']){
  const ctx=await browser.newContext({viewport:{width:1280,height:800}});const page=await ctx.newPage(),other=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const url='http://127.0.0.1:'+server.address().port+'/';
  await Promise.all([page.goto(url),other.goto(url+'blank')]);await page.waitForTimeout(400);
  const token='qa251-ui-'+mode;
  const before=await page.evaluate(({mode,token})=>{
    state.sessionToken=token;state.me={employee_id:251,is_admin:true,display_name:'QA',is_read_only:false};
    const shared=mode==='isolated-tab'?'different-shared-user':token;
    sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    sessionStorage.removeItem(PC_SHARED_AUTHORITY_HISTORY_KEY);
    localStorage.setItem(SESSION_KEY,shared);localStorage.setItem(ADMIN_UNLOCK_KEY,shared);
    localStorage.setItem(PC_REMEMBER_KEY,'1');
    if(mode.startsWith('quota-')){
      const set=Storage.prototype.setItem;
      Storage.prototype.setItem=function(k,v){if(this===sessionStorage&&k===PC_SHARED_AUTHORITY_HISTORY_KEY)throw new DOMException('Full storage','QuotaExceededError');return set.call(this,k,v)};
    }
    const permitted=activeAdminMode();
    return {permitted,token:state.sessionToken,tabToken:sessionStorage.getItem(SESSION_KEY),tabProof:sessionStorage.getItem(ADMIN_UNLOCK_KEY),history:sessionStorage.getItem(PC_SHARED_AUTHORITY_HISTORY_KEY)};
  },{mode,token});
  await other.evaluate(mode=>{if(mode==='quota-token-delete')localStorage.removeItem('staffAttendance_session_v1');else localStorage.clear()},mode);
  await page.waitForTimeout(700);
  const after=await page.evaluate(()=>({permitted:activeAdminMode(),role:state.me?.is_admin??null,token:state.sessionToken,loginHidden:document.getElementById('appView')?.classList.contains('hidden'),tabToken:sessionStorage.getItem(SESSION_KEY)}));
  const shared=mode!=='isolated-tab';
  check(mode+':start-admin-safe',mode.startsWith('quota-')?!before.permitted:before.permitted,{before,after,errors});
  check(mode+':revoked-admin-ui',shared?(!after.permitted&&after.role===null&&!after.token):after.permitted,{before,after,errors});
  check(mode+':tab-scope',mode.startsWith('quota-')?before.tabToken===null:before.tabToken===token,{before,after});
  check(mode+':no-pageerror',errors.length===0,{errors});
  await ctx.close();
 }
}catch(e){fail++;console.error('QA254_UI_HARNESS',e.stack||String(e))}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA254_UI_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha256:sha}));if(fail)process.exitCode=1;
})();
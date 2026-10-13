'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');
const {chromium}=require('playwright-core');
const filename='qa-handoff/index.before-2-8-249.html';
const source=fs.readFileSync(filename);
const sha=crypto.createHash('sha256').update(source).digest('hex');
if(sha!=='9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0')throw Error('249 immutable baseline SHA mismatch: '+sha);
const html=source.toString('utf8');
(async()=>{let browser,server;let failed=0,passed=0;
const check=(name,ok,detail)=>{console.log('QA249_'+(ok?'PASS':'FAIL'),name,JSON.stringify(detail));(ok?passed++:failed++);};
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url==='/blank'?'<!doctype html><title>passive same-origin tab</title>':html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const variant of ['clear-shared','remove-shared','independent-tab']){
  const ctx=await browser.newContext({viewport:{width:1250,height:820}});
  const owner=await ctx.newPage(),peer=await ctx.newPage(),errors=[];
  owner.on('pageerror',e=>errors.push(String(e)));
  await owner.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const origin='http://127.0.0.1:'+server.address().port+'/';
  await Promise.all([owner.goto(origin,{waitUntil:'domcontentloaded'}),peer.goto(origin+'blank',{waitUntil:'domcontentloaded'})]);
  await owner.waitForTimeout(350);
  const token='qa249-dual-token-'+variant,secret='QA249_CONFIDENTIAL_'+variant;
  const before=await owner.evaluate(({token,secret,variant})=>{
    state.sessionToken=token;state.me={employee_id:249,display_name:'QA249',category:'B',is_admin:true,is_read_only:false,personnel_account_status:'active'};
    state.accountStatusPersonnelAuthoritative=true;state.initialPinRequired=false;state.pinStatus={249:true};
    sessionStorage.setItem(SESSION_KEY,token);sessionStorage.setItem(ADMIN_UNLOCK_KEY,token);
    if(variant==='independent-tab'){
      localStorage.setItem(SESSION_KEY,'different-shared-session');
      localStorage.setItem(ADMIN_UNLOCK_KEY,'different-shared-session');
      localStorage.setItem(PC_REMEMBER_KEY,'1');
    }else{
      localStorage.setItem(SESSION_KEY,token);
      localStorage.setItem(ADMIN_UNLOCK_KEY,token);
      localStorage.setItem(PC_REMEMBER_KEY,'1');
    }
    for(const id of ['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList']){
      const n=document.getElementById(id);if(n)n.textContent=secret;
    }
    return {admin:activeAdminMode(),stored:storedSessionToken(),persistent:sessionIsPersistent(token)};
  },{token,secret,variant});
  await peer.evaluate(variant=>{
    if(variant==='remove-shared'){
      localStorage.removeItem('staffAttendance_session_v1');
      localStorage.removeItem('staffAttendance_admin2_ok_v1');
      localStorage.removeItem('staffAttendance_pcRemember_v1');
    }else localStorage.clear();
  },variant);
  await owner.waitForTimeout(600);
  const after=await owner.evaluate(secret=>({
    active:activeAdminMode(),token:state.sessionToken,
    current:storedSessionToken(),mismatch:fingerprintCurrentSharedSessionMismatch(),
    confidentialInDom:['auditList','personnelSnapshotList','capacityBreakdown','safetyBackupList'].some(id=>document.getElementById(id)?.textContent.includes(secret)),
    auditHidden:document.getElementById('adminTools')?.classList.contains('hidden'),
    adminPinCache:state.pinStatus?.[249],
    localToken:localStorage.getItem(SESSION_KEY),tabToken:sessionStorage.getItem(SESSION_KEY)
  }),secret);
  const shouldRevoke=variant!=='independent-tab';
  check(variant+':setup-valid-admin',before.admin===true&&before.stored===token&&before.persistent===(variant!=='independent-tab'),{before,after,errors});
  check(variant+':authorization-scope',shouldRevoke?!after.active:after.active,{before,after,errors});
  check(variant+':protected-dom',shouldRevoke?!after.confidentialInDom:after.confidentialInDom,{before,after,errors});
  check(variant+':javascript-clean',errors.length===0,{errors});
  await ctx.close();
 }
}catch(err){console.error('QA249_DUAL_SCOPE_HARNESS_ERROR',err.stack||String(err));failed++}
finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
console.log('QA249_DUAL_SCOPE_SUMMARY',JSON.stringify({passed,failed,sha}));if(failed)process.exitCode=1;
})();
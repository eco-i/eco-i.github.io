'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-267.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA266 immutable SHA mismatch');
(async()=>{
let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true])for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles']){
const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e.message||e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const x=await p.evaluate(()=>{
let pass=0,fail=0,issues=[];
const ck=(name,ok)=>{if(ok)pass++;else{fail++;if(issues.length<14)issues.push(name)}};
const token='qa267-session-guard',actor=266;
state.me={employee_id:actor,is_admin:false,is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;pageLifecycleFreshnessPending=false;
sessionStorage.clear();localStorage.clear();
const ctx={target:'my',actor,token,contextEpoch:sessionContextEpoch};
ck('initial not tombstoned',!storedSessionTombstoned(token));
localStorage.setItem(SESSION_KEY,token);
ck('local token installed',storageGet(localStorage,SESSION_KEY)===token);
ck('authorized pre-logout',dataRestorePickerContextStillCurrent(ctx,'my')===true);
localStorage.setItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY,token);
ck('marker tombstones token',storedSessionTombstoned(token)===true);
ck('restore rejected on marker',dataRestorePickerContextStillCurrent(ctx,'my')===false);
localStorage.removeItem(SESSION_KEY);
ck('marker persists after removal',storedSessionTombstoned(token)===true);
ck('no stored token revival',storedSessionToken()!==token);
localStorage.setItem(SESSION_KEY,token);
ck('reinjected token remains revoked',storedSessionTombstoned(token)===true);
ck('reinjected token cannot authorize sensitive restore',dataRestorePickerContextStillCurrent(ctx,'my')===false);
localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY);
ck('marker cleanup explicit',storedSessionTombstoned(token)===false);
return {pass,fail,issues};
});
pass+=x.pass;fail+=x.fail+errors.length;contexts++;
if(x.fail||errors.length)issues.push({mobile,tz,checks:x.issues,errors:errors.slice(0,3)});
await cx.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA267_SESSION_GUARD_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
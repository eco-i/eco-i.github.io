'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-258.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('QA258 expected candidate SHA changed');
(async()=>{let browser,server,total=0,unprotected=0,staleVisibility=0,strictPassed=0,errors=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(q.url==='/blank'?'<!doctype html><title>Peer</title>':html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true])for(const kind of ['remove','replace'])for(let i=0;i<12;i++){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1220,height:mobile?834:850},isMobile:mobile});
  const a=await ctx.newPage(),b=await ctx.newPage(),url='http://127.0.0.1:'+server.address().port;
  await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url+'/blank',{waitUntil:'domcontentloaded'})]);
  const setup=await a.evaluate(({kind,i})=>{
   const token='qa258:'+kind+':'+i;window.__token=token;
   window.configured=()=>true;state.me={employee_id:990,is_admin:false,is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;pageLifecycleFreshnessPending=false;
   sessionStorage.clear();localStorage.clear();localStorage.setItem(SESSION_KEY,token);
   window.showLoading=()=>{};window.performSharedSessionReload=()=>{};
   window.__rpcAudit=[];window.__done=false;window.__resolveFile=null;
   window.rpc=async(name)=>{window.__rpcAudit.push({name,seen:localStorage.getItem(SESSION_KEY),token:state.sessionToken,mismatch:fingerprintCurrentSharedSessionMismatch()});throw Error('test rpc only')};
   const payload={format:'workmoa-data-backup',backup_schema_version:1,backup_type:'personal',included_sections:['attendance'],data:{attendance:[]}};
   const file={name:'backup.json',size:300,text:()=>new Promise(r=>{window.__resolveFile=()=>r(JSON.stringify(payload));})};
   const pick={target:'my',actor:990,token,contextEpoch:sessionContextEpoch};
   void prepareMyDataRestore(file,pick).finally(()=>{window.__done=true});
   return {token,readReady:typeof window.__resolveFile==='function'};
  },{kind,i});
  await b.evaluate(({kind,token})=>{if(kind==='remove')localStorage.removeItem('staffAttendance_session_v1');else localStorage.setItem('staffAttendance_session_v1',token+':other')},{kind,token:setup.token});
  const immediate=await a.evaluate(()=>({storage:localStorage.getItem(SESSION_KEY),owner:fingerprintCurrentSharedSessionMismatch()}));
  await a.evaluate(()=>window.__resolveFile());
  await a.waitForFunction(()=>window.__done===true,{timeout:12000});
  const end=await a.evaluate(()=>({rpc:window.__rpcAudit,shared:localStorage.getItem(SESSION_KEY)}));
  const ifStale=immediate.storage===setup.token;
  total++;if(ifStale)staleVisibility++;
  if(end.rpc.some(r=>r.name==='preview_data_restore_v2')){
   if(end.rpc.some(r=>r.seen!==setup.token || r.mismatch)){unprotected++;errors.push({mobile,kind,i,immediate,end})}
   else {strictPassed++;errors.push({classification:'transient-stale-storage',mobile,kind,i,immediate,end})}
  }
  await ctx.close();
 }
}catch(e){unprotected++;errors.push({harnessError:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA258_STORAGE_VISIBILITY_SUMMARY',JSON.stringify({total,staleVisibility,unprotected,transientRpc:strictPassed,examples:errors.slice(0,5),sha}));
if(unprotected)process.exitCode=1;
})();

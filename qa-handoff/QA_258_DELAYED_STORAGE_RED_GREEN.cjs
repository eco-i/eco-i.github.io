'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');const {chromium}=require('playwright-core');
const old=fs.readFileSync('qa-handoff/index.before-2-8-258.html','utf8'),fixed=fs.readFileSync('qa-handoff/index.working-2-8-258.html','utf8');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
if(digest(old)!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9'||digest(fixed)!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA258 RED GREEN candidate drift');
(async()=>{let server,browser,pass=0,fail=0,examples=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(q.url.startsWith('/fixed')?fixed:q.url.startsWith('/original')?old:'<!doctype html>peer')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mode of ['original','fixed'])for(const mobile of [false,true])for(const scope of ['personal','admin'])for(const other of ['remove','replace']){
  const c=await browser.newContext({viewport:{width:mobile?390:1150,height:820},isMobile:mobile,hasTouch:mobile}),a=await c.newPage(),b=await c.newPage(),errs=[];
  a.on('pageerror',e=>errs.push(e.message));
  await a.route('https://cdn.jsdelivr.net/**',r=>r.abort());await b.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const url='http://127.0.0.1:'+server.address().port+'/';await Promise.all([a.goto(url+mode,{waitUntil:'domcontentloaded'}),b.goto(url+'peer',{waitUntil:'domcontentloaded'})]);
  await a.waitForTimeout(300);
  const setting=await a.evaluate(({mode,scope,mobile,other})=>{
   const token='qa258-delayed-storage-'+mode+scope+mobile+other;
   window.configured=()=>true;window.activeAdminMode=()=>true;state.me={employee_id:258,is_admin:scope==='admin',is_read_only:false};state.sessionToken=token;state.initialPinRequired=false;pageLifecycleFreshnessPending=false;
   sessionStorage.clear();localStorage.clear();localStorage.setItem(SESSION_KEY,token);
   window.showLoading=()=>{};window.performSharedSessionReload=()=>{};
   window.__rpcTrace=[];window.__done=false;
   window.rpc=async(name)=>{window.__rpcTrace.push(name);throw Error('mock preview only')};
   const keys=scope==='personal'?['attendance']:['company_events'];
   const payload={format:'workmoa-data-backup',backup_schema_version:1,backup_type:scope,included_sections:keys,data:{[keys[0]]:[]}};
   window.__resolveFile=null;
   const file={name:'backup.json',size:200,text:()=>new Promise(resolve=>{window.__resolveFile=()=>resolve(JSON.stringify(payload))})};
   const pick={target:scope==='personal'?'my':'admin',actor:258,token,contextEpoch:sessionContextEpoch};
   const f=scope==='personal'?prepareMyDataRestore:prepareAdminDataRestore;
   void f(file,pick).finally(()=>{window.__done=true});
   const native=Storage.prototype.getItem;
   window.__staleUntil=Date.now()+140;
   Storage.prototype.getItem=function(k){if(this===localStorage&&k==='staffAttendance_session_v1'&&Date.now()<window.__staleUntil)return token;return native.call(this,k)};
   return {token,pickerReady:typeof window.__resolveFile==='function'};
  },{mode,scope,mobile,other});
  await b.evaluate(({other,token})=>{if(other==='remove')localStorage.removeItem('staffAttendance_session_v1');else localStorage.setItem('staffAttendance_session_v1',token+':other')},{other,token:setting.token});
  await a.evaluate(()=>window.__resolveFile());
  await a.waitForFunction(()=>window.__done===true,{timeout:14000});
  const out=await a.evaluate(()=>({rpc:window.__rpcTrace,shared:localStorage.getItem(SESSION_KEY)}));
  const sent=out.rpc.includes('preview_data_restore_v2');
  const ok=setting.pickerReady&&errs.length===0&&(mode==='original'?sent:!sent);
  if(ok)pass++;else{fail++;examples.push({mode,mobile,scope,other,setting,out,errs})}
  await c.close();
 }
}catch(e){fail++;examples.push({harnessError:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA258_DELAYED_STORAGE_RED_GREEN_SUMMARY',JSON.stringify({passed:pass,failed:fail,expected_old_red:8,expected_new_green:8,examples:examples.slice(0,12),old_sha:digest(old),fixed_sha:digest(fixed)}));
if(fail)process.exitCode=1;
})();

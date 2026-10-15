'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-260.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA260 source SHA mismatch');
(async()=>{let browser,server,pass=0,fail=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true])for(const mode of ['normal','local-read-blocked','local-write-blocked','session-read-blocked','session-write-blocked','all-storage-blocked','web-locks-unavailable']){
  const cx=await browser.newContext({viewport:{width:mobile?390:1260,height:mobile?844:860},isMobile:mobile,hasTouch:mobile});
  await cx.addInitScript(mode=>{
   if(mode==='normal')return;
   if(mode==='web-locks-unavailable'){try{Object.defineProperty(navigator,'locks',{value:undefined,configurable:true})}catch(_){}return}
   const storageProto=Storage.prototype,read=storageProto.getItem,write=storageProto.setItem,remove=storageProto.removeItem;
   storageProto.getItem=function(k){if((mode==='all-storage-blocked')||(mode==='local-read-blocked'&&this===localStorage)||(mode==='session-read-blocked'&&this===sessionStorage))throw new DOMException('Blocked','SecurityError');return read.call(this,k)};
   storageProto.setItem=function(k,v){if((mode==='all-storage-blocked')||(mode==='local-write-blocked'&&this===localStorage)||(mode==='session-write-blocked'&&this===sessionStorage))throw new DOMException('Blocked','SecurityError');return write.call(this,k,v)};
   storageProto.removeItem=function(k){if(mode==='all-storage-blocked')throw new DOMException('Blocked','SecurityError');return remove.call(this,k)};
  },mode);
  const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(260);
  const result=await page.evaluate(()=>({
   loginVisible:!$('loginView').classList.contains('hidden'),btn:$('loginBtn')?.disabled!==true,
   title:document.title,version:APP_VERSION,loginLabel:$('loginBtn')?.textContent?.trim(),
   htmlWidth:document.documentElement.scrollWidth,viewportWidth:document.documentElement.clientWidth,
   stateMe:!!state.me
  }));
  const checks=[result.title.length>0,result.version==='ver20260927-0944',result.loginVisible===true,result.btn===true,result.htmlWidth<=result.viewportWidth+5,errors.length===0];
  pass+=checks.filter(Boolean).length;fail+=checks.filter(x=>!x).length;
  if(checks.some(x=>!x))issues.push({mobile,mode,checks,result,errors:errors.slice(0,6)});
  await cx.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA260_STORAGE_PRIVACY_SUMMARY',JSON.stringify({passed:pass,failed:fail,contexts:14,issues,sha}));if(fail)process.exitCode=1;
})();
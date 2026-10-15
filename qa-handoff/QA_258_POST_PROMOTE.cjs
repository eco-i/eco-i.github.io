'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),assert=require('assert');const {chromium}=require('playwright-core');
const paths=['index.html','qa-handoff/index.before-2-8-258.html','qa-handoff/index.working-2-8-258.html','qa-handoff/index.before-2-8-259.html'];
const old='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9',newSha='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const files=paths.map(p=>fs.readFileSync(p,'utf8'));
assert.equal(sha(files[0]),newSha);assert.equal(sha(files[1]),old);assert.equal(sha(files[2]),newSha);assert.equal(sha(files[3]),newSha);
assert.equal(Buffer.byteLength(files[0]),1175136);
assert(files[0].includes("const APP_VERSION = 'ver20260927-0944';"));
(async()=>{let browser,server,pass=6,fail=0;
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(files[0])});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
 const ctx=await browser.newContext({viewport:{width:mobile?390:1250,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const d=await p.evaluate(()=>({version:APP_VERSION,inlineScripts:document.querySelectorAll('script:not([src])').length,inputCount:document.querySelectorAll('#fingerprintPhotoInput').length,idCount:document.querySelectorAll('[id]').length,guardCount:document.documentElement.outerHTML.split('await new Promise(resolve=>setTimeout(resolve,220));').length-1}));
 const checks=[d.version==='ver20260927-0944',d.inputCount===1,d.idCount===457,d.inlineScripts===2,d.guardCount===2,errors.length===0];
 pass+=checks.filter(Boolean).length;fail+=checks.filter(x=>!x).length;console.log('QA258_INDEX_DEVICE',mobile?'mobile':'desktop',JSON.stringify({checks,errors,detail:d}));await ctx.close();
}
}catch(e){fail++;console.log('QA258_POST_PROMOTE_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA258_POST_PROMOTE_SUMMARY',JSON.stringify({passed:pass,failed:fail,old,new_sha:newSha}));if(fail)process.exitCode=1;
})();

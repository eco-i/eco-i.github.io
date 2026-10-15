'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm'),assert=require('assert'),http=require('http');
const {chromium}=require('playwright-core');
const paths=['index.html','qa-handoff/index.before-2-8-259.html','qa-handoff/index.working-2-8-259.html','qa-handoff/index.before-2-8-260.html'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const data=paths.map(p=>fs.readFileSync(p)),state=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8')),manifest=JSON.parse(fs.readFileSync('qa-handoff/QA_2-8-259_SHA_MANIFEST.json','utf8'));
let passed=0,failed=0;
const check=(name,ok)=>{(ok?passed++:failed++);if(!ok)console.log('QA259_POST_FAIL',name)};
for(let i=0;i<paths.length;i++){check(paths[i]+' SHA',hash(data[i])===expected);check(paths[i]+' 1175136 bytes',data[i].length===1175136);}
check('official 259 done',state.last_completed_block==='2-8-259');
check('official 260 next',state.next_block==='2-8-260');
check('cumulative 540 unchanged',state.cumulative_defects===540);
check('same canonical SHA',state.official_sha256===expected);
check('manifest done',manifest.block==='2-8-259'&&manifest.status==='COMPLETE');
check('app version constant',data[0].toString('utf8').includes("const APP_VERSION = 'ver20260927-0944';"));
check('restore session patch twice',data[0].toString('utf8').split('await new Promise(resolve=>setTimeout(resolve,220));').length===3);
check('SQL unchanged',state.sql_changed===false);
check('operation not deployed',state.deployed===false);
check('report exists',fs.existsSync('qa-handoff/QA_2-8-259_REPORT.md'));
const html=data[0].toString('utf8');
const tags=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
check('two inline scripts',tags.length===2);
for(const c of tags){try{new vm.Script(c);passed++}catch(e){failed++;console.log('QA259_POST_JS_ERROR',e.message)}}
(async()=>{let browser,server;
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const ui=await page.evaluate(()=>({version:APP_VERSION,count:document.querySelectorAll('[id]').length,camera:document.querySelectorAll('#fingerprintPhotoInput').length,scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  check('live Chrome version '+mobile,ui.version==='ver20260927-0944');
  check('live Chrome DOM ID count '+mobile,ui.count===457);
  check('live Chrome photo input '+mobile,ui.camera===1);
  check('live Chrome no horizontal overflow '+mobile,ui.scroll<=ui.viewport+1);
  check('live Chrome no uncaught errors '+mobile,errors.length===0);
  await ctx.close();
 }
}catch(e){failed++;console.log('QA259_POST_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA259_POST_PROMOTE_SUMMARY',JSON.stringify({passed,failed,sha256:expected,files:paths}));
if(failed)process.exitCode=1;
})();

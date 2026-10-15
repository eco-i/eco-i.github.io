'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),vm=require('vm'),{chromium}=require('playwright-core');
const base='qa-handoff/',files=['index.html',base+'index.before-2-8-260.html',base+'index.working-2-8-260.html',base+'index.before-2-8-261.html'];
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af',digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=files.map(f=>fs.readFileSync(f)),state=JSON.parse(fs.readFileSync(base+'CURRENT_STATE.json','utf8')),manifest=JSON.parse(fs.readFileSync(base+'QA_2-8-260_SHA_MANIFEST.json','utf8'));
let pass=0,fail=0,errors=[];const ck=(label,ok)=>{if(ok)pass++;else{fail++;errors.push(label)}};
for(let i=0;i<files.length;i++){ck(files[i]+':SHA',digest(bytes[i])===expected);ck(files[i]+':bytes',bytes[i].length===1175136)}
ck('official last completed 260',state.last_completed_block==='2-8-260');
ck('official next 261',state.next_block==='2-8-261');
ck('defects unchanged from baseline',state.cumulative_defects===540);
ck('official sha',state.official_sha256===expected);
ck('manifest 260 complete',manifest.block==='2-8-260'&&manifest.status==='COMPLETE');
ck('model High preserved',state.model_mode==='High');
ck('20minute verification',state.last_min_20_minutes_confirmed===true);
ck('no deploy or SQL',state.deployed===false&&state.sql_changed===false);
const html=bytes[0].toString('utf8');
ck('version stays pinned',html.includes("const APP_VERSION = 'ver20260927-0944';"));
ck('last restore fix retained twice',html.split('await new Promise(resolve=>setTimeout(resolve,220));').length===3);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
ck('two inline script blocks',scripts.length===2);
for(const s of scripts){try{new vm.Script(s);pass++}catch(e){fail++;errors.push(String(e))}}
(async()=>{let srv,browser;
try{
 srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const w of [320,390,1280]){
  const ctx=await browser.newContext({viewport:{width:w,height:840},isMobile:w<600,hasTouch:w<600});
  const page=await ctx.newPage(),exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>({version:APP_VERSION,title:document.title,ids:document.querySelectorAll('[id]').length,login:!$('loginView').classList.contains('hidden'),camera:$('fingerprintPhotoInput')?.tagName,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  ck('browser version '+w,result.version==='ver20260927-0944');
  ck('browser login visible '+w,result.login===true);
  ck('browser DOM ids '+w,result.ids===457);
  ck('browser camera file input exists '+w,result.camera==='INPUT');
  ck('browser no overflow '+w,result.overflow<=2);
  ck('browser no uncaught errors '+w,exceptions.length===0);
  await ctx.close();
 }
}catch(e){fail++;errors.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA260_POST_PROMOTION_SUMMARY',JSON.stringify({pass,fail,errors:errors.slice(0,10),sha256:expected,files}));if(fail)process.exitCode=1;
})();
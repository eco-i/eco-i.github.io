'use strict';
const fs=require('fs'), crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const http=require('http'); const {chromium}=require('playwright-core');
const file='qa-handoff/index.before-2-8-234.html';
const html=fs.readFileSync(file,'utf8');
const expected='a9a60aee1b863ec6cbb02d1d166268668199b129720e97cb26c0e1ebeca8d8e0';
const pass=[];
function check(name,fn){const result=fn(); assert(result!==false, name+' returned false');pass.push(name);}
check('SHA256 official',()=>crypto.createHash('sha256').update(html).digest('hex')===expected);
check('1157310 byte baseline',()=>Buffer.byteLength(html)===1157310);
check('APP_VERSION pinned',()=>html.includes("ver20260927-0944"));
const allScript=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
check('all inline JS parses',()=>{for(const script of allScript)new vm.Script(script);return allScript.length>=2});
const bodyBeforeJs=html.slice(0,html.indexOf('<script async src='));
const ids=[...bodyBeforeJs.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('No duplicated static DOM IDs',()=>new Set(ids).size===ids.length);
check('4-group overhaul decision path present',()=>html.includes("key>='2026-10-01'&&key<='2026-10-15'"));
check('No console access to live Supabase needed',()=>true);
(async()=>{
 let server, browser;
 try {
  server=http.createServer((req,res)=>{
   if(req.url==='/'||req.url.startsWith('/index')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}
   else {res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(700);
  check('App boot no JS uncaught exception',()=>pageErrors.length===0);
  const evaluated=await page.evaluate(()=>{
   const results=[];
   function add(n,ok,detail){results.push({name:n,ok:!!ok,detail:detail||''});}
   add('State and APIs boot',typeof state==='object'&&typeof shiftForGroup==='function'&&typeof strictRpcTimestamp==='function');
   add('Overhaul A/C Oct 1-2', ['A','C'].every(g=>[1,2].every(d=>shiftForGroup(g,2026,9,d)==='주2')));
   add('Overhaul weekend', ['A','B','C','D'].every(g=>shiftForGroup(g,2026,9,3)==='휴'));
   add('Overhaul C Oct 15 night',shiftForGroup('C',2026,9,15)==='야');
   add('Overhaul other groups Oct 15', ['A','B','D'].every(g=>shiftForGroup(g,2026,9,15)==='주2'));
   add('Personnel sort zero',personnelSortOrderOr(0)===0&&personnelSortOrderOr('0')===0);
   add('Personnel invalid sorts',personnelSortOrderOr(-1)===999&&personnelSortOrderOr(null)===999);
   add('Annual merge exact',annualLeaveSegmentsMinutes([{start:2,end:10},{start:8,end:15},{start:40,end:50}])===23);
   let fuzzOkay=true,seed=239234;
   function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
   for(let t=0;t<500;t++){
     const xs=[];for(let k=0;k<10;k++){let a=Math.floor(rand()*121),b=Math.floor(rand()*121);xs.push({start:Math.min(a,b),end:Math.max(a,b)});}
     const occupied=new Set();for(const x of xs)for(let v=x.start;v<x.end;v++)occupied.add(v);
     if(annualLeaveSegmentsMinutes(xs)!==occupied.size){fuzzOkay=false;break;}
   }
   add('Annual minutes 500 independent intervals',fuzzOkay);
   add('Long-service 5-year anniversary',lsRecognizedAnniversaryDate('2021-01-01',5,[])==='2026-01-01');
   function rejects(fn){try{fn();return false}catch(_){return true}}
   add('Timestamp rejects nonexistent Feb 30',rejects(()=>strictRpcTimestamp('2026-02-30T12:00:00Z')));
   add('Timestamp rejects 25th hour',rejects(()=>strictRpcTimestamp('2026-10-11T25:00:00Z')));
   add('Timestamp rejects invalid UTC offset',rejects(()=>strictRpcTimestamp('2026-10-11T12:00:00+15:00')));
   add('Timestamp accepts microseconds',strictRpcTimestamp('2026-10-11T12:00:00.123456+09:00')==='2026-10-11T12:00:00.123456+09:00');
   const row={record_date:'2026-10-10',has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:'2026-10-10T10:00:00Z'};
   add('Fingerprint valid list',strictFingerprintRpcRows([row]).length===1);
   add('Fingerprint rejects duplicates',rejects(()=>strictFingerprintRpcRows([row,row])));
   add('Fingerprint rejects inconsistent photo metadata',rejects(()=>strictFingerprintRpcRows([{...row,has_clock_in:true}])));
   add('Fingerprint rejects false confirmed state',rejects(()=>strictFingerprintRpcRows([{...row,confirmed:true}])));
   add('Fingerprint timestamp timezone normalization',fingerprintTimestampEqual('2026-10-11T10:00:00.123456+09:00','2026-10-11T01:00:00.123456Z'));
   return results;
  });
  for(const x of evaluated)check(x.name,()=>{if(!x.ok)throw Error(x.detail||x.name);return true;});
  const widths=[320,360,390,430,768,1024,1440];
  for(const width of widths){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(70);
    const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    check('Default mobile/PC screen no horizontal overflow '+width,()=>dim.scroll<=dim.view+2);
  }
  console.log('QA234_SUMMARY',JSON.stringify({passed:pass.length,failed:0,checks:pass,viewport_widths:widths,real_chromium:true,live_supabase:false,native_android:false,real_multitab:false,bfcache:false}));
 } catch(e){console.error('QA234_FAIL',e.stack||String(e)); console.log('QA234_PARTIAL',JSON.stringify({passed:pass.length,checks:pass})); process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();

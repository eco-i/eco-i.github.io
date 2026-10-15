'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-256.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('candidate hash drift');
(async()=>{let srv,br,all=0,fail=0;try{srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));br=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){const c=await br.newContext({viewport:{width:mobile?390:1200,height:800},isMobile:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
const result=await p.evaluate(()=>{
const scopes=[['personal',MY_DATA_SECTION_KEYS],['admin',ADMIN_DATA_SECTION_KEYS]],casesPerScope=4096,found=[];let checked=0;
const versions=[1,'1',true,2,0,null,[1],['1'],' 1 ','1e0'];
for(const [scope,keys] of scopes){for(let n=0;n<casesPerScope;n++){
let m=n*1664525+1013904223|0;
const choose=(mod)=>{m=(Math.imul(m,1664525)+1013904223)|0;return (m>>>0)%mod};
const versionMode=choose(versions.length),formatMode=choose(4),scopeMode=choose(4),sectionMode=choose(5),dataMode=choose(5);
const baseKeys=[keys[0],keys[1]],included=baseKeys.slice();
if(sectionMode===1)included.push(baseKeys[0]);
if(sectionMode===2)included[0]='unauthorized';
if(sectionMode===3)included.length=0;
if(sectionMode===4)included.pop();
let data=Object.fromEntries(baseKeys.map(k=>[k,[]]));
if(dataMode===1)data=[];
if(dataMode===2)data=null;
if(dataMode===3)data.extra=[];
if(dataMode===4)delete data[baseKeys[0]];
const payload={format:formatMode===0?'wrong':'workmoa-data-backup',backup_schema_version:versions[versionMode],backup_type:scopeMode===0?'other':scope,included_sections:included,data};
const oracle=(formatMode!==0&&scopeMode!==0&&versionMode===0&&sectionMode===0&&dataMode===0);
let actual=true;try{parseDataBackupText(JSON.stringify(payload),scope)}catch(e){actual=false}
checked++;if(actual!==oracle&&found.length<20)found.push({scope,n,versionMode,formatMode,scopeMode,sectionMode,dataMode,actual,oracle});
}}
return {checked,found};
});
all+=result.checked;fail+=result.found.length;console.log('QA256_CODEC_'+(result.found.length?'FAIL':'PASS'),mobile?'mobile':'desktop',JSON.stringify(result));if(errors.length){fail+=errors.length;console.log('QA256_CODEC_PAGE_ERRORS',JSON.stringify(errors))}await c.close();
}}catch(e){fail++;console.log('QA256_CODEC_HARNESS_ERROR',String(e.stack||e))}finally{if(br)await br.close();if(srv)await new Promise(r=>srv.close(r))}
console.log('QA256_CODEC_SUMMARY',JSON.stringify({checked:all,fail,sha}));if(fail)process.exitCode=1;})();

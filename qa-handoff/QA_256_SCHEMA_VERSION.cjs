'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-256.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
const oldSha='b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2';
if(sha!==oldSha)throw Error('256 untouched initial source SHA mismatch');
const personal=['attendance','holiday_work'];const admin=['company_events','personnel'];
(async()=>{let srv,br,pass=0,fail=0;const check=(name,ok,v)=>{if(ok)pass++;else fail++;console.log('QA256_VERSION_'+(ok?'PASS':'FAIL'),name,JSON.stringify(v||{}))};
try{srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
br=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){const cx=await br.newContext({viewport:{width:mobile?390:1250,height:850},isMobile:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})}),p=await cx.newPage(),errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
const cases=await p.evaluate(()=>{
const versions=[{n:'numeric-1',v:1,valid:true},{n:'string-1',v:'1',valid:false},{n:'boolean-true',v:true,valid:false},{n:'array-1',v:[1],valid:false},{n:'array-string-1',v:['1'],valid:false},{n:'one-point-zero-string',v:'1.0',valid:false},{n:'scientific-1',v:'1e0',valid:false},{n:'whitespace-1',v:' 1 ',valid:false},{n:'numeric-1-0',v:1.0,valid:true},{n:'numeric-zero',v:0,valid:false},{n:'numeric-2',v:2,valid:false},{n:'null',v:null,valid:false},{n:'missing',v:undefined,valid:false},{n:'object',v:{x:1},valid:false},{n:'empty-array',v:[],valid:false},{n:'zero-string',v:'0',valid:false},{n:'negative-one',v:-1,valid:false}];
const ret=[];
for(const scope of ['personal','admin']){
 const keys=scope==='personal'?['attendance','holiday_work']:['company_events','personnel'];
 for(const {n,v,valid} of versions){
 const payload={format:'workmoa-data-backup',backup_schema_version:v,backup_type:scope,included_sections:keys,data:Object.fromEntries(keys.map(x=>[x,[]]))};
 let accept=true,msg=null;try{parseDataBackupText(JSON.stringify(payload),scope)}catch(e){accept=false;msg=String(e.message)};
 ret.push({scope,name:n,valid,accept,msg});
 }
}
return ret;
});
for(const v of cases)check((mobile?'mobile':'desktop')+':'+v.scope+':'+v.name,v.valid===v.accept,v);
check((mobile?'mobile':'desktop')+':no-browser-exceptions',errs.length===0,{errs});
await cx.close();}
}catch(e){fail++;console.log('QA256_VERSION_HARNESS_ERROR',String(e.stack||e))}finally{if(br)await br.close();if(srv)await new Promise(r=>srv.close(r))}console.log('QA256_VERSION_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha}));if(fail)process.exitCode=1;
})();

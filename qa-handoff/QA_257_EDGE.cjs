'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const {chromium}=require('playwright-core');
const p='qa-handoff/index.before-2-8-257.html', source=fs.readFileSync(p,'utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
const expected='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9';
if(hash!==expected)throw new Error('QA257 baseline hash mismatch '+hash);
const files=['index.html','qa-handoff/index.working-2-8-256.html',p];
for(const file of files)assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected,'QA source mismatch: '+file);
const scripts=[...source.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
assert.equal(scripts.length,2);for(const s of scripts)new vm.Script(s);
const ids=[...source.slice(0,source.indexOf('<script async src=')).matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);
let passed=5,failed=0, observed=[];
const check=(ok,name,data)=>{if(ok)passed++;else{failed++;console.log('QA257_FAIL',name,JSON.stringify(data).slice(0,750))}};
(async()=>{let browser,server;
try{
server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
const cx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,...mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S926N) Chrome/125 Mobile Safari/537.36'}:{}});
const page=await cx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const result=await page.evaluate(async()=>{
let tested=0,failures=[], observations={};
const requireCase=(cond,label,extra)=>{tested++;if(!cond&&failures.length<25)failures.push({label,extra})};
const personal=MY_DATA_SECTION_KEYS,admin=ADMIN_DATA_SECTION_KEYS;
const invalid=[null,undefined,false,true,'1','01','1e0','1.0','+1',' 1 ',[1],['1'],{},[],0,-1,2,1.01,2147483648,1e-9];
for(let scope of ['personal','admin']){
const sections=scope==='personal'?personal:admin;
for(const v of invalid){
const payload={format:'workmoa-data-backup',backup_schema_version:v,backup_type:scope,included_sections:[sections[0]],data:{[sections[0]]:[]}};
let accepted=false;try{parseDataBackupText(JSON.stringify(payload),scope);accepted=true}catch(_){}
requireCase(!accepted,scope+':invalid-version:'+String(v),v);
}
for(let seed=0;seed<768;seed++){
const keys=sections.filter((_,i)=>(seed>>i)&1);if(!keys.length)keys.push(sections[seed%sections.length]);
const rseed=Math.imul(seed+1847,2654435761)>>>0;
const mutate=rseed%12;
const included=keys.slice(),data=Object.fromEntries(keys.map(k=>[k,[]]));
let payload={format:'workmoa-data-backup',backup_schema_version:1,backup_type:scope,included_sections:included,data};
if(mutate===1)payload.included_sections=[...included,included[0]];
if(mutate===2)payload.included_sections=[...included,'unknown_section'];
if(mutate===3)payload.data={...data,unknown_section:[]};
if(mutate===4){payload.data={...data};delete payload.data[included[0]]}
if(mutate===5)payload.included_sections={0:included[0],length:1};
if(mutate===6)payload.data=[];
if(mutate===7)payload.data=null;
if(mutate===8)payload.backup_type=scope==='personal'?'admin':'personal';
if(mutate===9)payload.format='unexpected';
if(mutate===10)payload.backup_schema_version='1';
if(mutate===11)payload.included_sections=null;
let accepted=false;try{parseDataBackupText(JSON.stringify(payload),scope);accepted=true}catch(e){}
requireCase(accepted===(mutate===0),'matrix:'+scope+':'+seed+':'+mutate);
}}
const before=({}).testPrototypePollution;
const payload='{"format":"workmoa-data-backup","backup_schema_version":1,"backup_type":"personal","included_sections":["'+personal[0]+'"],"data":{"'+personal[0]+'":[],"__proto__":{"testPrototypePollution":true}}}';
let protoAccepted=false;try{parseDataBackupText(payload,'personal');protoAccepted=true}catch(_){}
requireCase(!protoAccepted,'reject __proto__ section');
requireCase(({}).testPrototypePollution===before,'no prototype mutation');
const canvas=document.createElement('canvas');canvas.width=3;canvas.height=3;canvas.getContext('2d').fillRect(0,0,3,3);
const imageData=await new Promise(r=>canvas.toBlob(r,'image/png'));
const input=[['valid',new File([imageData],'sample.png',{type:'image/png'})],['invalid',new File([new Uint8Array(100)],'bad.png',{type:'image/png'})],['empty-mime',new File([imageData],'sample.png',{type:''})]];
for(const [tag,file] of input){let answer;try{const v=await compressFingerprintImage(file);answer={accepted:true,mime:v.mime,bytes:v.bytes}}catch(e){answer={accepted:false,error:String(e.message||e)}};observations[tag]=answer;if(tag==='valid')requireCase(answer.accepted&&answer.mime==='image/jpeg','valid jpeg rasterization',answer);if(tag==='invalid')requireCase(!answer.accepted,'reject bogus png',answer)}
return {tested,failures,observations,version:typeof APP_VERSION!=='undefined'?APP_VERSION:null,ids:document.querySelectorAll('[id]').length};
});
check(result.failures.length===0,(mobile?'mobile':'desktop')+':property-errors',result.failures);
passed+=result.tested-result.failures.length;failed+=result.failures.length;
check(result.version==='ver20260927-0944','app version stable',result.version);
check(errors.length===0,'page errors',errors);
observed.push({mobile,tests:result.tested,observations:result.observations,DOM:result.ids});
await cx.close();
}
}catch(e){failed++;console.log('QA257_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA257_EDGE_SUMMARY',JSON.stringify({passed,failed,hash,observed}));if(failed)process.exitCode=1;
})();

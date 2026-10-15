'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-269.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('immutable SHA mismatch');
(async()=>{let browser,server,pass=0,fail=0,contexts=0,issues=[];
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true])for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles']){
const context=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?820:900},isMobile:mobile,hasTouch:mobile});
const p=await context.newPage(),err=[];p.on('pageerror',e=>err.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const x=await p.evaluate(async()=>{
let pass=0,fail=0,issues=[],scenarios=0;
const ck=(name,value)=>{if(value)pass++;else{fail++;if(issues.length<12)issues.push(name)}};
const sourceCanvas=document.createElement('canvas');sourceCanvas.width=1450;sourceCanvas.height=900;
const g=sourceCanvas.getContext('2d');g.fillStyle='#f0f0f0';g.fillRect(0,0,1450,900);
const raw=await new Promise(res=>sourceCanvas.toBlob(res,'image/png'));
const file=new File([raw],'quality-boundary.png',{type:'image/png'});
const original=HTMLCanvasElement.prototype.toBlob;
const sequence=[
 {name:'second-quality-threshold',sizes:[98*1024,92*1024],calls:2,expected:92*1024,dimensions:[1024,900]},
 {name:'third-quality-boundary',sizes:[99*1024,101*1024,108*1024],calls:3,expected:108*1024,dimensions:[1024,900,800]},
 {name:'three-quality-overflow',sizes:[100*1024,100*1024,112*1024],calls:3,error:'사진 용량을 충분히 줄이지 못했습니다.',dimensions:[1024,900,800]},
 {name:'first-quality-small',sizes:[90*1024],calls:1,expected:90*1024,dimensions:[1024]},
 {name:'null-canvas-compression',nullBlob:true,calls:1,error:'사진 압축에 실패했습니다.',dimensions:[1024]}
];
for(const test of sequence){
let calls=0,draws=[];
HTMLCanvasElement.prototype.toBlob=function(cb,mime,quality){
 draws.push({width:this.width,height:this.height,mime,quality});const size=test.sizes?.[Math.min(calls,test.sizes.length-1)]||1;calls++;
 Promise.resolve().then(()=>cb(test.nullBlob?null:new Blob([new Uint8Array(size)],{type:'image/jpeg'})));
};
let value=null,why='';
try{value=await compressFingerprintImage(file)}catch(e){why=String(e.message||e)}
ck('expected calls '+test.name,calls===test.calls);
ck('expected scales '+test.name,draws.every((d,i)=>d.width===test.dimensions[i]));
ck('JPEG encoder mime '+test.name,draws.every(d=>d.mime==='image/jpeg'));
if(test.error){ck('reject '+test.name,why.includes(test.error));ck('no output '+test.name,value===null);}
else{
 ck('success '+test.name,!!value&&!why);
 ck('expected size '+test.name,value?.bytes===test.expected);
 ck('jpeg MIME '+test.name,value?.mime==='image/jpeg');
 ck('base64 data link '+test.name,value?.dataUrl.startsWith('data:image/jpeg;base64,'));
}
scenarios++;
}
HTMLCanvasElement.prototype.toBlob=original;
return {pass,fail,issues,scenarios};
});
pass+=x.pass;fail+=x.fail+err.length;contexts++;if(x.fail||err.length)issues.push({mobile,tz,issues:x.issues,errors:err.slice(0,2)});
await context.close();
}
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA269_IMAGE_FALLBACK_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));if(fail)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-270.html','utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA269 immutable digest mismatch');
(async()=>{let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
 const context=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async()=>{
 let passed=0,failed=0,diagnostics=[],rejected=0;
 const ck=(label,test)=>{if(test)passed++;else{failed++;if(diagnostics.length<15)diagnostics.push(label)}};
 const originalCreate=URL.createObjectURL.bind(URL),originalRevoke=URL.revokeObjectURL.bind(URL);
 const made=[],revoked=[];
 URL.createObjectURL=blob=>{const v=originalCreate(blob);made.push(v);return v};
 URL.revokeObjectURL=url=>{revoked.push(url);return originalRevoke(url)};
 async function fileFor(w,h,name,pattern){
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d');
 g.fillStyle=pattern==='transparent'?'rgba(0,0,0,0)':'#fafafa';g.fillRect(0,0,w,h);
 if(pattern==='checker'){for(let y=0;y<h;y+=40){g.fillStyle=y%80?'#505050':'#d2d2d2';g.fillRect(0,y,w,20)}}
 const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
 return new File([blob],name,{type:'image/png'});
 }
 const dimensions=async dataUrl=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve({width:i.naturalWidth,height:i.naturalHeight});i.onerror=reject;i.src=dataUrl});
 for(const [w,h,name,pattern] of [[1,1,'tiny.png','flat'],[80,100,'small.png','flat'],[1500,750,'wide.png','checker'],[750,1500,'tall.png','checker'],[400,400,'투명 원본.png','transparent'],[250,120,'한'.repeat(150)+'.png','flat'],[64,64,'control\u0007bad.png','flat']]){
  const before=made.length,f=await fileFor(w,h,name,pattern);
  let x=null;try{x=await compressFingerprintImage(f)}catch(e){ck('compress succeeds '+w+'x'+h+' '+pattern,false);continue}
  ck('mime jpeg '+w,x.mime==='image/jpeg');
  ck('data url jpeg '+w,x.dataUrl.startsWith('data:image/jpeg;base64,'));
  ck('base64 exactly '+w,x.base64===fingerprintBase64FromDataUrl(x.dataUrl));
  ck('jpeg header '+w,x.base64.startsWith('/9j/'));
  ck('compressed bounds '+w,x.bytes>0&&x.bytes<=110*1024);
  ck('sanitized filename '+w,x.name.endsWith('.jpg')&&Array.from(x.name).length<=120&&!/[\u0000-\u001f\u007f]/.test(x.name));
  const d=await dimensions(x.dataUrl);
  ck('no upscale '+w,d.width<=w&&d.height<=h);
  ck('max 1024px '+w,Math.max(d.width,d.height)<=1024);
  ck('source URL created '+w,made.length===before+1);
  ck('source URL released '+w,revoked.includes(made[made.length-1]));
 }
 const refuse=async(label,file,phrase)=>{
  const created=made.length;let message='';
  try{await compressFingerprintImage(file)}catch(e){message=String(e.message||e);rejected++}
  ck('reject '+label,!!message&&(!phrase||message.includes(phrase)));
  if(phrase&&phrase.includes('20MB')||phrase&&phrase.includes('사진 파일만'))ck('early reject no blob URL '+label,made.length===created);
 };
 await refuse('null file',null,'사진 파일만');
 await refuse('non-image MIME',new File(['not an image'],'x.txt',{type:'text/plain'}),'사진 파일만');
 await refuse('20MB+ image',new File([new Uint8Array(20*1024*1024+1)],'huge.png',{type:'image/png'}),'20MB');
 await refuse('empty image',new File([],'blank.jpg',{type:'image/jpeg'}),'읽지 못했습니다');
 await refuse('corrupt image',new File([new Uint8Array([0,255,12,84,3])],'corrupt.jpg',{type:'image/jpeg'}),'읽지 못했습니다');
 ck('blob URLs not leaked',made.length===revoked.length&&made.every(x=>revoked.includes(x)));
 URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
 return {pass:passed,fail:failed,diagnostics,rejected,created:made.length,revoked:revoked.length};
 });
 pass+=result.pass;fail+=result.fail+errors.length;contexts++;if(result.fail||errors.length)issues.push({tz,mobile,...result,errors:errors.slice(0,3)});
 await context.close();
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA270_IMAGE_CODEC_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:hash,issues}));
if(fail)process.exitCode=1;
})();
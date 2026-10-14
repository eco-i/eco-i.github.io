'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-254.html','utf8');
if(crypto.createHash('sha256').update(html).digest('hex')!=='056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b')throw Error('253 baseline drift');
(async()=>{let server,browser,pass=0,fail=0;const check=(n,v,extra)=>{(v?pass++:fail++);console.log('QA254_IMAGE_'+(v?'PASS':'FAIL'),n,JSON.stringify(extra||{}));};
try{server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mode of ['desktop','mobile']){
 const mobile=mode==='mobile',ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125.0.0.0 Mobile Safari/537.36'}:{})}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(280);
 const results=await page.evaluate(async()=>{
  const make=async(w,h,transparent=false)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!transparent){g.fillStyle='#336699';g.fillRect(0,0,w,h)}return await new Promise(res=>c.toBlob(res,'image/png'))};
  const valid=await make(120,80),large=await make(3600,2100),transparent=await make(2,2,true);
  const compress=async(blob,name,type='image/png')=>{try{return {ok:true,value:await compressFingerprintImage(new File([blob],name,{type}))}}catch(e){return {ok:false,error:String(e.message||e)}}};
  const simple=await compress(valid,'attendance.print.png');
  const long=await compress(valid,'한'.repeat(180)+'.png');
  const emoji=await compress(valid,'📷_ABC\u0000\u001f.png');
  const huge=await compress(large,'large_dimensions.png');
  const trans=await compress(transparent,'transparent.png');
  const wrong=await compress(valid,'not_photo.txt','text/plain');
  const broken=await compress(new Blob(['bad png data'],{type:'image/png'}),'corrupt.png');
  const tooLarge=await compress(new Blob([new Uint8Array(20*1024*1024+1)],{type:'image/png'}),'over_limit.png');
  const empty=await compress(new Blob([],{type:'image/png'}),'empty.png');
  const white=await new Promise(resolve=>{if(!trans.ok)return resolve(null);const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=2;c.height=2;c.getContext('2d').drawImage(img,0,0,2,2);const px=c.getContext('2d').getImageData(0,0,1,1).data;resolve([...px])};img.onerror=()=>resolve(null);img.src=trans.value.dataUrl});
  const pack=x=>x.ok?{ok:true,name:x.value.name,mime:x.value.mime,bytes:x.value.bytes,b64:x.value.base64.length,dataUrlPrefix:x.value.dataUrl.slice(0,23)}:{ok:false,error:x.error};
  return {simple:pack(simple),long:pack(long),emoji:pack(emoji),huge:pack(huge),trans:pack(trans),wrong:pack(wrong),broken:pack(broken),tooLarge:pack(tooLarge),empty:pack(empty),white};
 });
 const cases={
  'valid-image-is-jpeg':results.simple.ok&&results.simple.mime==='image/jpeg'&&results.simple.name==='attendance.print.jpg',
  'valid-image-blob-small':results.simple.bytes>100&&results.simple.bytes<=110*1024,
  'data-url-jpeg':results.simple.dataUrlPrefix.startsWith('data:image/jpeg;base64,'),
  'long-file-name-at-most-120':results.long.ok&&[...results.long.name].length<=120,
  'control-chars-stripped':results.emoji.ok&&!/[\u0000-\u001f\u007f]/.test(results.emoji.name),
  'large-pixels-compressed':results.huge.ok&&results.huge.bytes<=110*1024,
  'transparent-composited-white':results.trans.ok&&results.white?.slice(0,3).every(x=>x>=245),
  'declared-nonimage-rejected':!results.wrong.ok&&results.wrong.error.includes('사진 파일만'),
  'broken-image-rejected':!results.broken.ok&&results.broken.error.includes('사진을 읽지'),
  'over-20MB-rejected':!results.tooLarge.ok&&results.tooLarge.error.includes('20MB'),
  'zero-byte-rejected':!results.empty.ok,
  'no-runtime-errors':errors.length===0
 };
 for(const [k,v]of Object.entries(cases))check(mode+':'+k,v,{detail:(k.includes('rejected')?results[k.split('-')[0]]:undefined),errors:errors.slice(0,2)});
 console.log('QA254_IMAGE_CASE',mode,JSON.stringify(results));
 await ctx.close();
}
}catch(e){fail++;console.log('QA254_IMAGE_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA254_IMAGE_SUMMARY',JSON.stringify({pass,fail}));if(fail)process.exitCode=1;
})();
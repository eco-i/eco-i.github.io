'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-259.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('baseline SHA mismatch');
(async()=>{let browser,server,pass=0,fail=0,items=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1190,height:mobile?844:850},isMobile:mobile,hasTouch:mobile});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const d=await p.evaluate(async()=>{
   let pass=0,fail=0,details=[];
   const check=(name,ok,d)=>{if(ok)pass++;else{fail++;if(details.length<12)details.push({name,d})}};
   const date='2026-10-15',iso='2026-10-15T10:00:00+09:00';
   const good={record_date:date,has_clock_in:true,has_clock_out:true,confirmed:true,
    clock_in_uploaded_at:iso,clock_out_uploaded_at:iso,confirmed_at:iso,updated_at:iso};
   const accepts=r=>{try{return strictFingerprintRpcRows([r]).length===1}catch(_){return false}};
   check('valid confirmed pair',accepts(good));
   const cases=[
    ['not-date',r=>r.record_date='2026-02-30'],['before-2020',r=>r.record_date='2019-12-31'],['after-2100',r=>r.record_date='2101-01-01'],
    ['not-boolean-in',r=>r.has_clock_in='true'],['not-boolean-out',r=>r.has_clock_out=1],['not-boolean-confirmed',r=>r.confirmed=1],
    ['unconfirmed-at',r=>r.confirmed=false],['missing-in',r=>r.has_clock_in=false],['missing-out',r=>r.has_clock_out=false],
    ['in-inconsistent',r=>r.clock_in_uploaded_at=null],['out-inconsistent',r=>r.clock_out_uploaded_at=null],
    ['confirmed-time-null',r=>r.confirmed_at=null],['timestamp-invalid',r=>r.updated_at='2026-02-30T00:00:00Z'],
    ['timestamp-in-invalid',r=>r.clock_in_uploaded_at='n/a'],['timestamp-out-invalid',r=>r.clock_out_uploaded_at=0],
    ['timestamp-confirmed-invalid',r=>r.confirmed_at='2026-10-15T25:00:00Z'],
   ];
   for(let rep=0;rep<64;rep++)for(const [name,m] of cases){
    const obj=structuredClone(good);m(obj);check('record:'+name+':'+rep,!accepts(obj));
   }
   check('range-from-excluded',(()=>{try{strictFingerprintRpcRows([good],{from:'2026-10-16'});return false}catch(_){return true}})());
   check('range-to-excluded',(()=>{try{strictFingerprintRpcRows([good],{to:'2026-10-14'});return false}catch(_){return true}})());
   check('duplicate-day-rejected',(()=>{try{strictFingerprintRpcRows([good,good]);return false}catch(_){return true}})());
   const unsigned={...good,confirmed:false,confirmed_at:null};
   check('valid unconfirmed pair',accepts(unsigned));
   const empty={...good,has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null};
   check('valid no-photo record',accepts(empty));
   const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
   const c=canvas.getContext('2d');c.fillStyle='#789';c.fillRect(0,0,32,32);c.fillStyle='#123';c.fillRect(4,4,23,23);
   const dataUrl=canvas.toDataURL('image/png'),base64=dataUrl.split(',')[1];
   const validFile={mime_type:'image/png',data_base64:base64,filename:'사진.png',uploaded_at:iso};
   const parse=x=>{try{return strictFingerprintPhotoRpcRow(x)}catch(_){return null}};
   check('valid fingerprint photo row',!!parse([validFile]));
   const actual=fingerprintPhotoResponseDataUrl(validFile);
   check('real PNG accepted',actual===dataUrl);
   check('real PNG decodable',await fingerprintPhotoDataUrlDecodable(actual));
   const invalid=[
     ['bad-mime',r=>r.mime_type='text/html'],['name-empty',r=>r.filename='  '],['name-overlong',r=>r.filename='x'.repeat(121)],
     ['base64-null',r=>r.data_base64=null],['base64-empty',r=>r.data_base64=' '],
     ['timestamp-invalid',r=>r.uploaded_at='2026-02-30T00:00:00Z']
   ];
   for(let rep=0;rep<64;rep++)for(const [name,mut] of invalid){const obj=structuredClone(validFile);mut(obj);check('photo:'+name+':'+rep,!parse([obj]));}
   const badData=[
     ['mime-conflict',{...validFile,mime_type:'image/jpeg'}],
     ['base64-tiny',{...validFile,data_base64:btoa('hello')}],
     ['base64-script',{...validFile,data_base64:'<!--<svg/onload=alert(1)>'}],
     ['base64-invalid',{...validFile,data_base64:'@@@@@'}],
     ['data-url-mime-mismatch',{...validFile,data_url:actual,mime_type:'image/jpeg'}],
     ['data-url-scheme',{...validFile,data_url:'javascript:alert(1)'}]
   ];
   for(const [name,obj] of badData){let accepted=false;try{fingerprintPhotoResponseDataUrl(obj);accepted=true}catch(_){}check('photo-response:'+name,!accepted)}
   return {pass,fail,details};
  });
  pass+=d.pass;fail+=d.fail+errors.length;items.push({device:mobile?'mobile':'desktop',passed:d.pass,failed:d.fail,details:d.details,errors:errors.slice(0,5)});
  await ctx.close();
 }
}catch(e){fail++;items.push({error:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA259_FINGERPRINT_SUMMARY',JSON.stringify({passed:pass,failed:fail,items,sha}));if(fail)process.exitCode=1;
})();
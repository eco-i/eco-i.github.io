'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-282.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('282 baseline digest mismatch');
(async()=>{
let server,browser,pass=0,fail=0,contexts=0,issues=[];
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
  const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  try{
   const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
   const out=await page.evaluate(()=>{
    let pass=0,fail=0,issues=[];const ck=(n,ok)=>{if(ok)pass++;else{fail++;if(issues.length<30)issues.push(n)}};
    const DAY=86400000,start=Date.UTC(2026,0,1),utcDate=n=>new Date(n).toISOString().slice(0,10);
    const frac=[0,1000,120000,123456,999999];
    const offsets=[-720,-300,-60,0,330,540,840];
    const pad=(n,w=2)=>String(n).padStart(w,'0');
    const render=(epochMicro,offset,short=false)=>{
      const milli=Math.floor(epochMicro/1000),micro=epochMicro-milli*1000,d=new Date(milli+offset*60000);
      const date=pad(d.getUTCFullYear(),4)+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());
      const hh=pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds());
      const full=pad(d.getUTCMilliseconds()*1000+micro,6),trail=full.replace(/0+$/,'');
      const precision=short?trail:full;
      const zone=offset===0?'Z':(offset<0?'-':'+')+pad(Math.floor(Math.abs(offset)/60))+':'+pad(Math.abs(offset)%60);
      return date+'T'+hh+(precision?'.'+precision:'')+zone;
    };
    const beforeRecords=state.fingerprintRecords,firstValid='2026-02-28T23:59:59.123456Z';
    try{
      ck('same null means no timestamp',fingerprintTimestampEqual(null,null));
      ck('timestamp cannot match missing',!fingerprintTimestampEqual(firstValid,null)&&!fingerprintTimestampEqual(null,firstValid));
      ck('strict date rejects malformed Feb30',(()=>{try{strictRpcTimestamp('2026-02-30T12:00:00Z');return false}catch(e){return true}})());
      ck('strict time rejects 25:00',(()=>{try{strictRpcTimestamp('2026-03-01T25:00:00Z');return false}catch(e){return true}})());
      ck('strict offset rejects >14',(()=>{try{strictRpcTimestamp('2026-03-01T12:00:00+15:00');return false}catch(e){return true}})());
      for(let i=0;i<730;i++){
       const utc=start+i*DAY + ((i%4)*6+5)*3600000+((i%7)*7)*60000 + ((i%11)*5)*1000;
       const key=utcDate(utc),label='date='+key+' i='+i;
       for(const micro of frac){
        const canonical=utc*1000+micro,a=render(canonical,0,false),canonicalShort=render(canonical,0,true);
        ck(label+' fractional exact '+micro,fingerprintTimestampKey(a)===canonical);
        ck(label+' trailing-zero canonical equivalent '+micro,fingerprintTimestampEqual(a,canonicalShort));
        ck(label+' one microsecond must differ '+micro,!fingerprintTimestampEqual(a,render(canonical+1,0,false)));
        for(const off of offsets){
          const b=render(canonical,off,false),short=render(canonical,off,true),tag=label+' micro='+micro+' offset='+off;
          ck(tag+' identical UTC microsecond',fingerprintTimestampKey(b)===canonical);
          ck(tag+' equivalent zone',fingerprintTimestampEqual(a,b)&&fingerprintTimestampEqual(b,a));
          ck(tag+' equivalent precision',fingerprintTimestampEqual(a,short));
          ck(tag+' not next microsecond',!fingerprintTimestampEqual(a,render(canonical+1,off,false)));
          ck(tag+' not previous microsecond',!fingerprintTimestampEqual(a,render(canonical-1,off,false)));
          ck(tag+' strict input accepts legitimate form',(()=>{try{return strictRpcTimestamp(b)===b}catch(e){return false}})());
        }
        if(i%13===0){
          const off=offsets[i%offsets.length],equiv=render(canonical,off,false),stale=render(canonical+1,off,false);
          const row={record_date:key,has_clock_in:true,has_clock_out:false,confirmed:false,clock_in_uploaded_at:a,clock_out_uploaded_at:null,confirmed_at:null,updated_at:a};
          state.fingerprintRecords=[row];
          const before=JSON.stringify(state.fingerprintRecords);
          const no=applyFingerprintMutationHint(key,{action:'delete',kind:'clock_in',expectedUpdatedAt:stale});
          ck(label+' stale timestamp denied',no===false&&JSON.stringify(state.fingerprintRecords)===before);
          const yes=applyFingerprintMutationHint(key,{action:'delete',kind:'clock_in',expectedUpdatedAt:equiv});
          ck(label+' equivalent timestamp mutation accepted',yes===true&&state.fingerprintRecords.length===0);
        }
       }
      }
      ck('version unchanged',APP_VERSION==='ver20260927-0944');
    }finally{state.fingerprintRecords=beforeRecords}
    return {pass,fail,issues,dates:730,offsets:offsets.length,fractions:frac.length};
   });
   pass+=out.pass;fail+=out.fail+errors.length;contexts++;
   if(out.fail||errors.length)issues.push({tz,mobile,details:out.issues,errors:errors.slice(0,4)});
  }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1800)})}
  finally{await cx.close()}
 }
}catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1600)})}
finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
console.log('QA282_FINGERPRINT_TIMESTAMP_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
if(fail)process.exitCode=1;
})();
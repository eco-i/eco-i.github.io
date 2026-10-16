'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-278.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('278 source SHA not official 277 handoff');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const timezone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:timezone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
    const x=await page.evaluate(()=>{
     let pass=0,fail=0,issues=[];const ck=(n,b)=>{if(b)pass++;else{fail++;if(issues.length<25)issues.push(n)}};
     const stamp='2026-10-16T12:00:00.123456Z',from='2026-01-01',to='2027-12-31';
     const row=(date,cin=true,cout=true,confirmed=true)=>({record_date:date,has_clock_in:cin,has_clock_out:cout,confirmed,clock_in_uploaded_at:cin?stamp:null,clock_out_uploaded_at:cout?stamp:null,confirmed_at:confirmed?stamp:null,updated_at:stamp});
     const accept=(label,arr,options={from,to})=>{
       const input=JSON.stringify(arr),out=(()=>{try{return strictFingerprintRpcRows(arr,options)}catch(e){return e}})();
       ck(label+' accepted',Array.isArray(out));
       if(Array.isArray(out)){
         ck(label+' length intact',out.length===arr.length);
         ck(label+' records isolated from originals',out.length===0||out.every((r,i)=>r!==arr[i]));
         ck(label+' input unchanged',JSON.stringify(arr)===input);
         if(out.length)ck(label+' record keys unchanged',out.every((r,i)=>r.record_date===arr[i].record_date));
       }
     };
     const reject=(label,arr,options={from,to})=>{
       let error=null,out=null;try{out=strictFingerprintRpcRows(arr,options)}catch(e){error=e}
       ck(label+' rejected fail closed',!!error&&out===null);
       ck(label+' Korean fingerprint error',!!error&&String(error.message).includes('지문 기록 응답'));
     };
     ck('version frozen',APP_VERSION==='ver20260927-0944');
     accept('empty row list',[]);
     reject('row list string','wrong');
     reject('object instead of row list',{record_date:'2026-10-16'});
     reject('null entry',[null]);
     const start=new Date('2026-01-01T00:00:00Z');
     for(let step=0;step<730;step++){
       const date=new Date(start.getTime()+step*86400000).toISOString().slice(0,10);
       const base=row(date,true,true,true),pref=date+' #'+step;
       accept(pref+' both confirmed',[base]);
       accept(pref+' both unconfirmed',[row(date,true,true,false)]);
       accept(pref+' clock in only',[row(date,true,false,false)]);
       accept(pref+' clock out only',[row(date,false,true,false)]);
       accept(pref+' blank',[row(date,false,false,false)]);
       // A separate date alongside the selected date must not be removed or normalized into another day.
       const neighbor=(step<729)?new Date(start.getTime()+(step+1)*86400000).toISOString().slice(0,10):'2026-01-01';
       accept(pref+' two distinct records',[base,row(neighbor,false,false,false)]);
       reject(pref+' repeated same date',[base,{...base}]);
       reject(pref+' cannot confirm missing departure',[{...base,has_clock_out:false,clock_out_uploaded_at:null}]);
       reject(pref+' cannot confirm missing check-in',[{...base,has_clock_in:false,clock_in_uploaded_at:null}]);
       reject(pref+' cannot confirm without confirmedAt',[{...base,confirmed_at:null}]);
       reject(pref+' unconfirmed cannot carry confirmedAt',[{...base,confirmed:false}]);
       reject(pref+' check-in flag and photo time inconsistent',[{...base,has_clock_in:false}]);
       reject(pref+' checkout flag and photo time inconsistent',[{...base,clock_out_uploaded_at:null}]);
       reject(pref+' updated_at required',[{...base,updated_at:null}]);
       reject(pref+' invalid ISO timestamp rejected',[{...base,updated_at:'2026-02-30T12:00:00Z'}]);
       reject(pref+' has_clock_in must be boolean',[{...base,has_clock_in:'true'}]);
       reject(pref+' confirmed must be boolean',[{...base,confirmed:1}]);
       reject(pref+' outside exact range lower',[base],{from:neighbor===date?'2027-12-31':date==='2027-12-31'?'2028-01-01':new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10),to:'2028-12-31'});
       reject(pref+' outside exact range upper',[base],{from:'2025-01-01',to:new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10)});
      }
      reject('bad calendar key 2026 February 30',[row('2026-02-30')]);
      reject('early unsupported record',[row('2019-12-31')],{});
      reject('late unsupported record',[row('2101-01-01')],{});
      reject('not zero padded date',[row('2026-1-01')],{});
      reject('missing date key',[{...row('2026-10-16'),record_date:null}],{});
      return {pass,fail,issues,days:730};
    });
    pass+=x.pass;fail+=x.fail+errors.length;contexts++;
    if(x.fail||errors.length)issues.push({timezone,mobile,checks:x.issues,errors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({timezone,mobile,error:String(e.stack||e).slice(0,1600)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1600)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA278_FINGERPRINT_RPC_ROW_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

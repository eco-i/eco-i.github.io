'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-288.html','utf8');
const hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('288 baseline SHA mismatch');
(async()=>{
 let browser,server,pass=0,fail=0,contexts=0,cases=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const result=await page.evaluate(()=>{
     let pass=0,fail=0,cases=0,issues=[];
     const ck=(name,result)=>{if(result)pass++;else{fail++;if(issues.length<36)issues.push(name)}};
     const dateOrigin=Date.UTC(2026,0,1),D=86400000;
     const pad=n=>String(n).padStart(2,'0'),short=m=>pad(Math.floor(m/60))+':'+pad(m%60);
     const independentNet=(a,b)=>{const diff=b-a;return diff>0?diff-30*Math.floor(diff/240):null};
     const durations=[1,30,120,239,240,241,479,480,481,720,839];
     const reject=(name,raw,opts)=>{let thrown=false;try{strictHolidayWorkRpcRows(raw,opts)}catch(e){thrown=String(e.message).includes('응답')}ck(name,thrown)};
     ck('APP_VERSION unchanged',APP_VERSION==='ver20260927-0944');
     ck('empty list valid',Array.isArray(strictHolidayWorkRpcRows([]))&&strictHolidayWorkRpcRows([]).length===0);
     ck('null list rejected',(()=>{try{strictHolidayWorkRpcRows(null);return false}catch{return true}})());
     ck('object list rejected',(()=>{try{strictHolidayWorkRpcRows({});return false}catch{return true}})());
     for(let i=0;i<730;i++){
      const day=new Date(dateOrigin+i*D).toISOString().slice(0,10);
      const start=360+(i%135),length=durations[i%durations.length],end=start+length;
      const a=short(start),b=short(end),net=independentNet(start,end);
      const withSeconds=i%3===0,withFraction=i%5===0;
      const startString=a+(withSeconds?':12'+(withFraction?'.500000':''):'');
      const endString=b+(withSeconds?':43'+(withFraction?'.123456':''):'');
      const id=50000+i;
      const row={id,employee_id:288,work_date:day,start_time:startString,end_time:endString,net_minutes:net,updated_at:'2026-01-01T00:00:00.000000Z'};
      const name=day+' #'+i;
      ck(name+' independent break algorithm',holidayNetMinutes(a,b)===net);
      ck(name+' strict HH:MM[:SS] normalization',strictRpcTimeValue(startString)===a&&strictRpcTimeValue(endString)===b);
      const got=strictHolidayWorkRpcRows([row],{employeeId:288,from:day,to:day});
      ck(name+' valid RPC result',got.length===1&&got[0].id===id&&got[0].employee_id===288&&got[0].work_date===day&&got[0].start_time===a&&got[0].end_time===b&&got[0].net_minutes===net);
      const other={...row,id:id+2000,employee_id:289};
      ck(name+' parallel different staff same day accepted',strictHolidayWorkRpcRows([row,other]).length===2);
      const scope={forceEmployeeId:288,employeeId:288,from:day,to:day};
      const forced={...row,employee_id:'wrong-source-employee'};
      const rewritten=strictHolidayWorkRpcRows([forced],scope);
      ck(name+' forced self owner takes precedence',rewritten.length===1&&rewritten[0].employee_id===288);
      reject(name+' account scope foreign rejected',[other],{employeeId:288});
      reject(name+' date lower bound rejected',[row],{from:new Date(dateOrigin+(i+1)*D).toISOString().slice(0,10)});
      reject(name+' date upper bound rejected',[row],{to:new Date(dateOrigin+(i-1)*D).toISOString().slice(0,10)});
      reject(name+' duplicate ID rejected',[row,{...row,employee_id:289}]);
      reject(name+' duplicate employee day rejected',[row,{...row,id:id+2000}]);
      reject(name+' corrupted net rejected',[{...row,net_minutes:net+1}]);
      reject(name+' noninteger net rejected',[{...row,net_minutes:net+.5}]);
      reject(name+' invalid time hour rejected',[{...row,start_time:'24:00'}]);
      reject(name+' invalid time minute rejected',[{...row,end_time:'10:60'}]);
      reject(name+' invalid time seconds rejected',[{...row,start_time:'12:20:60'}]);
      reject(name+' missing update timestamp rejected',[{...row,updated_at:undefined}].map(({updated_at,...r})=>r));
      reject(name+' malformed update timestamp rejected',[{...row,updated_at:'2026-02-30T00:00:00Z'}]);
      reject(name+' malformed day rejected',[{...row,work_date:'2026-02-30'}]);
      reject(name+' invalid employee id rejected',[{...row,employee_id:0}]);
      reject(name+' string row rejected',[row,'intruder']);
      reject(name+' empty time rejected',[{...row,start_time:''}]);
      reject(name+' overlapping backward hours rejected',[{...row,end_time:a}]);
      cases++;
     }
     return{pass,fail,cases,issues};
    });
    pass+=result.pass;fail+=result.fail+errors.length;cases+=result.cases;contexts++;
    if(result.fail||errors.length)issues.push({zone,mobile,fail:result.fail,detail:result.issues,errors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1200)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1200)})}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
 console.log('QA288_HOLIDAY_WORK_RPC_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,cases,sha256:hash,issues}));
 if(fail)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-289.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('289 immutable start SHA mismatch');
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
    const data=await page.evaluate(()=>{
     let pass=0,fail=0,cases=0,issues=[];
     const ck=(tag,ok)=>{if(ok)pass++;else{fail++;if(issues.length<35)issues.push(tag)}};
     const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
     const origin=Date.UTC(2026,0,1),D=86400000;
     const reject=(label,rows,opts)=>{let thrown=false;try{strictOvertimeRpcRows(rows,opts)}catch(e){thrown=String(e.message).includes('응답')}ck(label,thrown)};
     const rejectMonth=(label,rows,opts)=>{let thrown=false;try{strictOvertimeConfirmationRpcRows(rows,opts)}catch(e){thrown=String(e.message).includes('응답')}ck(label,thrown)};
     ck('APP_VERSION protected',APP_VERSION==='ver20260927-0944');
     ck('empty overtime accepted',strictOvertimeRpcRows([]).length===0);
     ck('empty confirmation accepted',strictOvertimeConfirmationRpcRows([]).length===0);
     reject('invalid rows null rejected',null);
     reject('invalid rows object rejected',{id:1});
     for(let i=0;i<730;i++){
      const date=new Date(origin+i*D).toISOString().slice(0,10),day=new Date(origin+i*D);
      const id=60000+i,employee=289,minutes=10+10*(i%144),slot=i%2===0?'early':'late',completed=i%2===0;
      const row={id,employee_id:employee,work_date:date,slot,minutes,completed,updated_at:'2026-09-01T00:00:00.000000Z'};
      const scope={employeeId:employee,from:date,to:date};
      const tag=date+' '+slot;
      ck(tag+' independent minute range',minutes>=10&&minutes<=1440&&minutes%10===0);
      const got=strictOvertimeRpcRows([row],scope);
      ck(tag+' exact accepted row',got.length===1&&got[0].id===id&&got[0].employee_id===employee&&got[0].minutes===minutes&&got[0].slot===slot&&got[0].completed===completed);
      const otherSlot={...row,id:id+2000,slot:slot==='early'?'late':'early',completed:!completed};
      ck(tag+' independent two slots same date accepted',strictOvertimeRpcRows([row,otherSlot]).length===2);
      const otherPerson={...row,id:id+3000,employee_id:290};
      ck(tag+' two different persons same slot accepted',strictOvertimeRpcRows([row,otherPerson]).length===2);
      const normalized=normalizeOvertimeRows([row,otherSlot,otherPerson]);
      ck(tag+' normalized independent complete/slot identity',normalized.length===3&&normalized.every((v,n)=>v.slot===[row,otherSlot,otherPerson][n].slot&&v.completed===[row,otherSlot,otherPerson][n].completed));
      reject(tag+' duplicate id rejected',[row,{...row,employee_id:290}]);
      reject(tag+' duplicate person-date-slot rejected',[row,{...row,id:id+4000}]);
      reject(tag+' mismatched user rejected',[otherPerson],scope);
      reject(tag+' lower date bound rejected',[row],{from:new Date(origin+(i+1)*D).toISOString().slice(0,10)});
      reject(tag+' upper date bound rejected',[row],{to:new Date(origin+(i-1)*D).toISOString().slice(0,10)});
      reject(tag+' wrong slot rejected',[{...row,slot:'middle'}]);
      reject(tag+' wrong completion flag rejected',[{...row,completed:'true'}]);
      reject(tag+' minute non integer rejected',[{...row,minutes:minutes+0.5}]);
      reject(tag+' minute modulo ten rejected',[{...row,minutes:minutes+1}]);
      reject(tag+' 0 minutes rejected',[{...row,minutes:0}]);
      reject(tag+' >1440 minutes rejected',[{...row,minutes:1450}]);
      reject(tag+' missing timestamp rejected',[(({updated_at,...r})=>r)(row)]);
      reject(tag+' invalid timestamp rejected',[{...row,updated_at:'2026-02-30T00:00:00Z'}]);
      reject(tag+' invalid date rejected',[{...row,work_date:'2026-02-30'}]);
      reject(tag+' missing employee id rejected',[{...row,employee_id:0}]);
      reject(tag+' extra scalar row rejected',[row,'invalid']);
      reject(tag+' duplicate ID different slot rejected',[row,{...otherSlot,id}]);
      const month=date.slice(0,7)+'-01';
      const nextMonth=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth()+1,1)).toISOString().slice(0,10);
      ck(tag+' valid calendar month start',validDate(month)&&strictOvertimeConfirmationRpcRows([{month_start:month}],{from:month,to:month}).length===1);
      ck(tag+' distinct months accepted',strictOvertimeConfirmationRpcRows([{month_start:month},{month_start:nextMonth}]).length===2);
      rejectMonth(tag+' duplicate month rejected',[{month_start:month},{month_start:month}]);
      rejectMonth(tag+' arbitrary day instead month-start rejected',[{month_start:date.slice(0,8)+'02'}]);
      rejectMonth(tag+' malformed date rejected',[{month_start:'2026-02-30'}]);
      rejectMonth(tag+' confirmation out-of-range rejected',[{month_start:month}],{from:nextMonth});
      cases++;
     }
     return{pass,fail,cases,issues};
    });
    pass+=data.pass;fail+=data.fail+errors.length;cases+=data.cases;contexts++;
    if(data.fail||errors.length)issues.push({zone,mobile,errors:errors.slice(0,4),issues:data.issues});
   }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1600)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1600)})}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
 console.log('QA289_OVERTIME_RPC_CONTRACT_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,cases,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();
'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const file='qa-handoff/index.before-2-8-274.html',html=fs.readFileSync(file,'utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('274 baseline mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const timezone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:timezone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
    const x=await page.evaluate(()=>{
      let pass=0,fail=0,issues=[];
      const ck=(label,yes)=>{if(yes)pass++;else{fail++;if(issues.length<32)issues.push(label)}};
      const tsA='2026-10-15T14:59:59.123456Z',tsB='2026-10-15T23:59:59.123456+09:00',tsMicro='2026-10-15T14:59:59.123457Z',tsOld='2026-10-14T14:59:59.123456Z';
      const base=(date='2026-10-15')=>({record_date:date,has_clock_in:true,has_clock_out:true,confirmed:true,clock_in_uploaded_at:tsA,clock_out_uploaded_at:tsA,confirmed_at:tsA,updated_at:tsA});
      const empty=date=>({record_date:date,has_clock_in:false,has_clock_out:false,confirmed:false,clock_in_uploaded_at:null,clock_out_uploaded_at:null,confirmed_at:null,updated_at:null});
      const op=(rows,key,options)=>{state.fingerprintRecords=JSON.parse(JSON.stringify(rows));const before=JSON.stringify(state.fingerprintRecords);const ok=applyFingerprintMutationHint(key,options);return {ok,before,after:JSON.stringify(state.fingerprintRecords),rows:state.fingerprintRecords}};
      ck('app version unchanged',APP_VERSION==='ver20260927-0944');
      ck('timestamp same instant across zones',fingerprintTimestampEqual(tsA,tsB));
      ck('timestamp microsecond delta rejected',!fingerprintTimestampEqual(tsA,tsMicro));
      ck('timestamp previous day rejected',!fingerprintTimestampEqual(tsA,tsOld));
      ck('timestamp null equals null',fingerprintTimestampEqual(null,null));
      ck('timestamp null vs value unequal',!fingerprintTimestampEqual(null,tsA));
      let r=op([], '2026-10-15',{action:'delete',kind:'clock_in',expectedUpdatedAt:null});
      ck('cannot delete missing date',r.ok===false&&r.rows.length===0);
      r=op([], '2026-10-15',{action:'confirm',confirmed:true,expectedUpdatedAt:null});
      ck('cannot confirm missing date',r.ok===false&&r.rows.length===0);
      r=op([], '2026-10-15',{action:'unknown',expectedUpdatedAt:null});
      ck('unknown mutation fails closed',r.ok===false&&r.rows.length===0);
      for(const kind of ['clock_in','clock_out']){
        r=op([], '2026-10-15',{action:'save',kind,expectedUpdatedAt:null});
        ck('new save '+kind,r.ok===true&&r.rows.length===1);
        ck('new record date '+kind,r.rows[0]?.record_date==='2026-10-15');
        ck('new record flag '+kind,r.rows[0]?.['has_'+kind]===true);
        ck('new record timestamp null '+kind,r.rows[0]?.[kind+'_uploaded_at']===null);
        ck('new record unconfirmed '+kind,r.rows[0]?.confirmed===false&&r.rows[0]?.confirmed_at===null);
        ck('new record optimistic updatedAt null '+kind,r.rows[0]?.updated_at===null);
      }
      r=op([base()], '2026-10-15',{action:'delete',kind:'clock_in',expectedUpdatedAt:tsB});
      ck('equivalent timezone delete accepted',r.ok===true);
      ck('delete in only',r.rows[0].has_clock_in===false&&r.rows[0].has_clock_out===true);
      ck('delete leaves out upload date',r.rows[0].clock_out_uploaded_at===tsA);
      ck('delete clears status and time',r.rows[0].confirmed===false&&r.rows[0].confirmed_at===null&&r.rows[0].updated_at===null);
      r=op([base()], '2026-10-15',{action:'delete',kind:'clock_out',expectedUpdatedAt:tsA});
      ck('delete out only',r.ok&&r.rows[0].has_clock_out===false&&r.rows[0].has_clock_in===true&&r.rows[0].clock_in_uploaded_at===tsA);
      r=op([empty('2026-10-15')], '2026-10-15',{action:'delete',kind:'clock_out',expectedUpdatedAt:null});
      ck('delete empty removes record',r.ok===true&&r.rows.length===0);
      for(const value of [tsMicro,tsOld,null,'invalid']){
        r=op([base()], '2026-10-15',{action:'save',kind:'clock_out',expectedUpdatedAt:value});
        ck('save stale rejected '+value,r.ok===false&&r.before===r.after);
        r=op([base()], '2026-10-15',{action:'confirm',confirmed:false,expectedUpdatedAt:value});
        ck('confirm stale rejected '+value,r.ok===false&&r.before===r.after);
      }
      r=op([base()], '2026-10-15',{action:'confirm',confirmed:false,expectedUpdatedAt:tsB});
      ck('unconfirm matches timezone shifted expected',r.ok===true&&r.rows[0].confirmed===false);
      ck('unconfirm preserve photos',r.rows[0].has_clock_in&&r.rows[0].has_clock_out);
      ck('unconfirm no stale timestamp',r.rows[0].updated_at===null&&r.rows[0].confirmed_at===null);
      r=op([base()], '2026-10-15',{action:'confirm',confirmed:true,expectedUpdatedAt:tsA});
      ck('confirm re-confirm keeps photo flags',r.ok===true&&r.rows[0].confirmed&&r.rows[0].has_clock_in&&r.rows[0].has_clock_out);
      ck('reconfirm optimistically invalidates time',r.rows[0].confirmed_at===null&&r.rows[0].updated_at===null);
      r=op([base()], '2026-10-15',{action:'save',kind:'clock_out',expectedUpdatedAt:tsA});
      ck('save clock_out clears confirmed flag',r.ok===true&&!r.rows[0].confirmed);
      ck('save clock_out invalidates uploaded timestamp',r.rows[0].clock_out_uploaded_at===null&&r.rows[0].has_clock_out);
      ck('save clock_out preserves clock_in timestamp',r.rows[0].clock_in_uploaded_at===tsA);
      // Metamorphic property matrix: each date must be isolated from its neighbours even in the
      // presence of an unrelated date in the cache; mutation must never bleed to any adjacent date.
      for(let day=1;day<=31;day++){
        const d='2026-10-'+String(day).padStart(2,'0'),left='2026-09-30',right='2026-11-01';
        const others=[base(left),base(right)],all=[...others,base(d)];
        for(const kind of ['clock_in','clock_out']){
          r=op(all,d,{action:'save',kind,expectedUpdatedAt:tsA});
          ck(d+' save '+kind+' succeeds',r.ok===true);
          ck(d+' save '+kind+' preserves date set',r.rows.length===3&&r.rows.map(x=>x.record_date).join(',')===all.map(x=>x.record_date).join(','));
          ck(d+' save '+kind+' preserves unrelated neighbors',JSON.stringify(r.rows[0])===JSON.stringify(others[0])&&JSON.stringify(r.rows[1])===JSON.stringify(others[1]));
          ck(d+' save '+kind+' clears status',r.rows[2].confirmed===false&&r.rows[2].updated_at===null&&r.rows[2].confirmed_at===null);
          ck(d+' save '+kind+' retains selected photo flag',r.rows[2]['has_'+kind]===true);
          ck(d+' save '+kind+' expires upload timestamp',r.rows[2][kind+'_uploaded_at']===null);
          r=op(all,d,{action:'delete',kind,expectedUpdatedAt:tsB});
          ck(d+' delete '+kind+' succeeds',r.ok===true);
          ck(d+' delete '+kind+' preserves unrelated',JSON.stringify(r.rows[0])===JSON.stringify(others[0])&&JSON.stringify(r.rows[1])===JSON.stringify(others[1]));
          ck(d+' delete '+kind+' selected missing',r.rows[2]['has_'+kind]===false&&r.rows[2][kind+'_uploaded_at']===null);
          ck(d+' delete '+kind+' unconfirms',r.rows[2].confirmed===false&&r.rows[2].confirmed_at===null);
          r=op(all,d,{action:'confirm',confirmed:false,expectedUpdatedAt:tsB});
          ck(d+' unconfirm succeeds',r.ok===true);
          ck(d+' unconfirm preserves unrelated',JSON.stringify(r.rows[0])===JSON.stringify(others[0])&&JSON.stringify(r.rows[1])===JSON.stringify(others[1]));
          ck(d+' unconfirm preserves photos',r.rows[2].has_clock_in&&r.rows[2].has_clock_out&&r.rows[2].confirmed===false);
          r=op(all,d,{action:'save',kind,expectedUpdatedAt:tsMicro});
          ck(d+' stale micro cannot mutate',r.ok===false&&r.before===r.after);
          r=op(all,d,{action:'delete',kind,expectedUpdatedAt:tsOld});
          ck(d+' stale old cannot mutate',r.ok===false&&r.before===r.after);
        }
      }
      const zero=op([base('2026-01-01')],'2026-01-02',{action:'delete',kind:'clock_in',expectedUpdatedAt:null});
      ck('missing date delete leaves others untouched',zero.ok===false&&zero.before===zero.after);
      const unknown=op([base()], '2026-10-15',{action:'something_weird',expectedUpdatedAt:tsA});
      ck('unknown mutation leaves full record intact',unknown.ok===false&&unknown.before===unknown.after);
      return {pass,fail,issues};
    });
    pass+=x.pass;fail+=x.fail+errors.length;contexts++;
    if(x.fail||errors.length)issues.push({timezone,mobile,issues:x.issues,errors:errors.slice(0,4)});
   }catch(e){fail++;issues.push({timezone,mobile,error:String(e.stack||e).slice(0,2000)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,2000)})}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
 console.log('QA274_FINGERPRINT_HINT_MATRIX_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();

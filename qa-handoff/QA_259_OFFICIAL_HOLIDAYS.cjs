'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm');
const original=fs.readFileSync('qa-handoff/index.before-2-8-259.html','utf8');
const sha=crypto.createHash('sha256').update(original).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA259 baseline modified');
const start=original.indexOf('const HOLIDAYS = {'),end=original.indexOf('};',start);
if(start<0||end<0)throw Error('No calendar holiday table');
const holidays=original.slice(start,end);
const rows=[...holidays.matchAll(/'(\d{4}-\d{2}-\d{2})':'([^']+)'/g)].map(m=>({date:m[1],name:m[2]}));
const actual=new Set(rows.filter(r=>r.date.startsWith('2027-')).map(r=>r.date));
// Independently transcribed 2027 published Korean civil holiday dates:
// Korea AeroSpace Administration's "2027 월력요항" (2026-06-29)
// https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03
const published=[
'2027-01-01','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-03-01',
'2027-05-01','2027-05-03','2027-05-05','2027-05-13','2027-06-06','2027-07-17',
'2027-07-19','2027-08-15','2027-08-16','2027-09-14','2027-09-15','2027-09-16',
'2027-10-03','2027-10-04','2027-10-09','2027-10-11','2027-12-25','2027-12-27'
];
let passed=0,failed=0;
function test(label,ok){(ok?passed++:failed++);if(!ok)console.log('QA259_OFFICIAL_HOLIDAY_FAIL',label);}
test('official 2027 number of holiday entries',actual.size===24);
test('calendar duplicate 2027 dates absent',rows.filter(r=>r.date.startsWith('2027-')).length===actual.size);
for(const date of published)test('published calendar '+date,actual.has(date));
for(const date of actual)test('unexpected 2027 date '+date,published.includes(date));
test('no non-substitute Memorial Day on 2027-06-07',!actual.has('2027-06-07'));
test('2027 Labor Day substitute present',actual.has('2027-05-03'));
test('2027 Constitution Day substitute present',actual.has('2027-07-19'));
test('2027 last Christmas substitute present',actual.has('2027-12-27'));
const sundays=new Set(),weekends=new Set();
for(let month=1;month<=12;month++)for(let day=1;day<=31;day++){
 const d=new Date(Date.UTC(2027,month-1,day));
 if(d.getUTCMonth()!==month-1)continue;
 const iso=d.toISOString().slice(0,10),weekday=d.getUTCDay();
 if(weekday===0)sundays.add(iso);
 if(weekday===0||weekday===6)weekends.add(iso);
}
test('KASA 2027 official Sundays + holidays unique 72',new Set([...sundays,...actual]).size===72);
test('KASA 2027 five-day employee calendar off days 119',new Set([...weekends,...actual]).size===119);
test('2026-10-15 shutdown boundary preserved',original.includes("if(group==='C'&&key==='2026-10-15')return '야';"));
test('calendar year span 2026-2027 maintained',original.includes('MAX_YEAR = 2027;'));
console.log('QA259_OFFICIAL_HOLIDAY_SUMMARY',JSON.stringify({passed,failed,calendar_dates:actual.size,published_dates:published.length,sha}));
if(failed)process.exitCode=1;

'use strict';
const fs=require('fs'),crypto=require('crypto');
const source=fs.readFileSync('qa-handoff/index.before-2-8-261.html','utf8');
const sha=crypto.createHash('sha256').update(source).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('Source drift');
const start=source.indexOf('const SOLAR_TERMS = {'),end=source.indexOf('};',start);
if(start<0||end<0)throw Error('Solar terms not found');
const entries=[...source.slice(start,end).matchAll(/'(\d{4}-\d{2}-\d{2})':'([^']+)'/g)].map(m=>({date:m[1],name:m[2]}));
const actual=entries.filter(x=>x.date.startsWith('2027-'));
const standard=[
['01-05','소한'],['01-20','대한'],['02-04','입춘'],['02-19','우수'],['03-06','경칩'],['03-21','춘분'],
['04-05','청명'],['04-20','곡우'],['05-06','입하'],['05-21','소만'],['06-06','망종'],['06-21','하지'],
['07-07','소서'],['07-23','대서'],['08-08','입추'],['08-23','처서'],['09-08','백로'],['09-23','추분'],
['10-08','한로'],['10-24','상강'],['11-08','입동'],['11-22','소설'],['12-07','대설'],['12-22','동지']
];
// Independent primary source: Korea Astronomy and Space Science Institute, 2027 calendar data (generated 2026-06-30)
// https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
let pass=0,fail=0,issues=[];
const ck=(name,ok)=>{if(ok)pass++;else{fail++;issues.push(name)}};
ck('all 2026 + 2027 24 each',entries.length===48&&actual.length===24);
ck('each 2027 term exactly once',new Set(actual.map(x=>x.name)).size===24);
ck('every 2027 date unique',new Set(actual.map(x=>x.date)).size===24);
for(const [day,name] of standard)ck('KASI 2027 official '+name+' 2027-'+day,actual.some(e=>e.date==='2027-'+day&&e.name===name));
for(let i=1;i<=12;i++){
 const month=String(i).padStart(2,'0');
 ck('2027 each month has two distinct terms '+month,actual.filter(x=>x.date.slice(5,7)===month).length===2);
}
const past=entries.filter(x=>x.date.startsWith('2026-'));
ck('2026 all 24 solar term names are unique',past.length===24&&new Set(past.map(x=>x.name)).size===24);
for(const row of past)ck('2026 valid solar calendar date '+row.date,!Number.isNaN(Date.parse(row.date))&&new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)===row.date);
console.log('QA261_SOLAR_TERMS_SUMMARY',JSON.stringify({passed:pass,failed:fail,source:'KASI 2027 monthly almanac',officialDates:24,totalSourceEntries:entries.length,sha,issues}));
if(fail)process.exitCode=1;

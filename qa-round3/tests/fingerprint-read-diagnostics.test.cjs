'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function fingerprintReadFailureText(');
const end=html.indexOf('async function loadFingerprintRecords(',start);
assert.ok(start>=0&&end>start);
const ctx={};
vm.runInNewContext(html.slice(start,end),ctx,{timeout:1500});
const classify=ctx.fingerprintReadFailureText;
const cases=[
 [{message:'Could not find the function public.list_my_fingerprint_records in schema cache'},'서버 스키마'],
 [{message:'지문 기록 응답 형식이 올바르지 않습니다.'},'응답 형식'],
 [{message:'SESSION_EXPIRED'},'로그인 세션'],
 [{message:'TimeoutError'},'네트워크'],
 [{message:'permission denied for table fingerprint_punch_records'},'권한'],
 [{message:'SOME_UNKNOWN_INTERNAL_ERROR'},'서버 조회']
];
cases.forEach(([input,match],i)=>test('safe fingerprint read diagnostic #'+(i+1),()=>{
 const result=classify(input);
 assert.ok(result.includes(match),result);
 assert.ok(!result.includes(input.message));
}));
test('no raw server text or photo/token visible',()=>{
 const sensitive='TOP_SECRET_TOKEN_EMPLOYEE_PHOTO_BYTES';
 const result=classify({message:'Invalid error '+sensitive});
 assert.ok(!result.includes(sensitive));
});
test('actual metadata catch displays categorized error only on current opened date',()=>{
 const fn=html.slice(end,html.indexOf('function fingerprintBase64FromDataUrl(',end));
 assert.match(fn,/if\(!stillCurrent\(\)\)return false;/);
 assert.match(fn,/state\.fingerprintBackendReady=false/);
 assert.match(fn,/fingerprintReadFailureText\(e\)/);
 assert.match(fn,/state\.view==='mine'/);
 assert.ok(!fn.includes('textContent=String(e'));
});
test('diagnostics never weaken actual photo write CAS',()=>{
 const fn=html.slice(html.indexOf('async function handleFingerprintPhotoInput('),html.indexOf('async function ',html.indexOf('async function handleFingerprintPhotoInput(')+8));
 assert.ok(fn.includes("rpc('save_my_fingerprint_photo'"));
 assert.ok(fn.includes('p_expected_updated_at:expectedUpdatedAt'));
});
console.log('QA_FINGERPRINT_METADATA_FAILURE_DIAGNOSTICS_SCOPED_PASS');

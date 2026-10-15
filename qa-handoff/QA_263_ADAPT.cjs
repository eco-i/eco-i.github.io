'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm');
const p='qa-handoff/index.before-2-8-263.html';
const html=fs.readFileSync(p,'utf8');
const digest=crypto.createHash('sha256').update(html).digest('hex');
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
if(digest!==expected)throw Error('QA261 immutable baseline SHA mismatch '+digest);
const src='qa-handoff/index.before-2-8-263.html';
const names=process.argv.slice(2);
if(names.length===0)throw Error('No tests');
for(const name of names){
 if(!/^QA_(256|257|258|259|260)_[A-Z0-9_]+$/.test(name))throw Error('Invalid suite name');
 const input='qa-handoff/'+name+'.cjs';
 const output='qa-handoff/QA_263_ADAPTED_'+name+'.cjs';
 let s=fs.readFileSync(input,'utf8');
 // Retain historical 239/246/251 immutable baseline references inside FULL. Adjust only mutable QA candidate refs and pinned current hashes.
 s=s.replaceAll('qa-handoff/index.working-2-8-256.html',src)
    .replaceAll('qa-handoff/index.before-2-8-257.html',src)
    .replaceAll('qa-handoff/index.before-2-8-259.html',src)
    .replaceAll('qa-handoff/index.before-2-8-260.html',src)
    .replaceAll('qa-handoff/index.before-2-8-258.html',src)
    .replaceAll('qa-handoff/index.working-2-8-258.html',src)
    .replaceAll('fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9',expected)
    .replaceAll('1174614',String(Buffer.byteLength(html)));
 fs.writeFileSync(output,s);
 new vm.Script(s,{filename:output});
 console.log('QA263_ADAPTED',name);
}
console.log('QA263_ADAPT_SUMMARY',JSON.stringify({baseline_sha256:digest,bytes:Buffer.byteLength(html),adapted:names.length}));

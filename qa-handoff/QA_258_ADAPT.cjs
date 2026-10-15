'use strict';
const fs=require('fs'),crypto=require('crypto');
const source='qa-handoff/index.working-2-8-258.html',text=fs.readFileSync(source,'utf8'),hash=crypto.createHash('sha256').update(text).digest('hex');
const old='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9';
if(hash===old||!text.includes('await new Promise(resolve=>setTimeout(resolve,220));')||(text.match(/await new Promise\(resolve=>setTimeout\(resolve,220\)\);/g)||[]).length!==2)throw Error('QA258 missing exactly two guarded restore settle checks');
for(const name of process.argv.slice(2)){
 if(!/^QA_(256|257|258)_[A-Z0-9_]+$/.test(name))throw Error('Invalid suite name '+name);
 const input='qa-handoff/'+name+'.cjs',output='qa-handoff/QA_258_ADAPTED_'+name+'.cjs';
 let s=fs.readFileSync(input,'utf8');
 s=s.replaceAll("qa-handoff/index.working-2-8-256.html",source).replaceAll("qa-handoff/index.before-2-8-257.html",source).replaceAll("qa-handoff/index.before-2-8-258.html",source).replaceAll(old,hash).replaceAll('1174614',String(Buffer.byteLength(text)));
 fs.writeFileSync(output,s);
 console.log('QA258_ADAPT',name,'->',output);
}
console.log('QA258_CANDIDATE_SHA256',hash,'utf8_bytes',Buffer.byteLength(text));

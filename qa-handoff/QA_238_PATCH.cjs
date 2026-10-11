'use strict';
const fs=require('fs'),crypto=require('crypto');
const paths=['index.html','qa-handoff/index.working-2-8-238.html'];
const patchList=[["if(tabToken===current)return {current,mode:'tab'};","if(!MOBILE_SESSION_DEVICE&&tabToken===current)return {current,mode:'tab'};"],["if(tabToken===current)return false;","if(!MOBILE_SESSION_DEVICE&&tabToken===current)return false;"],["if(current && tabToken===current){ sharedSessionChangePending=","if(!MOBILE_SESSION_DEVICE && current && tabToken===current){ sharedSessionChangePending="]];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected='f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f';
const baseline=fs.readFileSync('qa-handoff/index.before-2-8-238.html');
if(hash(baseline)!==expected||baseline.length!==1161672)throw Error('QA238 baseline mismatch');
for(const path of paths){
  let content=fs.readFileSync(path,'utf8'),changes=0;
  for(const [from,to] of patchList){
    if(content.includes(to)){if(content.includes(from))throw Error('Mixed patches: '+path);continue;}
    if(content.split(from).length!==2)throw Error('Ambiguous targeted source fix: '+path+' '+from);
    content=content.replace(from,to);changes++;
  }
  if(!content.includes('ver20260927-0944'))throw Error('Version changed');
  fs.writeFileSync(path,content);
  console.log('QA238_PATCHED',JSON.stringify({path,changes,sha256:hash(content),bytes:Buffer.byteLength(content)}));
}
if(!fs.readFileSync(paths[0]).equals(fs.readFileSync(paths[1])))throw Error('QA candidate mismatch');

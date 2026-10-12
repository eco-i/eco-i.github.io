'use strict';
const fs=require('fs'),crypto=require('crypto');
const paths=['index.html','qa-handoff/index.working-2-8-239.html'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(sha(fs.readFileSync('qa-handoff/index.before-2-8-239.html'))!=='1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360')throw Error('Official start baseline changed');
const pairs=[["function storedSessionToken(){","function storedSessionTombstoned(token){\n  token=String(token||'');if(!token)return false;\n  // This helper also runs during initial state bootstrap, before late\n  // update-handoff constants initialize; read the token-specific key directly.\n  const now=Date.now(),fresh=value=>{\n    const at=Number(value),age=now-at;\n    return Number.isFinite(at)&&at>0&&Number.isFinite(age)&&(age<0||age<=60000);\n  };\n  const tokenKey='staffAttendance_updateSessionLogoutToken_v1:'+encodeURIComponent(token);\n  if(fresh(storageGet(localStorage,tokenKey)))return true;\n  try{\n    const raw=storageGet(localStorage,'staffAttendance_updateSessionLogout_v1');\n    if(!raw)return false;\n    const value=JSON.parse(raw);\n    const entries=Array.isArray(value?.entries)?value.entries:(value?.token?[value]:[]);\n    return entries.some(item=>String(item?.token||'')===token&&fresh(item?.at));\n  }catch(_){return false;}\n}\nfunction storedSessionToken(){"],["const localToken=rawLocal&&rawLocal!==forbidden?rawLocal:'';\n  const temporaryToken=rawTab&&rawTab!==forbidden?rawTab:'';","const localToken=rawLocal&&rawLocal!==forbidden&&!storedSessionTombstoned(rawLocal)?rawLocal:'';\n  const temporaryToken=rawTab&&rawTab!==forbidden&&!storedSessionTombstoned(rawTab)?rawTab:'';"],["      const token=localToken||temporaryToken;\n      if(token){","      const token=localToken||temporaryToken;\n      // A legacy token with an explicit per-token logout tombstone is never\n      // a valid candidate for migration, regardless of the shared marker.\n      if(token&&storedSessionTombstoned(token)){\n        if(localToken===token)storageRemove(localStorage,SESSION_KEY);\n        if(localAdmin===token)storageRemove(localStorage,ADMIN_UNLOCK_KEY);\n        if(temporaryToken===token)storageRemove(sessionStorage,SESSION_KEY);\n        if(temporaryAdmin===token)storageRemove(sessionStorage,ADMIN_UNLOCK_KEY);\n        storageRemove(localStorage,PC_REMEMBER_KEY);\n        return true;\n      }\n      if(token){"]];
for(const p of paths){
 let c=fs.readFileSync(p,'utf8'),n=0;
 for(const [from,to] of pairs){
  if(c.includes(to)){if(c.includes(from))throw Error('Mixed patch state: '+p);continue;}
  if(c.split(from).length!==2)throw Error('Ambiguous source anchor '+p+' '+from.slice(0,60));
  c=c.replace(from,to);n++;
 }
 if(!c.includes('ver20260927-0944'))throw Error('Version changed');
 fs.writeFileSync(p,c);
 console.log('QA239_TOMBSTONE_PATCHED',JSON.stringify({path:p,changes:n,sha256:sha(c),bytes:Buffer.byteLength(c)}));
}
if(!fs.readFileSync(paths[0]).equals(fs.readFileSync(paths[1])))throw Error('Root candidate differs');

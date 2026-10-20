import { spawnSync } from 'node:child_process';
import { mkdtempSync,mkdirSync,writeFileSync,rmSync,chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
// Synthetic Docker CLI responses, never a real Docker socket or network.
const dir=mkdtempSync(join(tmpdir(),'workmoa-fake-docker-'));
const mock=join(dir,'docker');
const real=join(dirname(fileURLToPath(import.meta.url)),'check-local-qa-docker.mjs');
writeFileSync(mock,`#!/usr/bin/env node
const cmd=process.argv.slice(2), scenario=process.env.FAKE_DOCKER_SCENARIO||'pass';
const show=x=>{process.stdout.write(x+'\\n');process.exit(0)};
if(cmd[0]==='context')return show(JSON.stringify(scenario==='remoteContext'?'tcp://198.51.100.1:2375':'npipe:////./pipe/docker_engine'));
if(cmd[0]==='ps')return show(scenario==='noContainers'?'':'1234567890abcdef\\nfeedfacecafebabe');
if(cmd[0]==='inspect'){
const id=cmd.at(-1);
const ports=id==='1234567890abcdef'?{'8000/tcp':[{HostIp:'127.0.0.1',HostPort:scenario==='badApiPort'?'54399':'54321'}]}:{'3000/tcp':[{HostIp:'127.0.0.1',HostPort:'54323'}]};
if(scenario==='bindAll'&&id==='1234567890abcdef')ports['8000/tcp'][0].HostIp='0.0.0.0';
if(scenario==='ipv6Wildcard'&&id==='1234567890abcdef')ports['8000/tcp'][0].HostIp='::';
if(scenario==='badPort'&&id==='1234567890abcdef')ports['8000/tcp'][0].HostPort='bad';
if(scenario==='noStudio'&&id==='feedfacecafebabe')return show(JSON.stringify({'3000/tcp':null}));
if(scenario==='malformed'&&id==='feedfacecafebabe')return show('{broken json');
return show(JSON.stringify(ports));}
process.exit(4);
`);
chmodSync(mock,0o755);
const invoke=(scenario,env={})=>spawnSync(process.execPath,[real,'workmoa-local-only'],{encoding:'utf8',env:{PATH:dir+':'+process.env.PATH,FAKE_DOCKER_SCENARIO:scenario,...env}});
after(()=>rmSync(dir,{recursive:true,force:true}));
test('loopback-only QA containers PASS',()=>{const r=invoke('pass');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/2 containers, 2 published ports/)});
for(const scenario of ['remoteContext','noContainers','bindAll','ipv6Wildcard','badApiPort','badPort','noStudio','malformed'])test('fail closed: '+scenario,()=>assert.equal(invoke(scenario).status,2));
test('reject DOCKER_HOST context override',()=>assert.equal(invoke('pass',{DOCKER_HOST:'tcp://198.51.100.2:2375'}).status,2));
test('reject DOCKER_CONTEXT override',()=>assert.equal(invoke('pass',{DOCKER_CONTEXT:'remote'}).status,2));
test('refuse wrong network name',()=>{const r=spawnSync(process.execPath,[real,'bridge'],{encoding:'utf8',env:{PATH:dir+':'+process.env.PATH}});assert.equal(r.status,2)});

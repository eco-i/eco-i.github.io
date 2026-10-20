import { spawnSync } from 'node:child_process';

// Read-only guard for the NEW local synthetic Supabase stack, never hosted DB.
// Usage: node check-local-qa-docker.mjs workmoa-local-only
const network = process.argv[2];
const fail = (reason) => { console.error(`LOCAL QA DOCKER GUARD: ${reason}`); process.exit(2); };
if (network !== 'workmoa-local-only') fail('unexpected Docker network');
if (process.env.DOCKER_HOST || process.env.DOCKER_CONTEXT) {
  fail('Docker environment override is set; use the verified local Desktop context without overrides');
}
function docker(...args) {
  const r = spawnSync('docker', args, { encoding:'utf8', timeout:15000, maxBuffer:1024*1024 });
  if (r.error || r.status !== 0) fail(`docker ${args[0]} failed or timed out`);
  return r.stdout.trim();
}
const host = docker('context','inspect','--format','{{json .Endpoints.docker.Host}}');
let endpoint;
try { endpoint = JSON.parse(host); } catch { fail('unreadable Docker context'); }
if (typeof endpoint !== 'string' || !/^(npipe:\/\/|unix:\/\/|tcp:\/\/127\.0\.0\.1(?::\d+)?\/?$)/.test(endpoint)) {
  fail('Docker context is not local');
}
const rows = docker('ps','--filter',`network=${network}`,'--format','{{.ID}}').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
if (!rows.length) fail('no running containers on dedicated QA network');
let published = 0, apiPort = false, studioPort = false;
for (const id of rows) {
  if (!/^[a-f0-9]{8,64}$/i.test(id)) fail('invalid Docker container ID');
  let ports;
  try { ports = JSON.parse(docker('inspect','--format','{{json .NetworkSettings.Ports}}',id)); }
  catch { fail('malformed published-port configuration'); }
  if (ports === null) continue;
  if (!ports || typeof ports !== 'object' || Array.isArray(ports)) fail('malformed port mapping');
  for (const bindings of Object.values(ports)) {
    if (bindings === null) continue;
    if (!Array.isArray(bindings)) fail('malformed port bindings');
    for (const binding of bindings) {
      const ip = binding?.HostIp, p = String(binding?.HostPort ?? '');
      if (ip !== '127.0.0.1' || !/^\d{1,5}$/.test(p) || +p < 1 || +p > 65535) {
        fail(`non-loopback or invalid published port on local QA container ${id}`);
      }
      published++;
      if (p === '54321') apiPort = true;
      if (p === '54323') studioPort = true;
    }
  }
}
if (!apiPort || !studioPort) fail('local API 54321 / Studio 54323 port bindings not both present');
console.log(`LOCAL QA DOCKER GUARD PASS: ${rows.length} containers, ${published} published ports on 127.0.0.1 only; API and Studio present`);

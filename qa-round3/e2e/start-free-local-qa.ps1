# Free local-only Supabase for QA on Windows; never connects to production.
$ErrorActionPreference = 'Stop'
foreach($tool in @('git','docker','node','npm')) {
  if(-not (Get-Command $tool -ErrorAction SilentlyContinue)){throw "Install $tool first (see LOCAL_FREE_QA_README.md)."}
}
$root=(& git rev-parse --show-toplevel 2>$null).Trim()
if(!$root -or $LASTEXITCODE -ne 0){throw 'Run within the QA Git checkout.'}
$branch=(& git -C $root branch --show-current).Trim()
if($branch -ne 'qa-3-8'){throw 'Refusing non-QA branch. Do not run against main.'}
$build=Join-Path $root 'qa-round3\e2e\prepare-local-qa-site.mjs'
$serve=Join-Path $root 'qa-round3\e2e\serve-local-qa-site.mjs'
if(!(Test-Path $build) -or !(Test-Path $serve)){throw 'Local QA scripts missing.'}
$nodeVersion=(& node --version).Trim().TrimStart('v')
if([int]($nodeVersion.Split('.')[0]) -lt 20){throw 'Node 20+ required.'}
$contextJson=& docker context inspect --format '{{json .Endpoints.docker.Host}}' 2>$null
if($LASTEXITCODE -ne 0){throw 'Start Docker Desktop first.'}
$endpoint=[string]($contextJson | ConvertFrom-Json)
if($endpoint -notmatch '^(npipe://|unix://|tcp://127\.0\.0\.1(:[0-9]+)?/?$)'){throw 'Refusing remote Docker context.'}
& docker info --format '{{.ServerVersion}}' | Out-Null
if($LASTEXITCODE -ne 0){throw 'Docker engine is unavailable.'}
if(!$env:LOCALAPPDATA){throw 'Windows LOCALAPPDATA required.'}
$isolated=Join-Path $env:LOCALAPPDATA 'workmoa-free-local-qa'
$marker=Join-Path $isolated '.workmoa-local-only'
if((Test-Path $isolated) -and !(Test-Path $marker)){throw 'Unknown existing directory; will not overwrite.'}
New-Item -ItemType Directory -Force -Path $isolated | Out-Null
Set-Content -Path $marker -Value 'Synthetic local tests only. No cloud links.'
$linked=Join-Path $isolated 'supabase\.temp\project-ref'
if(Test-Path $linked){throw 'Refusing linked cloud project.'}
Push-Location $isolated
try {
  Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
  if(!(Test-Path 'node_modules\supabase')) {
    & npm install --save-dev --save-exact --no-fund --no-audit supabase | Out-Null
    if($LASTEXITCODE -ne 0){throw 'CLI installation failed.'}
  }
  if(!(Test-Path 'supabase\config.toml')) {
    & npx --no-install supabase init | Out-Null
    if($LASTEXITCODE -ne 0){throw 'Local init failed.'}
  }
  if(Test-Path $linked){throw 'Project unexpectedly linked to cloud.'}
  $network='workmoa-local-only'
  & docker network inspect $network --format '{{index .Options "com.docker.network.bridge.host_binding_ipv4"}}' 2>$null | Out-Null
  if($LASTEXITCODE -ne 0) {
    & docker network create -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' $network | Out-Null
    if($LASTEXITCODE -ne 0){throw 'Cannot create loopback-bound Docker network.'}
  }
  $binding=(& docker network inspect $network --format '{{index .Options "com.docker.network.bridge.host_binding_ipv4"}}').Trim()
  if($binding -ne '127.0.0.1'){throw 'Unsafe Docker network bind address.'}
  $null = & npx --no-install supabase start --network-id $network 2>&1
  if($LASTEXITCODE -ne 0){throw 'Local Supabase start failed; check Docker Desktop. No cloud database accessed.'}
  $lines=@(& npx --no-install supabase status -o env 2>&1)
  if($LASTEXITCODE -ne 0){throw 'Cannot verify Supabase local status.'}
  $vars=@{}
  foreach($line in $lines){if($line -match '^([A-Za-z_]+)=(.*)$'){$vars[$matches[1]]=$matches[2].Trim('"')}}
  $api=$vars['API_URL']
  if($api -ne 'http://127.0.0.1:54321' -and $api -ne 'http://localhost:54321'){throw 'Unexpected Supabase API URL; stop.'}
  $localKey=$vars['PUBLISHABLE_KEY']
  if(!$localKey){$localKey=$vars['ANON_KEY']}
  if(!$localKey){throw 'Local publishable/anon key missing.'}
  $env:LOCAL_QA_ONLY='YES'
  $env:LOCAL_QA_KEYS_CONFIRMED='YES'
  $env:LOCAL_SUPABASE_URL='http://127.0.0.1:54321'
  $env:LOCAL_SUPABASE_ANON_KEY=$localKey
  $out=@(& node $build 2>&1)
  if($LASTEXITCODE -ne 0){throw 'Local site build blocked.'}
  $ready=$out | Where-Object {$_ -match '^LOCAL QA READY: '} | Select-Object -First 1
  if(!$ready){throw 'No isolated QA site path.'}
  $siteDir=$ready.Substring('LOCAL QA READY: '.Length)
  Write-Host 'FREE LOCAL QA: http://127.0.0.1:54330'
  Write-Host 'Server started, but full app login cannot work until the synthetic baseline database/RPCs are added.'
  & node $serve $siteDir
} finally {
  foreach($n in @('LOCAL_SUPABASE_ANON_KEY','LOCAL_QA_ONLY','LOCAL_QA_KEYS_CONFIRMED','LOCAL_SUPABASE_URL')){Remove-Item ('Env:'+$n) -ErrorAction SilentlyContinue}
  Pop-Location
}

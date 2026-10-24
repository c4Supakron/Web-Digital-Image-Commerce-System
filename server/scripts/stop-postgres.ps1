$ErrorActionPreference = 'Stop'
$serverRoot = Split-Path -Parent $PSScriptRoot
$postgresBin = Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'
$dataDir = Join-Path $serverRoot '.pgdata'
if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) { throw 'Local PostgreSQL is not initialized. Run npm run db:setup first.' }
& (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir -m fast -w stop
if ($LASTEXITCODE -ne 0) { throw 'Could not stop the local PostgreSQL instance.' }

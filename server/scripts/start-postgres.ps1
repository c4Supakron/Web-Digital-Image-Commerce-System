$ErrorActionPreference = 'Stop'
$serverRoot = Split-Path -Parent $PSScriptRoot
$postgresBin = Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'
$dataDir = Join-Path $serverRoot '.pgdata'
if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) { throw 'Local PostgreSQL is not initialized. Run npm run db:setup first.' }
& (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir -l (Join-Path $serverRoot 'postgresql.log') -o '-h 127.0.0.1 -p 5432' -w start
if ($LASTEXITCODE -ne 0) { throw 'Could not start PostgreSQL on 127.0.0.1:5432.' }

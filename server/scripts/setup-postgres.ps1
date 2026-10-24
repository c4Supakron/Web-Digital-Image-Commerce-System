$ErrorActionPreference = 'Stop'

$serverRoot = Split-Path -Parent $PSScriptRoot
$postgresBin = Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'
$dataDir = Join-Path $serverRoot '.pgdata'
$envFile = Join-Path $serverRoot '.env'
$schemaFile = Join-Path $serverRoot 'db\schema.sql'
$logFile = Join-Path $serverRoot 'postgresql.log'

foreach ($executable in @('initdb.exe', 'pg_ctl.exe', 'createdb.exe', 'psql.exe')) {
  if (-not (Test-Path (Join-Path $postgresBin $executable))) {
    throw "PostgreSQL 18 executable not found: $(Join-Path $postgresBin $executable)"
  }
}
if (Test-Path $envFile) { throw 'server/.env already exists. Keep its credentials and configure the database manually.' }

$bytes = [byte[]]::new(32)
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$random.GetBytes($bytes)
$password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$random.GetBytes($bytes)
$sessionSecret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$random.Dispose()
$passwordFile = Join-Path $serverRoot '.postgres-init-password.tmp'
$pgHba = Join-Path $dataDir 'pg_hba.conf'

if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
  try {
    Set-Content -LiteralPath $passwordFile -Value $password -NoNewline
    & (Join-Path $postgresBin 'initdb.exe') -D $dataDir -U postgres --locale=C --encoding=UTF8 --no-data-checksums --auth-local=trust --auth-host=scram-sha-256 --pwfile=$passwordFile
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL cluster initialization failed.' }
  } finally {
    Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
  }
}

$hbaContent = Get-Content -LiteralPath $pgHba -Raw
$trustedHbaContent = "# temporary local bootstrap`nhost all all 127.0.0.1/32 trust`nhost all all ::1/128 trust`n" + $hbaContent
Set-Content -LiteralPath $pgHba -Value $trustedHbaContent -Encoding ascii
try {
  & (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir -l $logFile -o '-h 127.0.0.1 -p 5432' -w start
  if ($LASTEXITCODE -ne 0) { throw 'Could not start PostgreSQL on 127.0.0.1:5432.' }
  & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE postgres WITH PASSWORD '$password';"
  if ($LASTEXITCODE -ne 0) { throw 'Could not configure the local PostgreSQL password.' }
  $databaseExists = & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'vart_db';"
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect PostgreSQL databases.' }
  if ($databaseExists.Trim() -ne '1') {
    & (Join-Path $postgresBin 'createdb.exe') -h 127.0.0.1 -p 5432 -U postgres vart_db
    if ($LASTEXITCODE -ne 0) { throw 'Could not create database vart_db.' }
  }
  & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p 5432 -U postgres -d vart_db -v ON_ERROR_STOP=1 -f $schemaFile
  if ($LASTEXITCODE -ne 0) { throw 'Could not apply db/schema.sql.' }
} finally {
  $hbaContent = $hbaContent -replace '(?m)^# temporary local bootstrap\r?\nhost all all 127\.0\.0\.1/32 trust\r?\nhost all all ::1/128 trust\r?\n', ''
  Set-Content -LiteralPath $pgHba -Value $hbaContent -Encoding ascii
  & (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir reload | Out-Null
}

$envContent = @"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=$sessionSecret
DATABASE_URL=postgresql://postgres:$password@127.0.0.1:5432/vart_db
PGSSL=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
"@
Set-Content -LiteralPath $envFile -Value $envContent -Encoding ascii
Write-Output 'PostgreSQL database vart_db is ready on 127.0.0.1:5432.'
Write-Output 'Credentials were saved to the ignored file server/.env for the API and DBeaver.'

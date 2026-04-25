param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [Parameter(Mandatory = $true)][string]$ProjectRoot,
  [string]$label = 'manual',
  [string]$OutputDir,
  [string]${output-dir}
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($OutputDir) -and -not [string]::IsNullOrWhiteSpace(${output-dir})) {
  $OutputDir = ${output-dir}
}

function Resolve-DockerCommand {
  $candidates = @(
    (Get-Command docker -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source),
    (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe'),
    (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker'),
    (Join-Path $env:ProgramW6432 'Docker\Docker\resources\bin\docker.exe'),
    (Join-Path $env:ProgramW6432 'Docker\Docker\resources\bin\docker')
  )

  foreach ($candidate in $candidates) {
    if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  throw 'No se encontró docker.exe en el sistema.'
}

$docker = Resolve-DockerCommand
$envFile = Join-Path $RuntimePath '.env.prod'
if (-not (Test-Path $envFile)) {
  Write-Error '.env.prod no encontrado en runtimePath.'
  exit 91
}

$composeFile = Join-Path $ProjectRoot 'docker-compose.prod.yml'
if (-not (Test-Path $composeFile)) {
  Write-Error 'docker-compose.prod.yml no encontrado en projectRoot.'
  exit 92
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $RuntimePath 'backups'
}

New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null

$stampUtc = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$workDir = Join-Path $env:TEMP ("smarteconomat-backup-" + [guid]::NewGuid().ToString('N'))
New-Item -Path $workDir -ItemType Directory -Force | Out-Null

$archiveName = ('smarteconomat-backup_{0}.zip' -f $stampUtc)
$archivePath = Join-Path $OutputDir $archiveName

try {
  $dbDump = Join-Path $workDir 'database.sql'
  $uploadsDump = Join-Path $workDir 'uploads.tar.gz'
  $containerDbDump = '/tmp/database-backup.sql'
  $containerUploadsDump = '/tmp/uploads-backup.tar.gz'

  & $docker compose -f "$composeFile" --env-file "$envFile" up -d db backend | Out-Null

  & $docker compose -f "$composeFile" --env-file "$envFile" exec -T db sh -lc "pg_dump -U `"`$POSTGRES_USER`" `"`$POSTGRES_DB`" > $containerDbDump"
  & $docker compose -f "$composeFile" --env-file "$envFile" cp "db:$containerDbDump" "$dbDump"

  & $docker compose -f "$composeFile" --env-file "$envFile" exec -T backend sh -lc "if [ -d /app/uploads ]; then tar -C /app -czf $containerUploadsDump uploads; else tar -C /tmp -czf $containerUploadsDump --files-from /dev/null; fi"
  & $docker compose -f "$composeFile" --env-file "$envFile" cp "backend:$containerUploadsDump" "$uploadsDump"

  & $docker compose -f "$composeFile" --env-file "$envFile" exec -T db sh -lc "rm -f $containerDbDump" | Out-Null
  & $docker compose -f "$composeFile" --env-file "$envFile" exec -T backend sh -lc "rm -f $containerUploadsDump" | Out-Null

  if ((Get-Item $dbDump).Length -le 0) {
    Write-Error 'database.sql vacío; pg_dump falló.'
    exit 93
  }

  if ((Get-Item $uploadsDump).Length -le 0) {
    Write-Error 'uploads.tar.gz vacío.'
    exit 94
  }

  $hashInput = [System.IO.File]::ReadAllBytes($dbDump) + [System.IO.File]::ReadAllBytes($uploadsDump)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $checksum = ([System.BitConverter]::ToString($sha.ComputeHash($hashInput))).Replace('-', '').ToLowerInvariant()

  $metadata = @{
    appVersion = '1.0.0'
    schemaVersion = 'v1'
    createdAt = (Get-Date).ToString('o')
    checksum = $checksum
    archiveName = $archiveName
    archivePath = $archivePath
  } | ConvertTo-Json

  $metadataPath = Join-Path $workDir 'metadata.json'
  $metadata | Out-File -FilePath $metadataPath -Encoding utf8

  Compress-Archive -Path "$dbDump", "$uploadsDump", "$metadataPath" -DestinationPath $archivePath -Force

  if ((Get-Item $archivePath).Length -le 0) {
    Write-Error 'No se pudo generar el archivo de backup.'
    exit 95
  }

  Write-Output $metadata
}
finally {
  Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
}

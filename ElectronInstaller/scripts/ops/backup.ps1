param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [Parameter(Mandatory = $true)][string]$ProjectRoot,
  [string]$label = 'manual'
)

$ErrorActionPreference = 'Stop'
$envFile = Join-Path $RuntimePath '.env.prod'
if (-not (Test-Path $envFile)) {
  Write-Error '.env.prod no encontrado en runtimePath.'
  exit 91
}

$composeFile = Join-Path $ProjectRoot 'docker-compose.prod.yml'
$backupDir = Join-Path $RuntimePath 'backups'
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$safeLabel = ($label -replace '[^A-Za-z0-9_-]', '')
if ([string]::IsNullOrWhiteSpace($safeLabel)) {
  $safeLabel = 'manual'
}
$workDir = Join-Path $env:TEMP ("smarteconomat-backup-" + [guid]::NewGuid().ToString('N'))
New-Item -Path $workDir -ItemType Directory -Force | Out-Null

$archiveName = ('backup-{0}-{1}.zip' -f $safeLabel, $stamp)
$archivePath = Join-Path $backupDir $archiveName

try {
  $dbDump = Join-Path $workDir 'database.sql'
  $uploadsDump = Join-Path $workDir 'uploads.tar.gz'

  docker compose -f "$composeFile" --env-file "$envFile" exec -T db sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | Out-File -FilePath $dbDump -Encoding utf8
  docker compose -f "$composeFile" --env-file "$envFile" exec -T backend sh -lc 'tar -C /app -czf - uploads' | Out-File -FilePath $uploadsDump -Encoding byte

  $hashInput = [System.IO.File]::ReadAllBytes($dbDump) + [System.IO.File]::ReadAllBytes($uploadsDump)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $checksum = ([System.BitConverter]::ToString($sha.ComputeHash($hashInput))).Replace('-', '').ToLowerInvariant()

  $metadata = @{
    appVersion = '1.0.0'
    schemaVersion = 'v1'
    createdAt = (Get-Date).ToString('o')
    checksum = $checksum
    archiveName = $archiveName
  } | ConvertTo-Json

  $metadataPath = Join-Path $workDir 'metadata.json'
  $metadata | Out-File -FilePath $metadataPath -Encoding utf8

  Compress-Archive -Path "$dbDump", "$uploadsDump", "$metadataPath" -DestinationPath $archivePath -Force

  Write-Output $metadata
}
finally {
  Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
}

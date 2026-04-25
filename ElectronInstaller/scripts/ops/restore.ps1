param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [Parameter(Mandatory = $true)][string]$ProjectRoot,
  [Parameter(Mandatory = $true)][string]$artifact
)

$ErrorActionPreference = 'Stop'

$envFile = Join-Path $RuntimePath '.env.prod'
$composeFile = Join-Path $ProjectRoot 'docker-compose.prod.yml'

if (-not (Test-Path $artifact)) {
  Write-Error 'Artefacto de backup no encontrado.'
  exit 95
}

$workDir = Join-Path $env:TEMP ("smarteconomat-restore-" + [guid]::NewGuid().ToString('N'))
New-Item -Path $workDir -ItemType Directory -Force | Out-Null

try {
  Expand-Archive -Path "$artifact" -DestinationPath "$workDir" -Force

  $dbDump = Join-Path $workDir 'database.sql'
  $uploadsDump = Join-Path $workDir 'uploads.tar.gz'

  if (-not (Test-Path $dbDump) -or -not (Test-Path $uploadsDump)) {
    Write-Error 'Formato de backup inválido.'
    exit 97
  }

  docker compose -f "$composeFile" --env-file "$envFile" up -d db backend

  Get-Content "$dbDump" | docker compose -f "$composeFile" --env-file "$envFile" exec -T db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
  Get-Content "$uploadsDump" -Encoding Byte | docker compose -f "$composeFile" --env-file "$envFile" exec -T backend sh -lc 'tar -C /app -xzf -'

  docker compose -f "$composeFile" --env-file "$envFile" up -d --build

  Write-Output 'Restore completed'
}
finally {
  Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
}

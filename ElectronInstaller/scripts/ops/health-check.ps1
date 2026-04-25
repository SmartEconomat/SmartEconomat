param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [Parameter(Mandatory = $true)][string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'

$envFile = Join-Path $RuntimePath '.env.prod'
$composeFile = Join-Path $ProjectRoot 'docker-compose.prod.yml'

docker compose -f "$composeFile" --env-file "$envFile" ps --format json

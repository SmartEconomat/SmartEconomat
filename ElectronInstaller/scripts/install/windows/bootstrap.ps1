param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [ValidateSet('all', 'tls')][string]$Mode = 'all',
  [string]$Domain = 'smarteconomat.app',
  [switch]$ReleaseBusyPorts
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RuntimePath)) {
  Write-Error 'RuntimePath no puede estar vacío.'
  exit 90
}

$RuntimePath = [System.IO.Path]::GetFullPath($RuntimePath)

if (-not (Test-Path $RuntimePath)) {
  New-Item -Path $RuntimePath -ItemType Directory -Force | Out-Null
}

New-Item -Path (Join-Path $RuntimePath 'backups') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $RuntimePath 'diagnostics') -ItemType Directory -Force | Out-Null

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error 'Docker no encontrado en PATH.'
  exit 1
}

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error 'docker compose no disponible.'
  exit 2
}

function Get-PortOwner {
  param([Parameter(Mandatory = $true)][int]$Port)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $connection) {
    return $null
  }

  $owningPid = [int]$connection.OwningProcess
  $processName = (Get-Process -Id $owningPid -ErrorAction SilentlyContinue).ProcessName
  if (-not $processName) {
    $processName = 'desconocido'
  }

  return [PSCustomObject]@{
    Port = $Port
    Pid = $owningPid
    ProcessName = $processName
  }
}

function Test-IsDockerOwnerProcess {
  param([Parameter(Mandatory = $true)][string]$ProcessName)

  $normalized = $ProcessName.Trim().ToLowerInvariant()
  return @('docker', 'dockerd', 'docker desktop', 'com.docker.backend', 'com.docker.service') -contains $normalized
}

function Get-InstallerDockerContainersByPort {
  param([Parameter(Mandatory = $true)][int]$Port)

  $format = '{{.ID}}|{{.Names}}|{{.Label "com.docker.compose.project"}}'
  $lines = docker ps --filter "publish=$Port" --format $format 2>$null

  $containers = @()
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    $parts = $line -split '\|', 3
    if ($parts.Count -lt 2) {
      continue
    }

    $id = $parts[0].Trim()
    $name = $parts[1].Trim()
    $project = if ($parts.Count -ge 3) { $parts[2].Trim() } else { '' }

    if ([string]::IsNullOrWhiteSpace($id) -or [string]::IsNullOrWhiteSpace($name)) {
      continue
    }

    $normalizedName = $name.ToLowerInvariant()
    $normalizedProject = $project.ToLowerInvariant()
    $isInstallerContainer =
      $normalizedProject -eq 'smarteconomat-prod' -or
      $normalizedProject -eq 'smarteconomat' -or
      $normalizedName.StartsWith('smarteconomat-') -or
      $normalizedName.StartsWith('smarteconomat_')

    if ($isInstallerContainer) {
      $containers += [PSCustomObject]@{
        Id = $id
        Name = $name
        ComposeProject = $project
      }
    }
  }

  return $containers
}

function Stop-InstallerDockerContainersByPort {
  param([Parameter(Mandatory = $true)][int]$Port)

  $containers = Get-InstallerDockerContainersByPort -Port $Port
  if (-not $containers -or $containers.Count -eq 0) {
    return $false
  }

  $ids = @($containers | ForEach-Object { $_.Id })
  docker stop $ids *> $null
  if ($LASTEXITCODE -ne 0) {
    return $false
  }

  return $true
}

function Ensure-PortAvailable {
  param([Parameter(Mandatory = $true)][int]$Port)

  $owner = Get-PortOwner -Port $Port
  if (-not $owner) {
    return $true
  }

  if (-not $ReleaseBusyPorts) {
    Write-Error "Puerto $Port ocupado por '$($owner.ProcessName)' (PID $($owner.Pid)). Reejecuta con -ReleaseBusyPorts para cerrarlo automáticamente."
    return $false
  }

  $ownerProcessName = [string]$owner.ProcessName
  if (Test-IsDockerOwnerProcess -ProcessName $ownerProcessName) {
    $dockerReleased = Stop-InstallerDockerContainersByPort -Port $Port
    if ($dockerReleased) {
      $postDockerOwner = Get-PortOwner -Port $Port
      if (-not $postDockerOwner) {
        return $true
      }
      $owner = $postDockerOwner
    }
    else {
      Write-Error "Puerto $Port ocupado por proceso Docker, pero no se encontraron/stopparon contenedores del instalador SmartEconomat en ese puerto."
      return $false
    }
  }

  if ($owner.Pid -le 0 -or $owner.Pid -eq 4) {
    Write-Error "Puerto $Port ocupado por PID no terminable ($($owner.Pid))."
    return $false
  }

  try {
    Stop-Process -Id $owner.Pid -Force -ErrorAction Stop
  }
  catch {
    Write-Error ("No se pudo detener PID {0} en puerto {1}: {2}" -f $owner.Pid, $Port, $_.Exception.Message)
    return $false
  }

  $stillBusy = Get-PortOwner -Port $Port
  if ($stillBusy) {
    Write-Error ("Puerto {0} sigue ocupado tras intentar detener PID {1}." -f $Port, $owner.Pid)
    return $false
  }

  return $true
}

if ($Mode -ne 'tls') {
  if (-not (Ensure-PortAvailable -Port 80)) {
    exit 3
  }

  if (-not (Ensure-PortAvailable -Port 443)) {
    exit 3
  }
}

if ($Mode -eq 'all' -or $Mode -eq 'tls') {
  $openssl = Get-Command openssl -ErrorAction SilentlyContinue
  if (-not $openssl) {
    Write-Error 'OpenSSL requerido para generar certificados. Instala OpenSSL y asegúrate de que openssl.exe esté en PATH. Ejemplos: winget install ShiningLight.OpenSSL.Light o choco install openssl.'
    exit 4
  }

  $certsDir = Join-Path $RuntimePath 'certs'
  $liveDir = Join-Path $certsDir 'live/local-smarteconomat'
  $webroot = Join-Path $RuntimePath 'certs-webroot/.well-known/acme-challenge'

  New-Item -Path $liveDir -ItemType Directory -Force | Out-Null
  New-Item -Path $webroot -ItemType Directory -Force | Out-Null

  $keyFile = Join-Path $liveDir 'privkey.pem'
  $fullchain = Join-Path $liveDir 'fullchain.pem'
  $sanCnf = Join-Path $certsDir 'san.cnf'

  $sanContent = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = ES
O = SmartEconomat
CN = $Domain

[v3_req]
subjectAltName = DNS:$Domain, DNS:localhost, DNS:api.$Domain, IP:127.0.0.1
basicConstraints = CA:TRUE
keyUsage = digitalSignature, keyEncipherment, keyCertSign
extendedKeyUsage = serverAuth
"@
  Set-Content -Path $sanCnf -Value $sanContent -Encoding Ascii

  & $openssl.Path req -x509 -nodes -newkey rsa:4096 -sha256 -days 825 -keyout "$keyFile" -out "$fullchain" -config "$sanCnf" | Out-Null

  Copy-Item -Path $fullchain -Destination (Join-Path $certsDir 'fullchain.pem') -Force
  Copy-Item -Path $keyFile -Destination (Join-Path $certsDir 'privkey.pem') -Force
}

$output = @{
  ok = $true
  mode = $Mode
  runtimePath = $RuntimePath
  releaseBusyPorts = [bool]$ReleaseBusyPorts
}

$output | ConvertTo-Json -Compress

<#
.SYNOPSIS
  Guardian externo de SmartEconomat para Windows.
  Monitorea que Electron y Docker estén operativos y los reinicia si caen.

.DESCRIPTION
  Este script se ejecuta como tarea programada de Windows.
  Verifica cada $CheckIntervalSeconds que:
  1. El proceso SmartEconomatInstaller (Electron) esté corriendo.
  2. Docker Engine responda.
  3. Los contenedores del stack estén operativos.

  Si Electron no está corriendo, lo relanza con --background.
  Si Docker no responde, intenta iniciarlo.
  Si los contenedores están caídos, ejecuta docker compose up -d.

.PARAMETER CheckIntervalSeconds
  Intervalo entre comprobaciones. Por defecto 120 (2 minutos).

.PARAMETER MaxRetries
  Máximo de reintentos consecutivos antes de esperar un ciclo largo. Por defecto 5.

.PARAMETER BackoffMultiplier
  Multiplicador de backoff exponencial. Por defecto 2.

.PARAMETER LogFile
  Ruta del archivo de log. Por defecto %APPDATA%\SmartEconomatInstaller\guardian-watchdog.log
#>
param(
    [int]$CheckIntervalSeconds = 120,
    [int]$MaxRetries = 5,
    [double]$BackoffMultiplier = 2,
    [string]$LogFile = "$env:APPDATA\SmartEconomatInstaller\guardian-watchdog.log"
)

$ErrorActionPreference = 'Continue'
$consecutiveFailures = 0

function Write-GuardianLog {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $entry = "[$timestamp] $Message"
    Write-Output $entry
    try {
        $logDir = Split-Path $LogFile
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        Add-Content -Path $LogFile -Value $entry -Encoding UTF8
    } catch {
        # Silenciar errores de log
    }
}

function Get-ElectronProcess {
    return Get-Process -Name 'SmartEconomatInstaller' -ErrorAction SilentlyContinue
}

function Get-ElectronPath {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\SmartEconomatInstaller\SmartEconomatInstaller.exe",
        "$env:ProgramFiles\SmartEconomatInstaller\SmartEconomatInstaller.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    return $null
}

function Test-DockerEngine {
    try {
        $result = docker version --format '{{.Server.Version}}' 2>$null
        return ($LASTEXITCODE -eq 0 -and $result)
    } catch {
        return $false
    }
}

function Start-DockerDesktop {
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "C:\Program Files\Docker\Docker\Docker Desktop"
    )
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Write-GuardianLog "Iniciando Docker Desktop desde: $path"
            Start-Process -FilePath $path -WindowStyle Hidden
            return $true
        }
    }
    return $false
}

function Get-RuntimePath {
    $markerPath = "$env:APPDATA\SmartEconomatInstaller\runtime-path.txt"
    if (Test-Path $markerPath) {
        $rtp = (Get-Content $markerPath -Raw).Trim()
        if ($rtp -and (Test-Path "$rtp\project\docker-compose.prod.yml")) {
            return $rtp
        }
    }

    $fallback = "C:\SmartEconomatRuntime"
    if (Test-Path "$fallback\project\docker-compose.prod.yml") {
        return $fallback
    }

    return $null
}

function Test-StackHealth {
    param([string]$RuntimePath)
    try {
        $composeFile = Join-Path $RuntimePath 'project\docker-compose.prod.yml'
        $envFile = Join-Path $RuntimePath '.env.prod'
        $output = docker compose -f $composeFile --env-file $envFile ps --format json 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }

        $services = $output | ConvertFrom-Json
        if (-not $services) { return $false }

        foreach ($svc in $services) {
            $state = ($svc.State ?? $svc.Status ?? '').ToLower()
            $health = ($svc.Health ?? '').ToLower()
            if ($health -eq 'unhealthy' -or $state -match 'exited|dead|failed') {
                return $false
            }
        }
        return $true
    } catch {
        return $false
    }
}

function Start-Stack {
    param([string]$RuntimePath)
    $composeFile = Join-Path $RuntimePath 'project\docker-compose.prod.yml'
    $envFile = Join-Path $RuntimePath '.env.prod'
    try {
        docker compose -f $composeFile --env-file $envFile up -d --remove-orphans 2>&1 | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

# ── Loop principal ────────────────────────────────────────────

Write-GuardianLog "Guardian Watchdog iniciado. Intervalo: ${CheckIntervalSeconds}s"

while ($true) {
    $currentInterval = $CheckIntervalSeconds
    if ($consecutiveFailures -gt 0) {
        $currentInterval = [Math]::Min(
            $CheckIntervalSeconds * [Math]::Pow($BackoffMultiplier, $consecutiveFailures),
            1800
        )
    }

    $issueDetected = $false

    # 1. Verificar Electron
    $electronProc = Get-ElectronProcess
    if (-not $electronProc) {
        Write-GuardianLog "WARN: Electron no esta corriendo. Intentando relanzar..."
        $electronPath = Get-ElectronPath
        if ($electronPath) {
            Start-Process -FilePath $electronPath -ArgumentList '--background', '--control-panel' -WindowStyle Hidden
            Write-GuardianLog "Electron relanzado."
        } else {
            Write-GuardianLog "ERROR: No se encontro el ejecutable de Electron."
            $issueDetected = $true
        }
    }

    # 2. Verificar Docker Engine
    if (-not (Test-DockerEngine)) {
        Write-GuardianLog "WARN: Docker Engine no responde. Intentando iniciar Docker Desktop..."
        $started = Start-DockerDesktop
        if ($started) {
            # Esperar hasta 2 minutos
            $dockerReady = $false
            for ($i = 0; $i -lt 30; $i++) {
                Start-Sleep -Seconds 4
                if (Test-DockerEngine) {
                    $dockerReady = $true
                    Write-GuardianLog "Docker Engine operativo."
                    break
                }
            }
            if (-not $dockerReady) {
                Write-GuardianLog "ERROR: Docker Engine no respondio tras espera."
                $issueDetected = $true
            }
        } else {
            Write-GuardianLog "ERROR: No se pudo iniciar Docker Desktop."
            $issueDetected = $true
        }
    }

    # 3. Verificar stack de contenedores
    if (Test-DockerEngine) {
        $runtimePath = Get-RuntimePath
        if ($runtimePath) {
            if (-not (Test-StackHealth -RuntimePath $runtimePath)) {
                Write-GuardianLog "WARN: Stack no esta healthy. Ejecutando docker compose up -d..."
                $stackOk = Start-Stack -RuntimePath $runtimePath
                if ($stackOk) {
                    Write-GuardianLog "Stack levantado correctamente."
                } else {
                    Write-GuardianLog "ERROR: No se pudo levantar el stack."
                    $issueDetected = $true
                }
            }
        }
    }

    # Actualizar backoff
    if ($issueDetected) {
        $consecutiveFailures++
        if ($consecutiveFailures -ge $MaxRetries) {
            Write-GuardianLog "WARN: Alcanzado maximo de reintentos ($MaxRetries). Aplicando backoff largo."
        }
    } else {
        if ($consecutiveFailures -gt 0) {
            Write-GuardianLog "OK: Todo operativo. Reseteando contador de fallos."
        }
        $consecutiveFailures = 0
    }

    Start-Sleep -Seconds $currentInterval
}

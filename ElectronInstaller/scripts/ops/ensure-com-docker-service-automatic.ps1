# Configura com.docker.service en Automatic y verifica StartMode.
# Salida JSON en stdout: { "ok": bool, "startMode": string, "state": string, "detail": string }
# Exit 0 = Automatic confirmado; 2 = servicio no encontrado; 1 = fallo de configuración.

param(
    [switch]$StartIfStopped,
    [switch]$ConfigureOnly
)

$ErrorActionPreference = 'Stop'
$ServiceName = 'com.docker.service'

function Write-Result {
    param(
        [bool]$Ok,
        [string]$StartMode,
        [string]$State,
        [string]$Detail,
        [int]$ExitCode
    )
    $payload = @{
        ok        = $Ok
        startMode = $StartMode
        state     = $State
        detail    = $Detail
    } | ConvertTo-Json -Compress
    Write-Output $payload
    exit $ExitCode
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($null -eq $service) {
    Write-Result -Ok $false -StartMode 'missing' -State 'missing' -Detail 'Servicio no encontrado' -ExitCode 2
}

$before = Get-CimInstance Win32_Service -Filter "Name='$ServiceName'"
$beforeMode = $before.StartMode

if (-not $ConfigureOnly) {
    & sc.exe config $ServiceName start= auto 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Result -Ok $false -StartMode $beforeMode -State $service.Status.ToString() `
            -Detail "sc.exe config start=auto falló (exit=$LASTEXITCODE)" -ExitCode 1
    }

    & sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/15000/restart/30000 2>&1 | Out-Null

    Set-Service -Name $ServiceName -StartupType Automatic

    if ($StartIfStopped -and $service.Status -ne 'Running') {
        Start-Service -Name $ServiceName -ErrorAction Stop
    }
}

$after = Get-CimInstance Win32_Service -Filter "Name='$ServiceName'"
$afterMode = $after.StartMode
$afterState = $after.State

$isAuto = ($afterMode -eq 'Auto' -or $afterMode -eq 'Automatic')
if ($isAuto) {
    $detail = "StartMode=$afterMode (antes=$beforeMode)"
    Write-Result -Ok $true -StartMode $afterMode -State $afterState -Detail $detail -ExitCode 0
}

Write-Result -Ok $false -StartMode $afterMode -State $afterState `
    -Detail "DOCKER_SERVICE_STARTMODE_MANUAL: sigue en $afterMode (antes=$beforeMode)" -ExitCode 1

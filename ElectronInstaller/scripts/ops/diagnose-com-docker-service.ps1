# Diagnóstico de com.docker.service — SmartEconomat
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File diagnose-com-docker-service.ps1
# Ejecutar como administrador para lectura completa de sc qc.

$ErrorActionPreference = 'Continue'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host "=== Diagnóstico com.docker.service @ $timestamp ===" -ForegroundColor Cyan

$service = Get-CimInstance Win32_Service -Filter "Name='com.docker.service'" -ErrorAction SilentlyContinue
if ($null -eq $service) {
    Write-Host "com.docker.service: NO ENCONTRADO" -ForegroundColor Red
} else {
    Write-Host "Name:       $($service.Name)"
    Write-Host "StartMode:  $($service.StartMode)"
    Write-Host "State:      $($service.State)"
    Write-Host "StartName:  $($service.StartName)"
}

Write-Host ""
Write-Host "--- sc.exe qc ---" -ForegroundColor Yellow
sc.exe qc com.docker.service 2>&1

Write-Host ""
Write-Host "--- SmartEconomatSupervisor ---" -ForegroundColor Yellow
$smSvc = Get-Service -Name 'SmartEconomatSupervisor' -ErrorAction SilentlyContinue
if ($null -eq $smSvc) {
    Write-Host "SmartEconomatSupervisor: no instalado o no encontrado"
} else {
    Write-Host "Status: $($smSvc.Status)  StartType: $($smSvc.StartType)"
}

Write-Host ""
Write-Host "--- Logs supervisor (últimas 40 líneas) ---" -ForegroundColor Yellow
$logDir = 'C:\ProgramData\SmartEconomat\logs'
if (Test-Path -LiteralPath $logDir) {
    $latest = Get-ChildItem -LiteralPath $logDir -Filter 'supervisor-*.log' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($latest) {
        Write-Host "Archivo: $($latest.FullName)"
        Get-Content -LiteralPath $latest.FullName -Tail 40
    } else {
        Write-Host "Sin archivos supervisor-*.log"
    }
} else {
    Write-Host "Directorio de logs no existe: $logDir"
}

Write-Host ""
Write-Host "--- Correlación sugerida ---" -ForegroundColor Cyan
Write-Host "1. Si StartMode=Manual tras cerrar Docker Desktop -> probablemente Docker Desktop (no SmartEconomat)."
Write-Host "2. Si Manual tras reinicio antes de 5-15 min -> gracia de arranque Electron (esperado temporalmente)."
Write-Host "3. Si Manual persistente con SmartEconomatSupervisor Running -> revisar logs y permisos de configuración."

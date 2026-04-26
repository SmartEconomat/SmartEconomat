$ErrorActionPreference = "Continue"

$publishDir = "C:\Program Files\SmartEconomat\supervisor"
$winswExe = Join-Path $publishDir "winsw-x64.exe"

if (-not (Test-Path $winswExe)) {
  Write-Host "No se encontró WinSW en $winswExe."
  exit 0
}

Push-Location $publishDir
try {
  & $winswExe stop
  & $winswExe uninstall
} finally {
  Pop-Location
}

Write-Host "Servicio SmartEconomatSupervisor eliminado."

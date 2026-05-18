param(
  [string]$PublishDir = "C:\Program Files\SmartEconomat\supervisor"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Path $PublishDir -Force | Out-Null
New-Item -ItemType Directory -Path "C:\ProgramData\SmartEconomat\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "C:\ProgramData\SmartEconomat\state" -Force | Out-Null

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $scriptRoot "..\src"
$winswSourceDir = Join-Path $scriptRoot "..\winsw"
$opsScriptSource = Join-Path $scriptRoot "..\..\scripts\ops\ensure-com-docker-service-automatic.ps1"

dotnet publish (Join-Path $sourceDir "SmartEconomat.WindowsSupervisor.csproj") -c Release -o $PublishDir

$opsDestDir = Join-Path $PublishDir "scripts\ops"
New-Item -ItemType Directory -Path $opsDestDir -Force | Out-Null
if (Test-Path $opsScriptSource) {
  Copy-Item $opsScriptSource (Join-Path $opsDestDir "ensure-com-docker-service-automatic.ps1") -Force
} else {
  Write-Warning "No se encontró script canónico en $opsScriptSource"
}

Copy-Item (Join-Path $sourceDir "appsettings.json") (Join-Path $PublishDir "appsettings.json") -Force

$winswExe = Join-Path $PublishDir "winsw-x64.exe"
$winswXml = Join-Path $PublishDir "SmartEconomatSupervisor.xml"

Copy-Item (Join-Path $winswSourceDir "winsw-x64.exe") $winswExe -Force
Copy-Item (Join-Path $winswSourceDir "SmartEconomatSupervisor.xml") $winswXml -Force

if (-not (Test-Path $winswExe)) {
  throw "Falta winsw-x64.exe en $PublishDir. Copia WinSW antes de instalar el servicio."
}

Push-Location $PublishDir
try {
  & $winswExe stop | Out-Null
  & $winswExe uninstall | Out-Null
} catch {
}

& $winswExe install
& $winswExe start
Pop-Location

Write-Host "Servicio SmartEconomatSupervisor instalado."

param(
  [string]$RuntimePath = "C:\SmartEconomatRuntime",
  [string]$InstallDir = "",
  [switch]$PreserveRuntime,
  [switch]$SkipDockerCleanup,
  [switch]$SkipShortcutsCleanup,
  [switch]$SkipHostsCleanup,
  [switch]$SkipRegistryCleanup
)

$ErrorActionPreference = "SilentlyContinue"

function Write-Step($message) {
  Write-Output "[uninstall-clean] $message"
}

function Remove-PathSafe([string]$targetPath) {
  if ([string]::IsNullOrWhiteSpace($targetPath)) {
    return
  }

  if (Test-Path -LiteralPath $targetPath) {
    Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Step "Removed: $targetPath"
  }
}

function Remove-RegistrySmartEconomat() {
  $roots = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
  )

  foreach ($root in $roots) {
    if (-not (Test-Path $root)) {
      continue
    }

    Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
      $item = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
      if ($item.DisplayName -match "SmartEconomat" -or $item.Publisher -match "SmartEconomat") {
        Remove-Item -LiteralPath $_.PSPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Step "Removed registry key: $($_.PSPath)"
      }
    }
  }
}

function Remove-AppRegistryKeys() {
  $keys = @(
    "HKCU:\Software\SmartEconomat",
    "HKLM:\Software\SmartEconomat",
    "HKLM:\Software\WOW6432Node\SmartEconomat"
  )

  foreach ($key in $keys) {
    if (Test-Path -LiteralPath $key) {
      Remove-Item -LiteralPath $key -Recurse -Force -ErrorAction SilentlyContinue
      Write-Step "Removed app registry key: $key"
    }
  }
}

function Remove-ScheduledTasksSmartEconomat() {
  $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {
    $_.TaskName -match "SmartEconomat" -or $_.TaskPath -match "SmartEconomat"
  }

  foreach ($task in $tasks) {
    Unregister-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Confirm:$false -ErrorAction SilentlyContinue
    Write-Step "Removed scheduled task: $($task.TaskPath)$($task.TaskName)"
  }
}

function Remove-FirewallRulesSmartEconomat() {
  $rules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object {
    $_.DisplayName -match "SmartEconomat" -or $_.Group -match "SmartEconomat"
  }

  foreach ($rule in $rules) {
    Remove-NetFirewallRule -Name $rule.Name -ErrorAction SilentlyContinue
    Write-Step "Removed firewall rule: $($rule.DisplayName)"
  }
}

function Remove-CertificatesSmartEconomat() {
  $stores = @("Cert:\CurrentUser\Root", "Cert:\CurrentUser\CA", "Cert:\LocalMachine\Root", "Cert:\LocalMachine\CA")

  foreach ($store in $stores) {
    $certs = Get-ChildItem -Path $store -ErrorAction SilentlyContinue | Where-Object {
      $_.Subject -match "SmartEconomat|smarteconomat\.app" -or $_.Issuer -match "SmartEconomat|smarteconomat\.app"
    }

    foreach ($cert in $certs) {
      Remove-Item -Path $cert.PSPath -Force -ErrorAction SilentlyContinue
      Write-Step "Removed certificate: $($cert.Subject)"
    }
  }
}

function Cleanup-RuntimeResidues([string]$runtimePath) {
  if ([string]::IsNullOrWhiteSpace($runtimePath)) {
    return
  }

  $transient = @(
    Join-Path $runtimePath "logs",
    Join-Path $runtimePath "log",
    Join-Path $runtimePath "diagnostics",
    Join-Path $runtimePath "diagnostic",
    Join-Path $runtimePath "tmp",
    Join-Path $runtimePath "temp",
    Join-Path $runtimePath "cache",
    Join-Path $runtimePath ".write-check.tmp",
    Join-Path $runtimePath "certs-webroot"
  )

  foreach ($path in $transient) {
    Remove-PathSafe -targetPath $path
  }
}

function Cleanup-DockerSmartEconomat([string]$runtimePath, [string]$installDir) {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    Write-Step "Docker not found. Skipping Docker cleanup."
    return
  }

  $envFile = Join-Path $runtimePath ".env.prod"
  $composeCandidates = @()

  if (-not [string]::IsNullOrWhiteSpace($installDir)) {
    $composeCandidates += Join-Path $installDir "resources\project\docker-compose.prod.yml"
  }

  $composeCandidates += Join-Path $runtimePath "project\docker-compose.prod.yml"

  foreach ($composeFile in ($composeCandidates | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $composeFile)) {
      continue
    }

    if (Test-Path -LiteralPath $envFile) {
      & docker compose -f $composeFile --env-file $envFile down -v --rmi all --remove-orphans | Out-Null
      Write-Step "docker compose down -v --rmi all executed for $composeFile (with env)."
    }
    else {
      & docker compose -f $composeFile down -v --rmi all --remove-orphans | Out-Null
      Write-Step "docker compose down -v --rmi all executed for $composeFile (without env)."
    }
  }

  $composeProjects = @("smarteconomat", "smarteconomat-prod", "smarteconomat_prod")

  $containerIdsByProject = @()
  foreach ($project in $composeProjects) {
    $containerIdsByProject += (& docker ps -aq --filter "label=com.docker.compose.project=$project")
  }

  $containerIdsByName = & docker ps -aq --filter "name=smarteconomat"
  $containerIds = @($containerIdsByProject + $containerIdsByName) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  $imageIdsFromContainers = @()
  if ($containerIds.Count -gt 0) {
    $imageIdsFromContainers = & docker inspect --format "{{.Image}}" $containerIds
    & docker rm -f $containerIds | Out-Null
    Write-Step "Removed SmartEconomat containers (project labels + name pattern)."
  }

  $volumeNames = @(
    (& docker volume ls --format "{{.Name}}") | Where-Object { $_ -match "(?i)smarteconomat" }
  )

  foreach ($project in $composeProjects) {
    $volumeNames += (& docker volume ls -q --filter "label=com.docker.compose.project=$project")
  }

  $volumeNames = $volumeNames |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  if ($volumeNames.Count -gt 0) {
    & docker volume rm -f $volumeNames | Out-Null
    Write-Step "Removed SmartEconomat volumes."
  }

  $networkNames = @(
    (& docker network ls --format "{{.Name}}") | Where-Object { $_ -match "(?i)smarteconomat" }
  )

  foreach ($project in $composeProjects) {
    $networkNames += (& docker network ls -q --filter "label=com.docker.compose.project=$project")
  }

  $networkNames = $networkNames |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  if ($networkNames.Count -gt 0) {
    & docker network rm $networkNames | Out-Null
    Write-Step "Removed SmartEconomat networks."
  }

  $imageIdsByReference = @(
    (& docker image ls -q --filter "reference=*smarteconomat*")
  )

  $imageIds = @($imageIdsByReference + $imageIdsFromContainers) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  if ($imageIds.Count -gt 0) {
    & docker image rm -f $imageIds | Out-Null
    Write-Step "Removed SmartEconomat images."
  }
}

function Remove-HostsEntries() {
  $hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
  if (-not (Test-Path -LiteralPath $hostsPath)) {
    return
  }

  $content = Get-Content -LiteralPath $hostsPath -ErrorAction SilentlyContinue
  if (-not $content) {
    return
  }

  $filtered = $content | Where-Object { $_ -notmatch "smarteconomat\.app" }
  if ($filtered.Count -ne $content.Count) {
    Set-Content -LiteralPath $hostsPath -Value $filtered -Encoding ascii
    Write-Step "Removed hosts entries for smarteconomat.app"
  }
}

# En limpieza preventiva (-PreserveRuntime), no se deben matar procesos SmartEconomat
# porque en modo instalador empaquetado este bloque puede cerrar el propio EXE.
if (-not $PreserveRuntime) {
  Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -match "SmartEconomat|smarteconomat"
  } | Stop-Process -Force -ErrorAction SilentlyContinue
}
else {
  Write-Step "PreserveRuntime activo: se omite cierre de procesos SmartEconomat."
}

if (-not $SkipDockerCleanup) {
  Cleanup-DockerSmartEconomat -runtimePath $RuntimePath -installDir $InstallDir
}
else {
  Write-Step "Skipping Docker cleanup by request."
}

if ($PreserveRuntime) {
  Cleanup-RuntimeResidues -runtimePath $RuntimePath
  Cleanup-RuntimeResidues -runtimePath "C:\SmartEconomatRuntime"
  Write-Step "Runtime preserved; transient residues cleaned."
}

$basePathsToDelete = @(
  "$env:APPDATA\SmartEconomatInstaller",
  "$env:LOCALAPPDATA\SmartEconomatInstaller",
  "$env:APPDATA\SmartEconomat",
  "$env:LOCALAPPDATA\SmartEconomat",
  "$env:ProgramData\SmartEconomat",
  "$env:ProgramData\Smart Economat",
  "$env:TEMP\SmartEconomat-installer.log"
)

$installArtifactsPaths = @(
  "$env:ProgramFiles\SmartEconomat",
  "$env:ProgramFiles\Smart Economat",
  "${env:ProgramFiles(x86)}\SmartEconomat",
  "${env:ProgramFiles(x86)}\Smart Economat",
  "$env:LOCALAPPDATA\Programs\SmartEconomat",
  "$env:LOCALAPPDATA\Programs\Smart Economat"
)

$shortcutPaths = @(
  "$env:USERPROFILE\Desktop\SmartEconomat.lnk",
  "$env:USERPROFILE\Desktop\SmartEconomat Uninstaller.lnk",
  "$env:PUBLIC\Desktop\SmartEconomat.lnk",
  "$env:PUBLIC\Desktop\SmartEconomat Uninstaller.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat.lnk",
  "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat Uninstaller.lnk",
  "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat Uninstaller.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat",
  "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\SmartEconomat"
)

$pathsToDelete = @($basePathsToDelete)

# Modo limpieza preventiva: NO eliminar binarios instalados ni accesos directos.
if (-not $PreserveRuntime) {
  $pathsToDelete += $installArtifactsPaths
  if (-not $SkipShortcutsCleanup) {
    $pathsToDelete += $shortcutPaths
  }
  else {
    Write-Step "Skipping shortcuts cleanup by request."
  }
}
else {
  Write-Step "PreserveRuntime activo: se omite limpieza de binarios/accesos directos."
}

if (-not $PreserveRuntime) {
  $pathsToDelete += @(
    $RuntimePath,
    "C:\SmartEconomatRuntime"
  )
}

foreach ($target in $pathsToDelete) {
  Remove-PathSafe -targetPath $target
}

# Modo limpieza preventiva: no tocar elementos globales del sistema.
if ($PreserveRuntime) {
  Write-Step "PreserveRuntime activo: se omite limpieza de hosts/registry/tasks/firewall/certs."
  Write-Step "Cleanup completed."
  exit 0
}

if (-not $SkipHostsCleanup) {
  Remove-HostsEntries
}

if (-not $SkipRegistryCleanup) {
  Remove-RegistrySmartEconomat
  Remove-AppRegistryKeys
}

Remove-ScheduledTasksSmartEconomat
Remove-FirewallRulesSmartEconomat
Remove-CertificatesSmartEconomat

Write-Step "Cleanup completed."

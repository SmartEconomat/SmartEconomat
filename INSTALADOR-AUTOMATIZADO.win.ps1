param(
  [string]$RuntimePath = "C:\SmartEconomatRuntime",
  [ValidateSet(
    "install",
    "preflight",
    "auto-repair",
    "release-port",
    "runtime-start",
    "runtime-stop",
    "runtime-restart",
    "runtime-health",
    "runtime-logs",
    "runtime-prune",
    "runtime-backup",
    "runtime-restore",
    "runtime-diagnostics",
    "runtime-reinstall-cert"
  )]
  [string]$Command = "install",
  [string]$ConfigFile = "",
  [ValidateSet("new", "reinstall")][string]$InstallMode = "new",
  [string]$AdminUsername = "admin",
  [string]$AdminPassword = "SmartEconomat2026!",
  [string]$AdminEmail = "admin@smarteconomat.com",
  [string]$SuperAdminUsername = "superadmin",
  [string]$SuperAdminPassword = "SmartEconomat2026!",
  [string]$SuperAdminEmail = "superadmin@smarteconomat.com",
  [bool]$UseSamePasswordForBoth = $true,
  [bool]$VerifyExistingAdminSession = $false,
  [bool]$RepairAdminCredentialsOnFailure = $false,
  [string]$VerifyAdminUsername = "",
  [string]$VerifyAdminPassword = "",
  [string]$InstanceName = "smarteconomat-local",
  [string]$LocalHost = "smarteconomat.app",
  [string]$Timezone = "Europe/Madrid",
  [ValidateSet("selfsigned", "none", "custom")][string]$TlsProvider = "selfsigned",
  [string]$CustomCertFullchainPath = "",
  [string]$CustomCertPrivkeyPath = "",
  [ValidateSet("off", "daily", "weekly")][string]$BackupFrequency = "daily",
  [string]$BackupDefaultDirectory = "",
  [string]$BackupScheduleTime = "03:15",
  [int]$BackupRetentionDays = 30,
  [string]$PostgresPassword = "",
  [string]$RedisPassword = "",
  [string]$JwtSecret = "",
  [int]$HttpPort = 80,
  [int]$HttpsPort = 443,
  [int]$Port = 0,
  [ValidateSet("safe", "aggressive")][string]$PruneLevel = "safe",
  [string]$Service = "backend",
  [int]$Lines = 300,
  [string]$BackupLabel = "",
  [string]$RestoreArchive = "",
  [switch]$SkipOpenBrowser,
  [switch]$NonInteractive,
  [switch]$VerboseMode,
  [switch]$ReleaseBusyPorts,
  [switch]$SkipDockerInstall,
  [switch]$SkipBuildArtifacts,
  [switch]$NoElevation
)

$Script:InstallState = "IDLE"
$Script:HostsBackupPath = $null

function Set-InstallState {
  param(
    [Parameter(Mandatory = $true)][string]$State,
    [Parameter(Mandatory = $true)][string]$Message
  )
  $Script:InstallState = $State
  Write-Log "[STATE:$State] $Message"
}

function Convert-JsonConfigToHashtable {
  param([Parameter(Mandatory = $true)]$InputObject)

  if ($null -eq $InputObject) { return @{} }
  if ($InputObject -is [System.Collections.IDictionary]) { return $InputObject }

  $hash = @{}
  $props = $InputObject.PSObject.Properties
  foreach ($prop in $props) {
    $hash[$prop.Name] = $prop.Value
  }
  return $hash
}

function Load-ConfigOverrides {
  if ([string]::IsNullOrWhiteSpace($ConfigFile)) { return @{} }
  Assert-PathExists -Path $ConfigFile -Description "Archivo de configuración JSON"
  $raw = Get-Content -Path $ConfigFile -Raw -Encoding utf8
  $parsed = $raw | ConvertFrom-Json
  return (Convert-JsonConfigToHashtable -InputObject $parsed)
}

function Resolve-Setting {
  param(
    [hashtable]$Config,
    [string]$Key,
    $DefaultValue
  )
  if ($Config.ContainsKey($Key)) { return $Config[$Key] }
  return $DefaultValue
}

function Assert-InstallerPayloadEquivalent {
  param([hashtable]$Config)
  if ([string]::IsNullOrWhiteSpace($Config.adminUsername) -or $Config.adminUsername.Trim().Length -lt 4) {
    throw "adminUsername debe tener al menos 4 caracteres."
  }
  if ([string]::IsNullOrWhiteSpace($Config.superAdminUsername) -or $Config.superAdminUsername.Trim().Length -lt 4) {
    throw "superAdminUsername debe tener al menos 4 caracteres."
  }
  if ($Config.adminUsername.Trim().ToLowerInvariant() -eq $Config.superAdminUsername.Trim().ToLowerInvariant()) {
    throw "Admin y superadmin deben ser distintos."
  }
  if ($Config.httpPort -eq $Config.httpsPort) {
    throw "Los puertos HTTP y HTTPS no pueden ser iguales."
  }
  if ($Config.tlsProvider -eq "custom") {
    if ([string]::IsNullOrWhiteSpace($Config.customCertFullchainPath) -or [string]::IsNullOrWhiteSpace($Config.customCertPrivkeyPath)) {
      throw "TLS custom requiere customCertFullchainPath y customCertPrivkeyPath."
    }
  }
  if ($Config.installMode -eq "reinstall" -and $Config.verifyExistingAdminSession -and [string]::IsNullOrWhiteSpace($Config.verifyAdminPassword)) {
    throw "En reinstall con verifyExistingAdminSession=true, verifyAdminPassword es obligatorio."
  }
  if ($Config.useSamePasswordForBoth -and $Config.adminPassword -ne $Config.superAdminPassword) {
    throw "useSamePasswordForBoth=true requiere contraseñas iguales."
  }
}

function New-PreflightCheck {
  param(
    [string]$Id,
    [string]$Label,
    [ValidateSet("OK","WARN","BLOCKER")][string]$Status,
    [string]$Detail
  )
  return [pscustomobject]@{
    id = $Id
    label = $Label
    status = $Status
    detail = $Detail
  }
}

function Get-PortOwner {
  param([int]$PortNumber)
  try {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $PortNumber -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) { return $null }
    $p = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    return [pscustomobject]@{
      pid = $conn.OwningProcess
      processName = $(if ($p) { $p.ProcessName } else { "desconocido" })
    }
  } catch {
    return $null
  }
}

function Invoke-PreflightEquivalent {
  param([string]$Runtime,[switch]$ThrowOnBlocker)
  $checks = @()
  New-Item -Path $Runtime -ItemType Directory -Force | Out-Null

  $isAdmin = Test-IsAdmin
  $checks += New-PreflightCheck -Id "windows-admin" -Label "Permisos de administrador" -Status $(if ($isAdmin) { "OK" } else { "WARN" }) -Detail $(if ($isAdmin) { "Ejecución con privilegios admin." } else { "No se ejecuta como admin." })

  $ramGb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
  $checks += New-PreflightCheck -Id "system-memory" -Label "Memoria RAM" -Status $(if ($ramGb -ge 6) { "OK" } else { "WARN" }) -Detail "RAM detectada: $ramGb GB"

  $driveRoot = ([System.IO.Path]::GetPathRoot($Runtime))
  $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$($driveRoot.TrimEnd('\'))'" -ErrorAction SilentlyContinue
  if ($disk) {
    $freeGb = [math]::Round($disk.FreeSpace / 1GB, 2)
    $checks += New-PreflightCheck -Id "system-disk" -Label "Espacio en disco" -Status $(if ($freeGb -ge 10) { "OK" } else { "BLOCKER" }) -Detail "Espacio libre: $freeGb GB"
  } else {
    $checks += New-PreflightCheck -Id "system-disk" -Label "Espacio en disco" -Status "WARN" -Detail "No se pudo leer disco de runtime."
  }

  try {
    $probe = Join-Path $Runtime ".write-check.tmp"
    Set-Content -Path $probe -Value "ok" -Encoding ascii
    Remove-Item -Path $probe -Force
    $checks += New-PreflightCheck -Id "system-write" -Label "Permisos de escritura runtime" -Status "OK" -Detail "Runtime escribible."
  } catch {
    $checks += New-PreflightCheck -Id "system-write" -Label "Permisos de escritura runtime" -Status "BLOCKER" -Detail $_.Exception.Message
  }

  $dockerInstalled = Test-DockerDesktopInstalled
  $checks += New-PreflightCheck -Id "docker-desktop-installed" -Label "Docker Desktop instalado" -Status $(if ($dockerInstalled) { "OK" } else { "BLOCKER" }) -Detail $(if ($dockerInstalled) { "Docker Desktop detectado." } else { "Docker Desktop no detectado." })

  $dockerOk = $false
  try {
    $null = docker version --format "{{.Server.Version}}" 2>$null
    if ($LASTEXITCODE -eq 0) { $dockerOk = $true }
  } catch { }
  $checks += New-PreflightCheck -Id "docker-engine" -Label "Docker Engine operativo" -Status $(if ($dockerOk) { "OK" } else { "BLOCKER" }) -Detail $(if ($dockerOk) { "Engine responde correctamente." } else { "Engine no responde." })

  $composeOk = $false
  try {
    $null = docker compose version 2>$null
    if ($LASTEXITCODE -eq 0) { $composeOk = $true }
  } catch { }
  $checks += New-PreflightCheck -Id "docker-compose" -Label "Docker Compose" -Status $(if ($composeOk) { "OK" } else { "BLOCKER" }) -Detail $(if ($composeOk) { "Compose disponible." } else { "Compose no disponible." })

  $wslOk = $false
  try {
    $out = wsl --status 2>$null | Out-String
    if ($LASTEXITCODE -eq 0 -and $out -notmatch "not compatible|no es compatible|must be enabled|debe habilitarse") { $wslOk = $true }
  } catch { }
  $checks += New-PreflightCheck -Id "wsl2" -Label "WSL2" -Status $(if ($wslOk) { "OK" } else { "BLOCKER" }) -Detail $(if ($wslOk) { "WSL2 operativo." } else { "WSL2 no operativo o no disponible." })

  foreach ($p in @(80,443)) {
    $owner = Get-PortOwner -PortNumber $p
    if ($null -eq $owner) {
      $checks += New-PreflightCheck -Id "port-$p" -Label "Puerto $p" -Status "OK" -Detail "Puerto libre."
    } else {
      $checks += New-PreflightCheck -Id "port-$p" -Label "Puerto $p" -Status "BLOCKER" -Detail "Ocupado por $($owner.processName) (PID $($owner.pid))."
    }
  }

  $tlsDepOk = $false
  if ($TlsProvider -eq "none") {
    $tlsDepOk = $true
  } else {
    $openssl = Get-OpenSslCommand
    if ($openssl) { $tlsDepOk = $true }
  }
  $checks += New-PreflightCheck -Id "tls-dependency" -Label "Dependencia TLS" -Status $(if ($tlsDepOk) { "OK" } else { "WARN" }) -Detail $(if ($tlsDepOk) { "Dependencia TLS disponible." } else { "OpenSSL no detectado." })

  $reportPath = Join-Path $Runtime "diagnostics\preflight-report.json"
  $checks | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding utf8
  Write-Log "Preflight report: $reportPath"

  $blockers = @($checks | Where-Object { $_.status -eq "BLOCKER" })
  if ($blockers.Count -gt 0 -and $ThrowOnBlocker) {
    $msg = ($blockers | ForEach-Object { "$($_.id): $($_.detail)" }) -join " | "
    throw "Preflight con bloqueantes: $msg"
  }
  return $checks
}

function Invoke-ReleasePortEquivalent {
  param([int]$PortNumber,[switch]$Strict)
  $owner = Get-PortOwner -PortNumber $PortNumber
  if ($null -eq $owner) {
    Write-Log "Puerto $PortNumber ya está libre."
    return
  }

  $dockerIds = & docker ps --filter "publish=$PortNumber" --format "{{.ID}}" 2>$null
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($dockerIds | Out-String).Trim())) {
    $idList = @($dockerIds | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($idList.Count -gt 0) {
      & docker rm -f @idList | Out-Null
      Start-Sleep -Seconds 1
      if ($null -eq (Get-PortOwner -PortNumber $PortNumber)) { return }
    }
  }

  Stop-Process -Id $owner.pid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
  if ($Strict -and $null -ne (Get-PortOwner -PortNumber $PortNumber)) {
    throw "No se pudo liberar puerto $PortNumber."
  }
}

function Invoke-AutoRepairEquivalent {
  param([string]$Runtime)
  Write-Log "[AUTO-REPAIR] Iniciando reparación automática equivalente..."
  Ensure-DockerDesktopInstalled
  Start-DockerDesktop
  Wait-DockerDaemonReady

  try { Ensure-OpenSslAvailable } catch { Write-Log "[AUTO-REPAIR] OpenSSL no se pudo asegurar: $($_.Exception.Message)" "WARN" }
  foreach ($p in @(80,443)) {
    try { Invoke-ReleasePortEquivalent -PortNumber $p } catch { Write-Log "[AUTO-REPAIR] No se pudo liberar puerto ${p}: $($_.Exception.Message)" "WARN" }
  }

  $residuePaths = @("logs","log","diagnostics","tmp","temp","cache",".write-check.tmp") | ForEach-Object { Join-Path $Runtime $_ }
  foreach ($item in $residuePaths) {
    try { Remove-Item -Path $item -Recurse -Force -ErrorAction SilentlyContinue } catch { }
  }
  New-Item -Path (Join-Path $Runtime "diagnostics") -ItemType Directory -Force | Out-Null
  Write-Log "[AUTO-REPAIR] Finalizado. Re-ejecutando preflight..."
  Invoke-PreflightEquivalent -Runtime $Runtime -ThrowOnBlocker
}

function Build-ResolvedInstallConfig {
  $cfg = Load-ConfigOverrides
  $resolved = @{
    runtimePath = (Resolve-Setting -Config $cfg -Key "runtimePath" -DefaultValue $RuntimePath)
    installMode = [string](Resolve-Setting -Config $cfg -Key "installMode" -DefaultValue $InstallMode)
    adminUsername = [string](Resolve-Setting -Config $cfg -Key "adminUsername" -DefaultValue $AdminUsername)
    adminPassword = [string](Resolve-Setting -Config $cfg -Key "adminPassword" -DefaultValue $AdminPassword)
    adminEmail = [string](Resolve-Setting -Config $cfg -Key "adminEmail" -DefaultValue $AdminEmail)
    superAdminUsername = [string](Resolve-Setting -Config $cfg -Key "superAdminUsername" -DefaultValue $SuperAdminUsername)
    superAdminPassword = [string](Resolve-Setting -Config $cfg -Key "superAdminPassword" -DefaultValue $SuperAdminPassword)
    superAdminEmail = [string](Resolve-Setting -Config $cfg -Key "superAdminEmail" -DefaultValue $SuperAdminEmail)
    useSamePasswordForBoth = [bool](Resolve-Setting -Config $cfg -Key "useSamePasswordForBoth" -DefaultValue $UseSamePasswordForBoth)
    verifyExistingAdminSession = [bool](Resolve-Setting -Config $cfg -Key "verifyExistingAdminSession" -DefaultValue $VerifyExistingAdminSession)
    repairAdminCredentialsOnFailure = [bool](Resolve-Setting -Config $cfg -Key "repairAdminCredentialsOnFailure" -DefaultValue $RepairAdminCredentialsOnFailure)
    verifyAdminUsername = [string](Resolve-Setting -Config $cfg -Key "verifyAdminUsername" -DefaultValue $VerifyAdminUsername)
    verifyAdminPassword = [string](Resolve-Setting -Config $cfg -Key "verifyAdminPassword" -DefaultValue $VerifyAdminPassword)
    instanceName = [string](Resolve-Setting -Config $cfg -Key "instanceName" -DefaultValue $InstanceName)
    localHost = [string](Resolve-Setting -Config $cfg -Key "localHost" -DefaultValue $LocalHost)
    timezone = [string](Resolve-Setting -Config $cfg -Key "timezone" -DefaultValue $Timezone)
    tlsProvider = [string](Resolve-Setting -Config $cfg -Key "tlsProvider" -DefaultValue $TlsProvider)
    customCertFullchainPath = [string](Resolve-Setting -Config $cfg -Key "customCertFullchainPath" -DefaultValue $CustomCertFullchainPath)
    customCertPrivkeyPath = [string](Resolve-Setting -Config $cfg -Key "customCertPrivkeyPath" -DefaultValue $CustomCertPrivkeyPath)
    backupFrequency = [string](Resolve-Setting -Config $cfg -Key "backupFrequency" -DefaultValue $BackupFrequency)
    backupDefaultDirectory = [string](Resolve-Setting -Config $cfg -Key "backupDefaultDirectory" -DefaultValue $BackupDefaultDirectory)
    backupScheduleTime = [string](Resolve-Setting -Config $cfg -Key "backupScheduleTime" -DefaultValue $BackupScheduleTime)
    backupRetentionDays = [int](Resolve-Setting -Config $cfg -Key "backupRetentionDays" -DefaultValue $BackupRetentionDays)
    postgresPassword = [string](Resolve-Setting -Config $cfg -Key "postgresPassword" -DefaultValue $PostgresPassword)
    redisPassword = [string](Resolve-Setting -Config $cfg -Key "redisPassword" -DefaultValue $RedisPassword)
    jwtSecret = [string](Resolve-Setting -Config $cfg -Key "jwtSecret" -DefaultValue $JwtSecret)
    httpPort = [int](Resolve-Setting -Config $cfg -Key "httpPort" -DefaultValue $HttpPort)
    httpsPort = [int](Resolve-Setting -Config $cfg -Key "httpsPort" -DefaultValue $HttpsPort)
  }
  Assert-InstallerPayloadEquivalent -Config $resolved
  return $resolved
}

function Invoke-CleanupWindowsResiduesForInstall {
  param([string]$Runtime)
  $scriptPath = Join-Path $Script:RepoRoot "ElectronInstaller\scripts\install\windows\ops\uninstall-clean.ps1"
  if (-not (Test-Path $scriptPath)) {
    Write-Log "No se encontro script de limpieza preventiva. Continuando..." "WARN"
    return
  }
  & powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath `
    -RuntimePath $Runtime `
    -InstallDir (Join-Path $Script:RepoRoot "ElectronInstaller") `
    -PreserveRuntime -SkipDockerCleanup -SkipShortcutsCleanup -SkipHostsCleanup -SkipRegistryCleanup | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Log "Limpieza preventiva devolvio codigo $LASTEXITCODE. Se continua (no bloqueante)." "WARN"
  }
}

function Ensure-WindowsFirewallRulesEquivalent {
  param([int]$PortA,[int]$PortB)
  $ports = @($PortA, $PortB) | Select-Object -Unique
  foreach ($p in $ports) {
    $ruleName = "SmartEconomat Local Port ($p)"
    & netsh advfirewall firewall delete rule name="$ruleName" protocol=TCP localport=$p | Out-Null
    & netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$p profile=domain,private | Out-Null
  }
  foreach ($p in $ports) {
    $ruleName = "SmartEconomat Local Port ($p)"
    $check = & powershell -NoProfile -Command "if (Get-NetFirewallRule -DisplayName '$ruleName' -ErrorAction SilentlyContinue) { 'OK' } else { 'MISSING' }"
    if (($check | Out-String).Trim() -ne "OK") {
      throw "No se pudo verificar regla firewall para puerto $p."
    }
  }
}

function Ensure-WindowsHostsMappingWithBackup {
  param([string]$ConfiguredHost,[string]$Runtime)
  $aliases = @("smarteconomat.app", $ConfiguredHost.Trim().ToLowerInvariant()) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
  if ($aliases.Count -eq 0) { throw "No hay aliases validos para hosts." }
  $hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
  $diag = Join-Path $Runtime "diagnostics"
  New-Item -Path $diag -ItemType Directory -Force | Out-Null
  $backup = Join-Path $diag ("hosts.backup.{0}.txt" -f [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
  Copy-Item -Path $hostsPath -Destination $backup -Force
  $Script:HostsBackupPath = $backup

  $content = Get-Content -Path $hostsPath -ErrorAction Stop
  $escaped = ($aliases | ForEach-Object { [regex]::Escape($_) }) -join "|"
  $filtered = @()
  foreach ($line in $content) {
    if ($line -match "(?i)(^|\s)($escaped)(\s|$)") { continue }
    $filtered += $line
  }
  $aliasesLine = ($aliases -join " ")
  $filtered += "127.0.0.1 $aliasesLine"
  $filtered += "::1 $aliasesLine"
  Set-Content -Path $hostsPath -Value $filtered -Encoding ascii
}

function Rollback-WindowsHostsIfNeeded {
  if ([string]::IsNullOrWhiteSpace($Script:HostsBackupPath)) { return }
  if (-not (Test-Path $Script:HostsBackupPath)) { return }
  $hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
  try {
    Copy-Item -Path $Script:HostsBackupPath -Destination $hostsPath -Force
    Write-Log "Rollback hosts aplicado desde $Script:HostsBackupPath"
  } catch {
    Write-Log "No se pudo rollback hosts: $($_.Exception.Message)" "WARN"
  }
}

function Test-ExistingInstallation {
  param([string]$Runtime)
  $envPath = Join-Path $Runtime ".env.prod"
  if (-not (Test-Path $envPath)) { return $false }
  $volumes = & docker volume ls --filter "name=smarteconomat" --format "{{.Name}}" 2>$null
  return -not [string]::IsNullOrWhiteSpace(($volumes | Out-String).Trim())
}

function Invoke-PreInstallBackupBestEffort {
  param([string]$Runtime,[string]$BackupDir,[string]$Mode)
  $label = "pre-$Mode-{0}" -f (Get-Date -Format "yyyy-MM-dd_HH-mm-ss")
  if ([string]::IsNullOrWhiteSpace($BackupDir)) { $BackupDir = Join-Path $Runtime "backups" }
  New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
  $archive = Join-Path $BackupDir "$label.zip"
  & powershell -NoProfile -Command "Compress-Archive -Path '$Runtime\diagnostics\*' -DestinationPath '$archive' -Force" | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Log "Backup preventivo no bloqueante fallo." "WARN" } else { Write-Log "Backup preventivo generado: $archive" }
}

function Get-ComposePsObjects {
  $args = @("compose","--project-directory",$Script:RepoRoot,"-f",$Script:ComposeFile,"--env-file",(Join-Path $RuntimePath ".env.prod"),"ps","--format","json")
  $raw = & docker @args
  if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar docker compose ps." }
  return (Convert-ComposePsJsonLines -Raw ($raw -join "`n"))
}

function Try-RecoverPostgresAuthMismatch {
  $logs = & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") logs backend --tail 250 2>&1
  $all = ($logs | Out-String)
  if ($all -notmatch "28P01|password authentication failed for user ""postgres""") {
    return $false
  }
  Write-Log "Detectado mismatch PostgreSQL 28P01, aplicando auto-reparacion..."
  & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") up -d db | Out-Null
  $cmd = 'set -eu; psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${POSTGRES_DB:-postgres}" -v newpass="$POSTGRES_PASSWORD" -c "ALTER USER ""$POSTGRES_USER"" WITH PASSWORD :''newpass'';"'
  & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") exec -T db sh -lc $cmd | Out-Null
  if ($LASTEXITCODE -ne 0) { return $false }
  & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") restart backend | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Test-StrictWindowsDomainValidation {
  param([string]$Host,[string]$Protocol,[int]$Port)
  if ($Protocol -eq "http") {
    Test-UrlReachable -Url ("http://{0}" -f $Host) -Retries 8 -DelaySeconds 2
    return
  }
  $target = "https://$Host"
  $hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
  $hostsLines = Get-Content -Path $hostsPath -ErrorAction Stop
  if (-not ($hostsLines | Where-Object { $_ -match "(?i)(^|\s)$([regex]::Escape($Host))(\s|$)" })) {
    throw "HOSTS_MISSING"
  }
  $resolved = [System.Net.Dns]::GetHostAddresses($Host)
  if (-not ($resolved | Where-Object { $_.ToString() -in @("127.0.0.1","::1") })) {
    throw "DNS_NOT_LOOPBACK"
  }
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $listener) { throw "PORT_NOT_LISTENING" }
  Invoke-WebRequest -UseBasicParsing -Uri $target -TimeoutSec 12 | Out-Null
}

function Invoke-RuntimeCommand {
  switch ($Command) {
    "runtime-start" { Invoke-Compose -ComposeArgs @("up","-d","--build","--force-recreate","--remove-orphans") -MaxAttempts 3 -DelaySeconds 4; return }
    "runtime-stop" { Invoke-Compose -ComposeArgs @("down") -MaxAttempts 2 -DelaySeconds 2; return }
    "runtime-restart" { Invoke-Compose -ComposeArgs @("restart") -MaxAttempts 2 -DelaySeconds 2; return }
    "runtime-health" { Assert-StackRunning -Retries 10 -DelaySeconds 2; return }
    "runtime-logs" { Invoke-Compose -ComposeArgs @("logs",$Service,"--tail",$Lines.ToString()) -MaxAttempts 1 -DelaySeconds 1; return }
    "runtime-prune" {
      & docker image prune -f | Out-Null
      if ($PruneLevel -eq "aggressive") { & docker system prune -f --volumes | Out-Null }
      return
    }
    "runtime-backup" {
      if ([string]::IsNullOrWhiteSpace($BackupLabel)) { $BackupLabel = "runtime-{0}" -f (Get-Date -Format "yyyy-MM-dd_HH-mm-ss") }
      $dir = if ([string]::IsNullOrWhiteSpace($BackupDefaultDirectory)) { Join-Path $RuntimePath "backups" } else { $BackupDefaultDirectory }
      New-Item -Path $dir -ItemType Directory -Force | Out-Null
      $archive = Join-Path $dir "$BackupLabel.zip"
      Compress-Archive -Path (Join-Path $RuntimePath "*") -DestinationPath $archive -Force
      Write-Log "Backup runtime generado: $archive"
      return
    }
    "runtime-restore" {
      Assert-PathExists -Path $RestoreArchive -Description "Archivo de restore"
      Expand-Archive -Path $RestoreArchive -DestinationPath $RuntimePath -Force
      Write-Log "Restore completado desde $RestoreArchive"
      return
    }
    "runtime-diagnostics" {
      $out = Join-Path $RuntimePath "diagnostics\runtime-diag-{0}.txt" -f (Get-Date -Format "yyyyMMdd-HHmmss")
      "=== docker compose ps ===" | Out-File -FilePath $out -Encoding utf8
      & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") ps | Add-Content -Path $out
      "=== docker compose logs backend (tail 200) ===" | Add-Content -Path $out
      & docker compose --project-directory $Script:RepoRoot -f $Script:ComposeFile --env-file (Join-Path $RuntimePath ".env.prod") logs backend --tail 200 | Add-Content -Path $out
      Write-Log "Diagnostico exportado: $out"
      return
    }
    "runtime-reinstall-cert" {
      Ensure-TlsChainArtifacts -CertsDir (Join-Path $RuntimePath "certs") -Domain $LocalHost
      return
    }
    default { throw "Comando runtime no soportado: $Command" }
  }
}

function Invoke-WizardEquivalentInstall {
  $resolved = Build-ResolvedInstallConfig
  $RuntimePath = $resolved.runtimePath
  $Script:DiagnosticsDir = Join-Path $RuntimePath "diagnostics"
  $Script:LogFile = Join-Path $Script:DiagnosticsDir ("setup-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  Initialize-Log

  Invoke-Step -Name "Cleanup Windows residues" -Action {
    Invoke-CleanupWindowsResiduesForInstall -Runtime $resolved.runtimePath
  }

  Set-InstallState -State "PREFLIGHT" -Message "Validando prerequisitos y estado Docker/WSL/puertos"
  Invoke-Step -Name "Preflight" -Action {
    Ensure-NodeArtifacts
    try {
      Invoke-PreflightEquivalent -Runtime $resolved.runtimePath -ThrowOnBlocker
    } catch {
      Write-Log "Preflight con bloqueantes reparables. Ejecutando auto-repair..." "WARN"
      Invoke-AutoRepairEquivalent -Runtime $resolved.runtimePath
    }
  }

  Set-InstallState -State "CONFIG_VALIDATION" -Message "Validando hosts/firewall y contrato de configuración"
  Invoke-Step -Name "Config validation" -Action {
    Ensure-WindowsHostsMappingWithBackup -ConfiguredHost $resolved.localHost -Runtime $resolved.runtimePath
    Ensure-WindowsFirewallRulesEquivalent -PortA $resolved.httpPort -PortB $resolved.httpsPort
  }

  if (Test-ExistingInstallation -Runtime $resolved.runtimePath) {
    Set-InstallState -State "PRE_INSTALL_BACKUP" -Message "Generando backup preventivo"
    Invoke-Step -Name "Pre-install backup non-blocking" -Action {
      Invoke-PreInstallBackupBestEffort -Runtime $resolved.runtimePath -BackupDir $resolved.backupDefaultDirectory -Mode $resolved.installMode
    }
  }

  Set-InstallState -State "ENV_RENDER" -Message "Generando .env.prod equivalente"
  $existingEnv = Parse-EnvFile -Path (Join-Path $resolved.runtimePath ".env.prod")
  Invoke-Step -Name "Render env" -Action {
    $Script:EnvMap = Build-InstallerEquivalentConfig -ExistingEnv $existingEnv
    $Script:EnvMap["INSTANCE_NAME"] = $resolved.instanceName
    $Script:EnvMap["DOMAIN"] = $resolved.localHost
    $Script:EnvMap["TLS_PROVIDER"] = $resolved.tlsProvider
    $Script:EnvMap["FRONTEND_HTTP_PORT"] = $resolved.httpPort.ToString()
    $Script:EnvMap["FRONTEND_HTTPS_PORT"] = $resolved.httpsPort.ToString()
    $Script:EnvMap["SEED_DEFAULT_ADMIN_USERNAME"] = $resolved.adminUsername
    $Script:EnvMap["SEED_DEFAULT_ADMIN_TEMP_PASSWORD"] = $resolved.adminPassword
    $Script:EnvMap["SEED_DEFAULT_SUPERADMIN_USERNAME"] = $resolved.superAdminUsername
    $Script:EnvMap["SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD"] = $(if ($resolved.useSamePasswordForBoth) { $resolved.adminPassword } else { $resolved.superAdminPassword })
    Write-EnvFileFromTemplate -TemplatePath $Script:EnvTemplate -OutputPath (Join-Path $resolved.runtimePath ".env.prod") -Values $Script:EnvMap
  }

  Set-InstallState -State "TLS_SETUP" -Message "Configurando TLS"
  Invoke-Step -Name "TLS setup" -Action {
    Configure-TlsArtifacts -EnvMap $Script:EnvMap
    Ensure-LocalTrustConfiguration -EnvMap $Script:EnvMap
  }

  Set-InstallState -State "DOCKER_DEPLOY" -Message "Levantando stack"
  Invoke-Step -Name "Docker deploy" -Action {
    Start-StackEquivalentInstaller
  }

  Set-InstallState -State "INITIALIZE_APP" -Message "Esperando inicialización"
  Invoke-Step -Name "Health init wait" -Action {
    Assert-StackRunning -Retries 15 -DelaySeconds 2
  }

  Set-InstallState -State "VERIFY" -Message "Verificaciones finales"
  Invoke-Step -Name "Verify reachability and strict domain" -Action {
    Assert-StackRunning -Retries 15 -DelaySeconds 2
    $repairedDb = Try-RecoverPostgresAuthMismatch
    if ($repairedDb) { Assert-StackRunning -Retries 8 -DelaySeconds 2 }
    Test-UrlReachable -Url ("https://$($resolved.localHost)") -Retries 15 -DelaySeconds 4
    $protocol = if ($resolved.tlsProvider -eq "none") { "http" } else { "https" }
    $strictPort = if ($protocol -eq "https") { $resolved.httpsPort } else { $resolved.httpPort }
    Test-StrictWindowsDomainValidation -Host $resolved.localHost -Protocol $protocol -Port $strictPort
  }

  Invoke-Step -Name "Bootstrap seeder" -Action {
    Run-AdminBootstrapSeeder
  }

  Set-InstallState -State "DONE" -Message "Instalación completada"
  Print-FinalSummary -EnvMap $Script:EnvMap
  if (-not $SkipOpenBrowser) {
    $scheme = if ($Script:EnvMap["TLS_PROVIDER"] -eq "none") { "http" } else { "https" }
    try { Start-Process -FilePath ("{0}://{1}" -f $scheme, $Script:EnvMap["DOMAIN"]) | Out-Null } catch { }
  }
}

function Ensure-TlsChainArtifacts {
  param(
    [string]$CertsDir = (Join-Path $RuntimePath "certs"),
    [string]$Domain = "smarteconomat.app"
  )

  # Si el CRT existe y es autofirmado (Issuer = Subject), eliminar todos los artefactos y regenerar
  $serverKey = Join-Path $CertsDir "$Domain.key"
  $serverCsr = Join-Path $CertsDir "$Domain.csr"
  $serverCrt = Join-Path $CertsDir "$Domain.crt"
  $fullchain = Join-Path $CertsDir "fullchain.pem"
  $openssl = Get-OpenSslCommand
  if (-not $openssl) { throw "OpenSSL no detectado" }
  $opensslExe = $openssl.Path
  if (Test-Path $serverCrt) {
    try {
      $crtInfo = & $opensslExe x509 -in $serverCrt -noout -issuer -subject 2>$null
      if ($crtInfo) {
        $issuer = ($crtInfo | Select-String 'issuer=').ToString().Replace('issuer=','').Trim()
        $subject = ($crtInfo | Select-String 'subject=').ToString().Replace('subject=','').Trim()
        if ($issuer -eq $subject) {
          Write-Log "Certificado autofirmado detectado. Eliminando artefactos TLS para regenerar correctamente firmado por CA." "WARN"
          Remove-Item -Path $serverKey,$serverCsr,$serverCrt,$fullchain -Force -ErrorAction SilentlyContinue
        }
      }
    } catch { }
  }
  $openssl = Get-OpenSslCommand
  if (-not $openssl) { throw "OpenSSL no detectado" }
  $opensslExe = $openssl.Path

  $rootCAKey = Join-Path $CertsDir "rootCA.key"
  $rootCAPem = Join-Path $CertsDir "rootCA.pem"
  $serverKey = Join-Path $CertsDir "$Domain.key"
  $serverCsr = Join-Path $CertsDir "$Domain.csr"
  $serverCrt = Join-Path $CertsDir "$Domain.crt"
  $fullchain = Join-Path $CertsDir "fullchain.pem"
  $sanCnf = Join-Path $CertsDir "san.cnf"

  if (-not (Test-Path $CertsDir)) { New-Item -Path $CertsDir -ItemType Directory -Force | Out-Null }

  # 1. CA raíz
  if (-not (Test-Path $rootCAKey) -or -not (Test-Path $rootCAPem)) {
    & $opensslExe genrsa -out $rootCAKey 4096 | Out-Null
    & $opensslExe req -x509 -new -nodes -key $rootCAKey -sha256 -days 1825 -out $rootCAPem -subj "/C=ES/O=SmartEconomat/CN=SmartEconomat Root CA" | Out-Null
  }


  # 2. Clave privada servidor (solo si no existe)
  if (-not (Test-Path $serverKey)) {
    & $opensslExe genrsa -out $serverKey 4096 | Out-Null
  }

  # 3. san.cnf
  Set-Content -Path $sanCnf -Value "[req]`ndistinguished_name=req`n[ v3_req ]`nsubjectAltName=DNS:$Domain" -Encoding ascii

  # 4. CSR servidor (solo si no existe o si la clave cambió)
  $needCsr = $true
  if (Test-Path $serverCsr -and Test-Path $serverKey) {
    $csrTime = (Get-Item $serverCsr).LastWriteTimeUtc
    $keyTime = (Get-Item $serverKey).LastWriteTimeUtc
    if ($csrTime -gt $keyTime) { $needCsr = $false }
  }
  if ($needCsr) {
    & $opensslExe req -new -key $serverKey -out $serverCsr -subj "/C=ES/O=SmartEconomat/CN=$Domain" -config $sanCnf | Out-Null
  }

  # 5. Firmar CSR con CA (si no existe o si CSR cambió)
  $needSign = $true
  if (Test-Path $serverCrt) {
    $crtTime = (Get-Item $serverCrt).LastWriteTimeUtc
    $csrTime = (Get-Item $serverCsr).LastWriteTimeUtc
    if ($crtTime -gt $csrTime) { $needSign = $false }
  }
  if ($needSign) {
    & $opensslExe x509 -req -in $serverCsr -CA $rootCAPem -CAkey $rootCAKey -CAcreateserial -out $serverCrt -days 825 -sha256 -extfile $sanCnf -extensions v3_req | Out-Null
  }

  # 5. fullchain.pem
  Copy-Item -Path $serverCrt -Destination $fullchain -Force
  Add-Content -Path $fullchain -Value (Get-Content -Path $rootCAPem -Raw)

  Write-Log "Certificados TLS generados y encadenados correctamente (CA raíz + servidor, firmado por CA)."

  # Automatizar reinstalación de la CA raíz en almacenes de confianza
  $rootCAPem = Join-Path $CertsDir "rootCA.pem"
  if (Test-Path $rootCAPem) {
    $pemContent = Get-Content -Path $rootCAPem -Raw -ErrorAction Stop
    $match = [regex]::Match(
      $pemContent,
      "-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----",
      [System.Text.RegularExpressions.RegexOptions]::Singleline
    )
    if ($match.Success) {
      $base64Body = ($match.Groups[1].Value -replace "\s", "").Trim()
      if (-not [string]::IsNullOrWhiteSpace($base64Body)) {
        $certBytes = [Convert]::FromBase64String($base64Body)
        $tempCerPath = Join-Path $env:TEMP ("smarteconomat-rootca-{0}.cer" -f [guid]::NewGuid().ToString("N"))
        [System.IO.File]::WriteAllBytes($tempCerPath, $certBytes)
        $subjectPattern = '*SmartEconomat Root CA*'
        $imported = $false
        # Intentar en CurrentUser\Root, con gestión robusta de errores
        try {
          Import-Certificate -FilePath $tempCerPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
          Write-Log "CA raíz importada en CurrentUser\Root."
          $imported = $true
        } catch {
          Write-Log "No se pudo importar CA en CurrentUser\Root: $($_.Exception.Message)" "WARN"
          Write-Log "Si ejecutas como admin y sigue fallando, prueba reiniciar PowerShell o revisa políticas de grupo (gpedit.msc) que puedan restringir la gestión de certificados de usuario." "WARN"
        }
        # Intentar en LocalMachine\Root si es admin
        if (-not $imported) {
          if (Test-IsAdmin) {
            try {
              Import-Certificate -FilePath $tempCerPath -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
              Write-Log "CA raíz importada en LocalMachine\Root."
              $imported = $true
            } catch {
              Write-Log "No se pudo importar CA en LocalMachine\Root: $($_.Exception.Message)" "ERROR"
            }
          } else {
            Write-Log "No hay permisos de administrador para importar CA en LocalMachine\Root. Ejecuta el script como admin para confiarla." "WARN"
          }
        }
        Remove-Item -Path $tempCerPath -Force -ErrorAction SilentlyContinue
      }
    }
  }
}
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Script:StartTime = Get-Date
$Script:RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:ComposeFile = Join-Path $Script:RepoRoot "ElectronInstaller\resources\compose\docker-compose.prod.yml"
$Script:EnvTemplate = Join-Path $Script:RepoRoot "ElectronInstaller\resources\templates\env.template.prod"
$Script:BootstrapScript = Join-Path $Script:RepoRoot "ElectronInstaller\scripts\install\windows\bootstrap.ps1"
$Script:DiagnosticsDir = Join-Path $RuntimePath "diagnostics"
$Script:LogFile = Join-Path $Script:DiagnosticsDir ("setup-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))

function Initialize-Log {
  if (-not (Test-Path $Script:DiagnosticsDir)) {
    New-Item -Path $Script:DiagnosticsDir -ItemType Directory -Force | Out-Null
  }

  "[INFO] Setup started at $(Get-Date -Format o)" | Out-File -FilePath $Script:LogFile -Encoding utf8
}

function Write-Log {
  param(
    [Parameter(Mandatory = $true)][string]$Message,
    [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")][string]$Level = "INFO"
  )

  if ($Level -eq "DEBUG" -and -not $VerboseMode) {
    return
  }

  $line = "[{0}] {1} {2}" -f $Level, (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Write-Host $line
  Add-Content -Path $Script:LogFile -Value $line
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  Write-Log "START -> $Name"
  try {
    & $Action
    Write-Log "DONE  -> $Name"
  }
  catch {
    Write-Log "FAIL  -> $Name :: $($_.Exception.Message)" "ERROR"
    throw
  }
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-DockerDesktopInstalled {
  $dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  return (Test-Path $dockerDesktopExe)
}

function Test-ElevationRequired {
  if ($ReleaseBusyPorts) {
    return $true
  }

  if (-not $SkipDockerInstall -and -not (Test-DockerDesktopInstalled)) {
    return $true
  }

  return $false
}

function Ensure-Elevation {
  if ($NoElevation) {
    Write-Log "NoElevation activo. Se omite auto-elevacion." "WARN"
    return
  }

  if (Test-IsAdmin) {
    return
  }

  if (-not (Test-ElevationRequired)) {
    Write-Log "No se requiere elevacion para esta ejecucion." "DEBUG"
    return
  }

  Write-Log "Se requiere elevacion para instalar Docker Desktop o liberar puertos. Se abrira una nueva consola como administrador." "WARN"

  $args = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", ('"{0}"' -f $PSCommandPath),
    "-RuntimePath", ('"{0}"' -f $RuntimePath)
  )

  if ($NonInteractive) { $args += "-NonInteractive" }
  if ($VerboseMode) { $args += "-VerboseMode" }
  if ($ReleaseBusyPorts) { $args += "-ReleaseBusyPorts" }
  if ($SkipDockerInstall) { $args += "-SkipDockerInstall" }
  if ($SkipBuildArtifacts) { $args += "-SkipBuildArtifacts" }
  if ($NoElevation) { $args += "-NoElevation" }

  $argLine = $args -join " "

  try {
    Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $argLine | Out-Null
  }
  catch {
    throw "No se pudo relanzar el script como administrador. Acepta el UAC o ejecuta PowerShell como admin manualmente."
  }

  exit 0
}

function Read-InputWithDefault {
  param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [AllowEmptyString()][string]$Default = ""
  )

  if ($NonInteractive) {
    return $Default
  }

  $raw = Read-Host "$Prompt [$Default]"
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $Default
  }

  return $raw.Trim()
}

function Read-PasswordWithDefault {
  param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [AllowEmptyString()][string]$Default = ""
  )

  if ($NonInteractive) {
    return $Default
  }

  Write-Host "$Prompt [ENTER para usar valor por defecto oculto]" -ForegroundColor Cyan
  $secure = Read-Host -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }

  if ([string]::IsNullOrWhiteSpace($plain)) {
    return $Default
  }

  return $plain
}

function New-RandomSecret {
  param([int]$Length = 48)

  $alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $chars = for ($i = 0; $i -lt $Length; $i++) {
    $alphabet[$bytes[$i] % $alphabet.Length]
  }
  return -join $chars
}

function Parse-EnvFile {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path $Path)) {
    return $map
  }

  Get-Content -Path $Path | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_)) { return }
    if ($_.TrimStart().StartsWith("#")) { return }
    $parts = $_ -split "=", 2
    if ($parts.Count -eq 2) {
      $map[$parts[0]] = $parts[1]
    }
  }

  return $map
}

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Env,
    [Parameter(Mandatory = $true)][string]$Key,
    [AllowEmptyString()][string]$Default = ""
  )

  if ($Env.ContainsKey($Key)) {
    return [string]$Env[$Key]
  }

  return $Default
}

function Assert-PathExists {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Description
  )

  if (-not (Test-Path $Path)) {
    throw "$Description no encontrado: $Path"
  }
}

function Ensure-HostsMapping {
  param([Parameter(Mandatory = $true)][string]$Domain)

  if ([string]::IsNullOrWhiteSpace($Domain)) {
    return
  }

  $normalizedDomain = $Domain.Trim().ToLowerInvariant()
  if ($normalizedDomain -eq "localhost") {
    return
  }

  $hostsPath = Join-Path $env:WINDIR "System32\drivers\etc\hosts"
  $currentContent = @()
  if (Test-Path $hostsPath) {
    $currentContent = Get-Content -Path $hostsPath -ErrorAction SilentlyContinue
  }

  $ipv4Pattern = "^\s*127\.0\.0\.1\s+{0}(\s+|$)" -f [regex]::Escape($normalizedDomain)
  $ipv6Pattern = "^\s*::1\s+{0}(\s+|$)" -f [regex]::Escape($normalizedDomain)
  $hasIpv4 = $currentContent | Where-Object { $_ -match $ipv4Pattern } | Select-Object -First 1
  $hasIpv6 = $currentContent | Where-Object { $_ -match $ipv6Pattern } | Select-Object -First 1

  if ($hasIpv4 -and $hasIpv6) {
    Write-Log "Hosts ya contiene el dominio $normalizedDomain."
    return
  }

  if (-not (Test-IsAdmin)) {
    Write-Log "No hay permisos de administrador para modificar hosts. Ejecuta el script como admin para mapear $normalizedDomain." "WARN"
    return
  }

  if (-not $hasIpv4) {
    Add-Content -Path $hostsPath -Value ("127.0.0.1 {0}" -f $normalizedDomain)
  }

  if (-not $hasIpv6) {
    Add-Content -Path $hostsPath -Value ("::1 {0}" -f $normalizedDomain)
  }

  Write-Log "Hosts actualizado para $normalizedDomain (127.0.0.1 y ::1)."
}

function Ensure-CertificateTrusted {
  param([Parameter(Mandatory = $true)][string]$CertificatePemPath)

  if (-not (Test-Path $CertificatePemPath)) {
    Write-Log "No se encontro certificado para confianza local: $CertificatePemPath" "WARN"
    return
  }

  $pemContent = Get-Content -Path $CertificatePemPath -Raw -ErrorAction Stop
  $match = [regex]::Match(
    $pemContent,
    "-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if (-not $match.Success) {
    Write-Log "No se pudo extraer un certificado valido desde $CertificatePemPath" "WARN"
    return
  }

  $base64Body = ($match.Groups[1].Value -replace "\s", "").Trim()
  if ([string]::IsNullOrWhiteSpace($base64Body)) {
    Write-Log "El bloque PEM de $CertificatePemPath esta vacio." "WARN"
    return
  }

  $certBytes = [Convert]::FromBase64String($base64Body)
  $tempCerPath = Join-Path $env:TEMP ("smarteconomat-cert-{0}.cer" -f [guid]::NewGuid().ToString("N"))
  [System.IO.File]::WriteAllBytes($tempCerPath, $certBytes)

  $subjectPattern = '*smarteconomat*'
  $imported = $false

  # 1. Intentar en CurrentUser\Root (no requiere admin)
  try {
    Import-Certificate -FilePath $tempCerPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
    Write-Log "Certificado TLS importado en CurrentUser\Root."
    $imported = $true
  } catch {
    Write-Log "No se pudo importar en CurrentUser\Root: $($_.Exception.Message)" "WARN"
  }

  # 2. Si falla, intentar en LocalMachine\Root (requiere admin)
  if (-not $imported) {
    if (Test-IsAdmin) {
      try {
        Import-Certificate -FilePath $tempCerPath -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
        Write-Log "Certificado TLS importado en LocalMachine\Root."
        $imported = $true
      } catch {
        Write-Log "No se pudo importar en LocalMachine\Root: $($_.Exception.Message)" "ERROR"
      }
    } else {
      Write-Log "No hay permisos de administrador para importar certificado en LocalMachine\Root. Ejecuta el script como admin para confiarlo." "WARN"
    }
  }

  Remove-Item -Path $tempCerPath -Force -ErrorAction SilentlyContinue
}

function Ensure-LocalTrustConfiguration {
  param([Parameter(Mandatory = $true)][hashtable]$EnvMap)

  $domain = [string]$EnvMap["DOMAIN"]
  Ensure-HostsMapping -Domain $domain

  $tlsProvider = [string]$EnvMap["TLS_PROVIDER"]
  if ($tlsProvider -eq "none") {
    Write-Log "TLS=none. Se omite confianza de certificado local."
    return
  }

  $fullchainPath = Join-Path $RuntimePath "certs\fullchain.pem"
  Ensure-CertificateTrusted -CertificatePemPath $fullchainPath
}

function Ensure-DockerDesktopInstalled {
  $dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktopExe) {
    Write-Log "Docker Desktop detectado en $dockerDesktopExe"
    return
  }

  if ($SkipDockerInstall) {
    throw "Docker Desktop no esta instalado y SkipDockerInstall esta activo."
  }

  Write-Log "Docker Desktop no detectado. Descargando instalador oficial..." "WARN"
  $installerDir = Join-Path $RuntimePath "downloads"
  $installerPath = Join-Path $installerDir "DockerDesktopInstaller.exe"
  New-Item -Path $installerDir -ItemType Directory -Force | Out-Null

  $url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
  Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing

  Write-Log "Ejecutando instalacion silenciosa de Docker Desktop..."
  $installProc = Start-Process -FilePath $installerPath -ArgumentList "install --quiet --accept-license" -PassThru -Wait
  if ($installProc.ExitCode -ne 0) {
    throw "Instalacion de Docker Desktop fallo con codigo $($installProc.ExitCode)."
  }

  if (-not (Test-Path $dockerDesktopExe)) {
    throw "Docker Desktop no aparece instalado tras la ejecucion silenciosa."
  }
}

function Get-OpenSslCommand {
  $cmd = Get-Command openssl -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd
  }

  $knownPaths = @(
    "C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe",
    "C:\\Program Files\\OpenSSL-Win32\\bin\\openssl.exe"
  )

  foreach ($path in $knownPaths) {
    if (Test-Path $path) {
      return @{ Path = $path }
    }
  }

  return $null
}

function Add-PathToSession {
  param([Parameter(Mandatory = $true)][string]$PathToAdd)

  if ([string]::IsNullOrWhiteSpace($PathToAdd)) {
    return
  }

  if (-not (Test-Path $PathToAdd)) {
    return
  }

  $segments = ($env:Path -split ';') | ForEach-Object { $_.Trim() }
  if ($segments -contains $PathToAdd) {
    return
  }

  $env:Path = "$PathToAdd;$env:Path"
}

function Ensure-OpenSslAvailable {
  $openssl = Get-OpenSslCommand
  if ($openssl) {
    Add-PathToSession -PathToAdd (Split-Path -Parent $openssl.Path)
    Write-Log "OpenSSL detectado en $($openssl.Path)"
    return
  }

  Write-Log "OpenSSL no detectado. Intentando instalacion automatica..." "WARN"

  $installed = $false
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Log "Instalando OpenSSL con winget (ShiningLight.OpenSSL.Light)..."
    & $winget.Path install --id ShiningLight.OpenSSL.Light --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) {
      $installed = $true
    }
    else {
      Write-Log "winget no pudo instalar OpenSSL (exit=$LASTEXITCODE)." "WARN"
    }
  }

  if (-not $installed) {
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if ($choco) {
      Write-Log "Instalando OpenSSL con choco..."
      & $choco.Path install openssl -y
      if ($LASTEXITCODE -eq 0) {
        $installed = $true
      }
      else {
        Write-Log "choco no pudo instalar OpenSSL (exit=$LASTEXITCODE)." "WARN"
      }
    }
  }

  $openssl = Get-OpenSslCommand
  if (-not $openssl) {
    throw "OpenSSL es requerido para TLS self-signed y no se pudo instalar automaticamente. Instala OpenSSL y reintenta."
  }

  Add-PathToSession -PathToAdd (Split-Path -Parent $openssl.Path)
  Write-Log "OpenSSL instalado/detectado en $($openssl.Path)"
}

function Start-DockerDesktop {
  $dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  Assert-PathExists -Path $dockerDesktopExe -Description "Docker Desktop"

  Write-Log "Iniciando Docker Desktop..."
  Start-Process -FilePath $dockerDesktopExe | Out-Null
}

function Wait-DockerDaemonReady {
  param(
    [int]$MaxAttempts = 30,
    [int]$InitialDelaySeconds = 2
  )

  $delay = $InitialDelaySeconds
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      $null = docker info 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Log "Docker daemon operativo (intento $attempt/$MaxAttempts)."
        return
      }
    }
    catch {
      # continue retries
    }

    Write-Log "Docker aun no responde (intento $attempt/$MaxAttempts). Esperando $delay s..." "WARN"
    Start-Sleep -Seconds $delay
    $delay = [Math]::Min($delay * 2, 10)
  }

  throw "Docker daemon no quedo operativo en el tiempo esperado."
}

function Ensure-NodeArtifacts {
  if ($SkipBuildArtifacts) {
    Write-Log "SkipBuildArtifacts activo. Se omite build de artefactos." "WARN"
    return
  }

  $backendDir = Join-Path $Script:RepoRoot "backend\smart-economat-backend"
  $frontendDir = Join-Path $Script:RepoRoot "frontend\smart-economat-frontend"

  Assert-PathExists -Path $backendDir -Description "Directorio backend"
  Assert-PathExists -Path $frontendDir -Description "Directorio frontend"

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js no esta instalado en PATH y es necesario para generar dist/build."
  }

  $backendDistMain = Join-Path $backendDir "dist\main.js"
  if (-not (Test-Path $backendDistMain)) {
    Write-Log "dist backend ausente. Ejecutando npm ci + npm run build..." "WARN"
    Push-Location $backendDir
    try {
      if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
        & npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci backend fallo." }
      }
      & npm run build
      if ($LASTEXITCODE -ne 0) { throw "npm run build backend fallo." }
    }
    finally {
      Pop-Location
    }
  }

  $frontendBuildIndex = Join-Path $frontendDir "build\index.html"
  if (-not (Test-Path $frontendBuildIndex)) {
    Write-Log "build frontend ausente. Ejecutando npm ci + npm run build..." "WARN"
    Push-Location $frontendDir
    try {
      if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        & npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci frontend fallo." }
      }
      & npm run build
      if ($LASTEXITCODE -ne 0) { throw "npm run build frontend fallo." }
    }
    finally {
      Pop-Location
    }
  }
}

function Build-InstallerEquivalentConfig {
  param([hashtable]$ExistingEnv)

  $defaultInstance = Get-EnvValue -Env $ExistingEnv -Key "INSTANCE_NAME" -Default "smarteconomat-local"
  $defaultHost = Get-EnvValue -Env $ExistingEnv -Key "DOMAIN" -Default "smarteconomat.app"
  $defaultTimezone = Get-EnvValue -Env $ExistingEnv -Key "TIMEZONE" -Default "Europe/Madrid"
  $defaultTlsProvider = Get-EnvValue -Env $ExistingEnv -Key "TLS_PROVIDER" -Default "selfsigned"
  $defaultHttpPort = Get-EnvValue -Env $ExistingEnv -Key "FRONTEND_HTTP_PORT" -Default "80"
  $defaultHttpsPort = Get-EnvValue -Env $ExistingEnv -Key "FRONTEND_HTTPS_PORT" -Default "443"
  $defaultBackupFreq = Get-EnvValue -Env $ExistingEnv -Key "BACKUP_FREQUENCY" -Default "daily"
  $defaultBackupRetention = Get-EnvValue -Env $ExistingEnv -Key "BACKUP_RETENTION_DAYS" -Default "30"

  $adminUsername = Read-InputWithDefault -Prompt "Usuario admin" -Default (Get-EnvValue -Env $ExistingEnv -Key "SEED_DEFAULT_ADMIN_USERNAME" -Default "admin")
  $superAdminUsername = Read-InputWithDefault -Prompt "Usuario superadmin" -Default (Get-EnvValue -Env $ExistingEnv -Key "SEED_DEFAULT_SUPERADMIN_USERNAME" -Default "superadmin")

  $defaultAdminPassword = Get-EnvValue -Env $ExistingEnv -Key "SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD" -Default "SmartEconomat2026!"
  $adminPassword = Read-PasswordWithDefault -Prompt "Contrasena admin" -Default $defaultAdminPassword

  $samePasswordAnswer = Read-InputWithDefault -Prompt "Usar misma contrasena para superadmin? (true/false)" -Default (Get-EnvValue -Env $ExistingEnv -Key "SEED_DEFAULT_USERS_SYNCED" -Default "true")
  $useSamePassword = $samePasswordAnswer.ToLowerInvariant() -eq "true"

  $superAdminPassword = if ($useSamePassword) {
    $adminPassword
  }
  else {
    Read-PasswordWithDefault -Prompt "Contrasena superadmin" -Default (Get-EnvValue -Env $ExistingEnv -Key "SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD" -Default "SmartEconomat2026!")
  }

  if ($adminUsername.Trim().ToLowerInvariant() -eq $superAdminUsername.Trim().ToLowerInvariant()) {
    throw "Admin y superadmin deben tener usernames diferentes."
  }

  $instanceName = Read-InputWithDefault -Prompt "Nombre de instancia" -Default $defaultInstance
  $publicHost = Read-InputWithDefault -Prompt "Host publico" -Default $defaultHost
  $timezone = Read-InputWithDefault -Prompt "Timezone" -Default $defaultTimezone
  $tlsProvider = (Read-InputWithDefault -Prompt "TLS provider (selfsigned|none|custom)" -Default $defaultTlsProvider).ToLowerInvariant()
  $httpPort = [int](Read-InputWithDefault -Prompt "Puerto HTTP" -Default $defaultHttpPort)
  $httpsPort = [int](Read-InputWithDefault -Prompt "Puerto HTTPS" -Default $defaultHttpsPort)
  $backupFrequency = (Read-InputWithDefault -Prompt "Frecuencia backup (off|daily|weekly)" -Default $defaultBackupFreq).ToLowerInvariant()
  $backupRetentionDays = [int](Read-InputWithDefault -Prompt "Retencion de backups en dias" -Default $defaultBackupRetention)

  if ($httpPort -eq $httpsPort) {
    throw "HTTP y HTTPS no pueden usar el mismo puerto."
  }

  $customFullchain = ""
  $customPrivkey = ""
  if ($tlsProvider -eq "custom") {
    $customFullchain = Read-InputWithDefault -Prompt "Ruta fullchain.pem" -Default (Get-EnvValue -Env $ExistingEnv -Key "TLS_CUSTOM_FULLCHAIN_PATH" -Default "")
    $customPrivkey = Read-InputWithDefault -Prompt "Ruta privkey.pem" -Default (Get-EnvValue -Env $ExistingEnv -Key "TLS_CUSTOM_PRIVKEY_PATH" -Default "")
    Assert-PathExists -Path $customFullchain -Description "Certificado fullchain personalizado"
    Assert-PathExists -Path $customPrivkey -Description "Clave privada personalizada"
  }

  $postgresPassword = Get-EnvValue -Env $ExistingEnv -Key "POSTGRES_PASSWORD" -Default (New-RandomSecret -Length 32)
  $redisPassword = Get-EnvValue -Env $ExistingEnv -Key "REDIS_PASSWORD" -Default (New-RandomSecret -Length 32)
  $jwtSecret = Get-EnvValue -Env $ExistingEnv -Key "JWT_SECRET" -Default (New-RandomSecret -Length 48)

  if ($tlsProvider -eq "none") {
    $effectiveHost = "localhost"
    $protocol = "http"
  }
  else {
    $effectiveHost = $publicHost
    $protocol = "https"
  }

  $envFilePath = (Join-Path $RuntimePath ".env.prod").Replace("\", "/")

  return @{
    NODE_ENV = "production"
    DOMAIN = $effectiveHost
    SMARTECONOMAT_ENV_FILE = $envFilePath
    POSTGRES_USER = "postgres"
    POSTGRES_PASSWORD = $postgresPassword
    POSTGRES_DB = "smarteconomat"
    POSTGRES_PORT = "5432"
    DB_HOST = "db"
    DB_SYNC = "false"
    JWT_SECRET = $jwtSecret
    JWT_EXPIRATION = "7d"
    SEED_DEFAULT_ADMIN_TEMP_PASSWORD = $adminPassword
    SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD = $adminPassword
    SEED_DEFAULT_ADMIN_USERNAME = $adminUsername
    SEED_DEFAULT_SUPERADMIN_USERNAME = $superAdminUsername
    SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD = $superAdminPassword
    SEED_DEFAULT_USERS_SYNCED = $useSamePassword.ToString().ToLowerInvariant()
    REDIS_PASSWORD = $redisPassword
    INSTANCE_NAME = $instanceName
    ADMIN_USERNAME = $adminUsername
    TIMEZONE = $timezone
    TLS_PROVIDER = $tlsProvider
    TLS_CUSTOM_FULLCHAIN_PATH = $customFullchain
    TLS_CUSTOM_PRIVKEY_PATH = $customPrivkey
    BACKUP_FREQUENCY = $backupFrequency
    BACKUP_RETENTION_DAYS = $backupRetentionDays.ToString()
    CERTS_DIR = (Join-Path $RuntimePath "certs")
    CERTS_WEBROOT_DIR = (Join-Path $RuntimePath "certs-webroot")
    STARTUP_RUN_MIGRATIONS = "true"
    SENTRY_DSN = Get-EnvValue -Env $ExistingEnv -Key "SENTRY_DSN" -Default ""
    VITE_SENTRY_DSN = Get-EnvValue -Env $ExistingEnv -Key "VITE_SENTRY_DSN" -Default ""
    FRONTEND_HTTP_PORT = $httpPort.ToString()
    FRONTEND_HTTPS_PORT = $httpsPort.ToString()
  }
}

function Write-EnvFileFromTemplate {
  param(
    [Parameter(Mandatory = $true)][string]$TemplatePath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][hashtable]$Values
  )

  Assert-PathExists -Path $TemplatePath -Description "Template env"
  $content = Get-Content -Path $TemplatePath -Raw

  foreach ($key in $Values.Keys) {
    $content = $content.Replace("{{$key}}", [string]$Values[$key])
  }

  Set-Content -Path $OutputPath -Value $content -Encoding utf8
}

function Configure-TlsArtifacts {
  param([hashtable]$EnvMap)

  $tlsProvider = $EnvMap["TLS_PROVIDER"]
  $certsDir = Join-Path $RuntimePath "certs"
  $liveCustom = Join-Path $certsDir "live\custom"

  if ($tlsProvider -eq "none") {
    Write-Log "TLS desactivado. Eliminando certificados previos si existen."
    if (Test-Path $certsDir) {
      Remove-Item -Path $certsDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    return
  }

  if ($tlsProvider -eq "custom") {
    New-Item -Path $liveCustom -ItemType Directory -Force | Out-Null
    Copy-Item -Path $EnvMap["TLS_CUSTOM_FULLCHAIN_PATH"] -Destination (Join-Path $liveCustom "fullchain.pem") -Force
    Copy-Item -Path $EnvMap["TLS_CUSTOM_PRIVKEY_PATH"] -Destination (Join-Path $liveCustom "privkey.pem") -Force
    Copy-Item -Path (Join-Path $liveCustom "fullchain.pem") -Destination (Join-Path $certsDir "fullchain.pem") -Force
    Copy-Item -Path (Join-Path $liveCustom "privkey.pem") -Destination (Join-Path $certsDir "privkey.pem") -Force
    return
  }

  Ensure-OpenSslAvailable

  $args = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", ('"{0}"' -f $Script:BootstrapScript),
    "-RuntimePath", ('"{0}"' -f $RuntimePath),
    "-Mode", "tls",
    "-Domain", ('"{0}"' -f $EnvMap["DOMAIN"])
  )

  $argLine = $args -join " "
  Write-Log "Ejecutando bootstrap de Windows equivalente al instalador: $argLine"
  $bootstrapStdout = Join-Path $Script:DiagnosticsDir "bootstrap-stdout.log"
  $bootstrapStderr = Join-Path $Script:DiagnosticsDir "bootstrap-stderr.log"
  $proc = Start-Process -FilePath "powershell.exe" -ArgumentList $argLine -Wait -PassThru -RedirectStandardOutput $bootstrapStdout -RedirectStandardError $bootstrapStderr
  if ($proc.ExitCode -ne 0) {
    if ($proc.ExitCode -eq -1073741510) {
      throw "bootstrap.ps1 fue interrumpido o cancelado (codigo -1073741510). Revisa la ventana del proceso hijo y vuelve a ejecutar."
    }

    $stderrTail = ""
    if (Test-Path $bootstrapStderr) {
      $stderrTail = ((Get-Content -Path $bootstrapStderr -ErrorAction SilentlyContinue | Select-Object -Last 8) -join " | ")
    }

    $detail = if ([string]::IsNullOrWhiteSpace($stderrTail)) { "Sin detalle en stderr." } else { $stderrTail }
    throw "bootstrap.ps1 fallo con codigo $($proc.ExitCode). Detalle: $detail"
  }
}

function Invoke-Compose {
  param(
    [Parameter(Mandatory = $true)][string[]]$ComposeArgs,
    [int]$MaxAttempts = 1,
    [int]$DelaySeconds = 3
  )

  $allArgs = @(
    "compose",
    "--project-directory", $Script:RepoRoot,
    "-f", $Script:ComposeFile,
    "--env-file", (Join-Path $RuntimePath ".env.prod")
  ) + $ComposeArgs

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    Write-Log "docker $($allArgs -join ' ') (intento $attempt/$MaxAttempts)" "DEBUG"
    & docker @allArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
      return
    }

    if ($attempt -lt $MaxAttempts) {
      Write-Log "docker compose fallo (codigo $exitCode). Reintentando en $DelaySeconds s..." "WARN"
      Start-Sleep -Seconds $DelaySeconds
    }
    else {
      throw "docker compose fallo tras $MaxAttempts intentos (codigo $exitCode)."
    }
  }
}

function Start-StackEquivalentInstaller {
  # down previo no bloquea (igual que startStack() del instalador Electron)
  try {
    Invoke-Compose -ComposeArgs @("down", "--remove-orphans") -MaxAttempts 1 -DelaySeconds 2
  }
  catch {
    Write-Log "No se pudo hacer down previo del stack; se intentara continuar con recreate forzado." "WARN"
  }
  Invoke-Compose -ComposeArgs @("up", "-d", "--build", "--force-recreate", "--remove-orphans") -MaxAttempts 3 -DelaySeconds 5
}

function Run-AdminBootstrapSeeder {
  Invoke-Compose -ComposeArgs @("exec", "-T", "backend", "node", "scripts/bootstrap-admin-users-runner.js", "--force-production") -MaxAttempts 3 -DelaySeconds 4
}

function Convert-ComposePsJsonLines {
  param([string]$Raw)

  $items = @()
  foreach ($line in ($Raw -split "`r?`n")) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0) { continue }
    try {
      $items += ($trimmed | ConvertFrom-Json)
    }
    catch {
      Write-Log "Linea no JSON en compose ps: $trimmed" "DEBUG"
    }
  }
  return $items
}

function Assert-StackRunning {
  param(
    [int]$Retries = 15,
    [int]$DelaySeconds = 2
  )

  $args = @(
    "compose",
    "--project-directory", $Script:RepoRoot,
    "-f", $Script:ComposeFile,
    "--env-file", (Join-Path $RuntimePath ".env.prod"),
    "ps",
    "--format", "json"
  )

  $required = @("db", "redis", "backend", "frontend")

  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    $raw = & docker @args
    if ($LASTEXITCODE -ne 0) {
      if ($attempt -eq $Retries) { throw "No se pudo consultar docker compose ps." }
      Start-Sleep -Seconds $DelaySeconds
      continue
    }

    $services = Convert-ComposePsJsonLines -Raw ($raw -join "`n")
    if ($services.Count -eq 0) {
      if ($attempt -eq $Retries) { throw "No se detectaron servicios en docker compose ps." }
      Start-Sleep -Seconds $DelaySeconds
      continue
    }

    $allRunning = $true
    $lastError = ""
    foreach ($name in $required) {
      $service = $services | Where-Object { $_.Service -eq $name } | Select-Object -First 1
      if (-not $service) {
        $allRunning = $false
        $lastError = "Servicio requerido no encontrado en compose ps: $name"
        break
      }

      $state = [string]$service.State
      # Aceptamos running (y opcionalmente starting si usa healthchecks a nivel de compose ps)
      if ($state -notmatch "running") {
        $allRunning = $false
        $lastError = "Servicio $name no esta running (state=$state)."
        break
      }
    }

    if ($allRunning) {
      return
    }

    Write-Log "Contenedores estabilizandose (intento $attempt/$Retries): $lastError Esperando..." "DEBUG"
    if ($attempt -lt $Retries) {
      Start-Sleep -Seconds $DelaySeconds
    } else {
      throw $lastError
    }
  }
}

function Invoke-WebRequestSkipTls {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [int]$TimeoutSec = 12
  )

  # PowerShell 6+ tiene -SkipCertificateCheck nativo
  $psCore = $PSVersionTable.PSVersion.Major -ge 6
  if ($psCore) {
    return Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing -SkipCertificateCheck
  }

  # Windows PowerShell 5.x: bypass via ServicePointManager (solo funciona la primera vez)
  try {
    if ([System.Net.ServicePointManager]::ServerCertificateValidationCallback -eq $null) {
      [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    }
  }
  catch { }

  try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
  }
  catch { }

  return Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing
}

function Test-TcpPortOpen {
  param(
    [Parameter(Mandatory = $true)][string]$ComputerName,
    [Parameter(Mandatory = $true)][int]$Port
  )

  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connect = $tcp.BeginConnect($ComputerName, $Port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(3000, $false)
    if ($wait -and -not $tcp.Client.Connected) {
      $wait = $false
    }
    $tcp.Close()
    return $wait
  }
  catch {
    return $false
  }
}

function Test-UrlReachable {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Retries = 12,
    [int]$DelaySeconds = 3
  )

  $uri = [System.Uri]$Url
  $uriHost = $uri.Host
  $port = if ($uri.Port -gt 0) { $uri.Port } elseif ($uri.Scheme -eq "https") { 443 } else { 80 }

  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    # Primero verificar que el puerto TCP este abierto (no depende de TLS/certs)
    if (Test-TcpPortOpen -ComputerName $uriHost -Port $port) {
      # Puerto abierto: intentar HTTP para obtener status code
      try {
        $response = Invoke-WebRequestSkipTls -Uri $Url -TimeoutSec 10
        Write-Log "URL accesible: $Url (status=$($response.StatusCode), intento $attempt/$Retries)"
        return
      }
      catch {
        $msg = $_.Exception.Message
        # Si la respuesta tiene status code (4xx/5xx) el servicio responde -> OK funcional
        $statusMatch = $msg | Select-String "(\d{3})"
        if ($statusMatch) {
          Write-Log "URL accesible con codigo HTTP (intento $attempt/$Retries): $Url"
          return
        }
        # Cert self-signed o name mismatch -> puerto abierto y nginx responde -> OK
        if ($msg -match "certificate|SSL|TLS|trust|HSTS|CERT") {
          Write-Log "URL accesible (cert self-signed/HSTS, intento $attempt/$Retries): $Url"
          return
        }
        Write-Log "Puerto $port abierto pero HTTP fallo (intento $attempt/$Retries): $msg" "DEBUG"
        return
      }
    }

        Write-Log "Puerto $port en $uriHost aun no responde (intento $attempt/$Retries). Esperando $DelaySeconds s..." "WARN"
    Start-Sleep -Seconds $DelaySeconds
  }

  throw "No se pudo validar accesibilidad de $Url (puerto $port en $uriHost no responde tras $Retries intentos)"
}

function Get-MaskedValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) { return "" }
  if ($Value.Length -le 4) { return "****" }
  return ($Value.Substring(0,2) + "****" + $Value.Substring($Value.Length - 2, 2))
}

function Print-FinalSummary {
  param([hashtable]$EnvMap)

  $elapsed = (Get-Date) - $Script:StartTime
  Write-Log "================================================================"
  Write-Log "Setup completado."
  Write-Log "RuntimePath: $RuntimePath"
  Write-Log "Env file: $(Join-Path $RuntimePath '.env.prod')"
  Write-Log "Compose file: $Script:ComposeFile"
  Write-Log "Host: $($EnvMap['DOMAIN'])"
  $summaryScheme = if ($EnvMap["TLS_PROVIDER"] -eq "none") { "http" } else { "https" }
  Write-Log "Frontend URL: $summaryScheme://$($EnvMap['DOMAIN'])"
  Write-Log "Backend URL: $summaryScheme://$($EnvMap['DOMAIN'])/api/v1"
  Write-Log "Admin user: $($EnvMap['SEED_DEFAULT_ADMIN_USERNAME'])"
  Write-Log "Superadmin user: $($EnvMap['SEED_DEFAULT_SUPERADMIN_USERNAME'])"
  Write-Log "Postgres password: $(Get-MaskedValue -Value $EnvMap['POSTGRES_PASSWORD'])"
  Write-Log "Redis password: $(Get-MaskedValue -Value $EnvMap['REDIS_PASSWORD'])"
  Write-Log "Log: $Script:LogFile"
  Write-Log "Duracion: $([Math]::Round($elapsed.TotalMinutes,2)) minutos"
  Write-Log "================================================================"
}

try {
  Assert-PathExists -Path $Script:ComposeFile -Description "Compose prod"
  Assert-PathExists -Path $Script:EnvTemplate -Description "Template de entorno"
  Assert-PathExists -Path $Script:BootstrapScript -Description "Bootstrap Windows"
  New-Item -Path $RuntimePath -ItemType Directory -Force | Out-Null

  if ($Command -eq "install" -or $Command -eq "preflight" -or $Command -eq "auto-repair" -or $Command -eq "release-port") {
    Ensure-Elevation
  }

  switch ($Command) {
    "install" {
      Invoke-WizardEquivalentInstall
    }
    "preflight" {
      Initialize-Log
      Invoke-Step -Name "Preflight equivalente" -Action {
        Ensure-NodeArtifacts
        Invoke-PreflightEquivalent -Runtime $RuntimePath -ThrowOnBlocker
      }
    }
    "auto-repair" {
      Initialize-Log
      Invoke-Step -Name "Auto-repair equivalente" -Action {
        Invoke-AutoRepairEquivalent -Runtime $RuntimePath
      }
    }
    "release-port" {
      if ($Port -le 0) { throw "Debes indicar -Port para release-port." }
      Initialize-Log
      Invoke-Step -Name "Release busy port" -Action {
        Invoke-ReleasePortEquivalent -PortNumber $Port -Strict
      }
    }
    default {
      Initialize-Log
      Invoke-Step -Name "Runtime command" -Action {
        Invoke-RuntimeCommand
      }
    }
  }

  exit 0
}
catch {
  Set-InstallState -State "FAILED" -Message "Error de ejecución"
  Rollback-WindowsHostsIfNeeded
  Write-Log "Error fatal: $($_.Exception.Message)" "ERROR"
  Write-Log "Revisa el log completo en: $Script:LogFile" "ERROR"
  exit 1
}

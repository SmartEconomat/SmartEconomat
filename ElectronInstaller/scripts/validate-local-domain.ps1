param(
  [string]$Domain = "smarteconomat.app",
  [int]$HttpPort = 80,
  [int]$HttpsPort = 443,
  [switch]$SkipHttps
)

$ErrorActionPreference = "Stop"

function Get-CheckResult {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )

  return [PSCustomObject]@{
    name = $Name
    ok = $Ok
    detail = $Detail
  }
}

function Resolve-Detail {
  param(
    [bool]$Condition,
    [string]$WhenTrue,
    [string]$WhenFalse
  )

  if ($Condition) {
    return $WhenTrue
  }

  return $WhenFalse
}

$results = @()

$hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
$hostsLines = Get-Content -LiteralPath $hostsPath -ErrorAction SilentlyContinue
$hostPattern = "(?i)(^|\s)$([Regex]::Escape($Domain))(\s|$)"
$hasHosts = ($hostsLines | Where-Object { $_ -match $hostPattern }).Count -gt 0
$results += Get-CheckResult -Name "hosts-entry" -Ok $hasHosts -Detail (Resolve-Detail -Condition $hasHosts -WhenTrue "Entrada encontrada en hosts." -WhenFalse "No existe entrada para el dominio.")

try {
  $ips = [System.Net.Dns]::GetHostAddresses($Domain) | ForEach-Object { $_.ToString() }
  $loopbackIps = $ips | Where-Object { $_ -eq "127.0.0.1" -or $_ -eq "::1" }
  $dnsOk = $loopbackIps.Count -gt 0
  $results += Get-CheckResult -Name "dns-loopback" -Ok $dnsOk -Detail ("IPs resueltas: " + ($ips -join ", "))
}
catch {
  $results += Get-CheckResult -Name "dns-loopback" -Ok $false -Detail $_.Exception.Message
}

$httpListen = Get-NetTCPConnection -State Listen -LocalPort $HttpPort -ErrorAction SilentlyContinue | Select-Object -First 1
$results += Get-CheckResult -Name "http-port-listening" -Ok ([bool]$httpListen) -Detail (Resolve-Detail -Condition ([bool]$httpListen) -WhenTrue "Puerto HTTP en escucha." -WhenFalse "Sin escucha en puerto HTTP.")

$httpsListen = Get-NetTCPConnection -State Listen -LocalPort $HttpsPort -ErrorAction SilentlyContinue | Select-Object -First 1
$results += Get-CheckResult -Name "https-port-listening" -Ok ([bool]$httpsListen) -Detail (Resolve-Detail -Condition ([bool]$httpsListen) -WhenTrue "Puerto HTTPS en escucha." -WhenFalse "Sin escucha en puerto HTTPS.")

try {
  $httpUrl = "http://$Domain"
  $httpResponse = Invoke-WebRequest -UseBasicParsing -Uri $httpUrl -TimeoutSec 12
  $results += Get-CheckResult -Name "http-response" -Ok $true -Detail ("HTTP status: " + [string]$httpResponse.StatusCode)
}
catch {
  $results += Get-CheckResult -Name "http-response" -Ok $false -Detail $_.Exception.Message
}

if (-not $SkipHttps) {
  try {
    $httpsUrl = "https://$Domain"
    $httpsResponse = Invoke-WebRequest -UseBasicParsing -Uri $httpsUrl -TimeoutSec 12
    $results += Get-CheckResult -Name "https-response-strict" -Ok $true -Detail ("HTTPS status: " + [string]$httpsResponse.StatusCode)
  }
  catch {
    $results += Get-CheckResult -Name "https-response-strict" -Ok $false -Detail $_.Exception.Message
  }
}

$certOk = $false
$certDetail = "No encontrado en trust store."
foreach ($location in @("CurrentUser", "LocalMachine")) {
  $store = "Cert:\$location\Root"
  $cert = Get-ChildItem -Path $store -ErrorAction SilentlyContinue | Where-Object {
    $_.Subject -match "(?i)CN=$([Regex]::Escape($Domain))" -or $_.Subject -match "(?i)smarteconomat"
  } | Select-Object -First 1

  if ($cert) {
    $certOk = $true
    $certDetail = "Encontrado en $location (thumbprint: $($cert.Thumbprint))."
    break
  }
}
$results += Get-CheckResult -Name "certificate-trust-store" -Ok $certOk -Detail $certDetail

$electronProcess = Get-Process -Name "SmartEconomat" -ErrorAction SilentlyContinue | Select-Object -First 1
$results += Get-CheckResult -Name "electron-process" -Ok ([bool]$electronProcess) -Detail (Resolve-Detail -Condition ([bool]$electronProcess) -WhenTrue "PID: $($electronProcess.Id)" -WhenFalse "Proceso no detectado.")

$allOk = ($results | Where-Object { -not $_.ok }).Count -eq 0

[PSCustomObject]@{
  ok = $allOk
  checkedAt = (Get-Date).ToString("o")
  domain = $Domain
  httpPort = $HttpPort
  httpsPort = $HttpsPort
  checks = $results
} | ConvertTo-Json -Depth 5

param(
  [string]$Domain = "smarteconomat.app"
)

$ErrorActionPreference = "Stop"

$hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
$current = Get-Content -LiteralPath $hostsPath -ErrorAction SilentlyContinue
$filtered = @()

foreach ($line in $current) {
  if ($line -match ("(?i)(^|\s)" + [Regex]::Escape($Domain) + "(?=\s|$)")) {
    continue
  }
  $filtered += $line
}

$filtered += "127.0.0.1 $Domain"
$filtered += "::1 $Domain"

Set-Content -LiteralPath $hostsPath -Value $filtered -Encoding ascii
Write-Output "HOSTS_FIXED"

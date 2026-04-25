param(
  [int]$HttpPort = 80,
  [int]$HttpsPort = 443
)

$ErrorActionPreference = "Stop"

$ports = @($HttpPort, $HttpsPort) | Sort-Object -Unique

foreach ($port in $ports) {
  if ($port -le 0) {
    continue
  }

  $ruleName = "SmartEconomat Local Port ($port)"
  netsh advfirewall firewall delete rule name="$ruleName" protocol=TCP localport=$port *> $null
  if ($LASTEXITCODE -gt 1) {
    throw "FIREWALL_DELETE_FAILED_$port"
  }

  netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$port profile=domain,private *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "FIREWALL_ADD_FAILED_$port"
  }
}

Write-Output "FIREWALL_FIXED"
exit 0

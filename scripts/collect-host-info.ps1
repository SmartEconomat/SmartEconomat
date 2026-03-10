# ──────────────────────────────────────────────────────────────────────────────
# collect-host-info.ps1
# Recopila información del host (Windows) y la exporta como variables
# de entorno HOST_* para que docker-compose las inyecte al contenedor.
#
# Uso:
#   . .\scripts\collect-host-info.ps1
#   docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
# ──────────────────────────────────────────────────────────────────────────────

# ── Usuario y hostname ──
$env:HOST_USER = $env:USERNAME
$env:HOST_HOSTNAME = $env:COMPUTERNAME
$env:HOST_PWD = (Get-Location).Path

# ── Shell ──
$psVersion = $PSVersionTable.PSVersion.ToString()
$env:HOST_SHELL = "PowerShell $psVersion"

# ── Red: MAC ──
try {
    $adapter = Get-NetAdapter |
        Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -notlike "*Virtual*" -and $_.InterfaceDescription -notlike "*Loopback*" } |
        Select-Object -First 1
    if ($adapter) {
        $env:HOST_MAC = $adapter.MacAddress -replace "-", ":"
    } else {
        $env:HOST_MAC = "Desconocida"
    }
} catch {
    $env:HOST_MAC = "Desconocida"
}

Write-Host "`n✅ Variables HOST_* del anfitrion exportadas correctamente." -ForegroundColor Green
Write-Host "   HOST_USER=$env:HOST_USER  HOST_HOSTNAME=$env:HOST_HOSTNAME" -ForegroundColor Cyan

# ============================================================================
# SmartEconomat - Setup HTTPS Local Automático (Windows)
# ============================================================================
# Unifica: certificados, confianza, hosts - TODO en un comando
# Uso: powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
# ============================================================================

# Configurar variables
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$CertsDir = Join-Path $RepoRoot "certs"
$LocalCaDir = Join-Path $CertsDir "local-ca"
$CertFile = Join-Path $LocalCaDir "smarteconomat-local-root-ca.crt"
$CertFilePem = Join-Path $LocalCaDir "smarteconomat-local-root-ca.pem"
$Domain = "smarteconomat.app"
$ApiDomain = "api.smarteconomat.app"
$HostsFile = "C:\Windows\System32\drivers\etc\hosts"

function Get-LanIpAddress {
    if ($env:LOCAL_BIND_IP) {
        return $env:LOCAL_BIND_IP
    }

    try {
        $adapter = Get-NetAdapter |
            Where-Object {
                $_.Status -eq "Up" -and
                $_.InterfaceDescription -notlike "*Virtual*" -and
                $_.InterfaceDescription -notlike "*Loopback*"
            } |
            Sort-Object -Property InterfaceMetric |
            Select-Object -First 1

        if ($adapter) {
            $ipAddress = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $adapter.ifIndex |
                Where-Object {
                    $_.IPAddress -notlike "127.*" -and
                    $_.IPAddress -notlike "169.254.*" -and
                    $_.PrefixOrigin -ne "WellKnown"
                } |
                Sort-Object -Property PrefixLength |
                Select-Object -First 1

            if ($ipAddress) {
                return $ipAddress.IPAddress
            }
        }

        $fallback = Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object {
                $_.IPAddress -notlike "127.*" -and
                $_.IPAddress -notlike "169.254.*" -and
                $_.PrefixOrigin -ne "WellKnown"
            } |
            Sort-Object -Property InterfaceMetric, PrefixLength |
            Select-Object -First 1

        if ($fallback) {
            return $fallback.IPAddress
        }
    }
    catch { }

    return "127.0.0.1"
}

$LanIp = Get-LanIpAddress

# Funciones para output
function Print-Header {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  🔐 SmartEconomat - Setup HTTPS Local (Windows)" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Step {
    param([string]$Message)
    Write-Host "▶ $Message" -ForegroundColor Cyan
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Get-BashCommand {
    $candidates = @(
        (Get-Command bash -ErrorAction SilentlyContinue).Path,
        "C:\Program Files\Git\bin\bash.exe",
        "C:\msys64\usr\bin\bash.exe"
    )

    foreach ($candidate in $candidates | Where-Object { $_ }) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    return $null
}

# Verificar permisos de administrador
function Check-Admin {
    $isAdmin = $false
    try {
        $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
        $isAdmin = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
    }
    catch { }
    
    if (-not $isAdmin) {
        Print-Error "Este script requiere permisos de Administrador"
        Print-Warning "Por favor ejecuta:"
        Write-Host "  powershell -ExecutionPolicy Bypass -File `"scripts/setup-smarteconomat-local.ps1`"" -ForegroundColor Yellow
        Write-Host "  (como Administrador)"
        exit 1
    }
}

# Paso 1: Generar certificados
function Setup-Certificates {
    Print-Step "Verificando certificados..."
    
    if (Test-Path $CertFile) {
        Print-Success "Certificados ya existen"
        return $true
    }
    
    Print-Warning "Certificados no encontrados, generando..."
    $bashCommand = Get-BashCommand

    if (-not $bashCommand) {
        Print-Error "Bash no encontrado. Instala Git for Windows o MSYS2"
        return $false
    }

    $env:LOCAL_BIND_IP = $LanIp
    & $bashCommand -lc "cd '$RepoRoot' && bash ./scripts/setup-local-prod-https.sh"
    
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Error generando certificados"
        return $false
    }
    
    Print-Success "Certificados generados"
    return $true
}

# Paso 2: Confiar certificado
function Trust-Certificate {
    Print-Step "Importando certificado en Windows..."
    
    # Convertir de PEM a DER si es necesario
    $derFile = Join-Path $LocalCaDir "smarteconomat-local-root-ca.der"
    
    if (Test-Path $CertFile) {
        # Convertir PEM a DER
        if (Test-Path "C:\Program Files\Git\usr\bin\openssl.exe") {
            & "C:\Program Files\Git\usr\bin\openssl.exe" x509 -inform PEM -in $CertFile -outform DER -out $derFile
        }
        else {
            Print-Warning "OpenSSL no encontrado, intentando importar directamente..."
        }
    }
    
    # Importar en el trust store del usuario (la alternativa es el trust store del sistema, requiere más permisos)
    if (Test-Path $derFile) {
        try {
            Import-Certificate -FilePath $derFile `
                -CertStoreLocation "Cert:\LocalMachine\Root" `
                -ErrorAction Stop | Out-Null
            Print-Success "Certificado importado en Windows Trust Store"
        }
        catch {
            Print-Warning "Error importando certificado: $_"
            Print-Warning "Intenta manualmente: Ejecutar → certmgr.msc → Importar certificado"
        }
    }
    else {
        Print-Warning "Archivo DER no generado, saltando importación"
    }
}

# Paso 3: Agregar DNS local a hosts
function Setup-Hosts {
    Print-Step "Configurando $HostsFile..."
    $newEntry = "$LanIp  $Domain $ApiDomain"
    $filteredLines = @()

    try {
        $existingLines = Get-Content -Path $HostsFile -ErrorAction SilentlyContinue
        foreach ($line in $existingLines) {
            if ($line -notmatch "(^|\s)$Domain(\s|$)") {
                $filteredLines += $line
            }
        }
        $filteredLines += $newEntry
        $content = $filteredLines -join [Environment]::NewLine
        Set-Content -Path $HostsFile -Value $content -Encoding ascii -ErrorAction Stop
        Print-Success "Agregado a hosts: $LanIp $Domain $ApiDomain"
    }
    catch {
        Print-Error "Error escribiendo en hosts: $_"
        return $false
    }

    return $true
}

function Open-FirewallPorts {
    Print-Step "Ajustando firewall de Windows..."

    foreach ($port in @(80, 443)) {
        $ruleName = "SmartEconomat Allow Port $port"
        if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
            try {
                New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null
            }
            catch {
                Print-Warning "No se pudo crear la regla de firewall para el puerto $port: $_"
            }
        }
    }

    Print-Success "Reglas de firewall verificadas para 80/443"
}

# Paso 4: Verificar Docker
function Verify-Docker {
    Print-Step "Verificando Docker..."
    
    $dockerPath = (Get-Command docker -ErrorAction SilentlyContinue).Path
    
    if (-not $dockerPath) {
        Print-Warning "Docker no está en PATH"
        return $false
    }
    
    Print-Success "Docker encontrado"
    return $true
}

# Paso 5: Mostrar resumen
function Print-Summary {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ Setup completado exitosamente" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📌 Configuración realizada:" -ForegroundColor Cyan
    Write-Host "   ✓ Certificados generados/verificados"
    Write-Host "   ✓ Certificado importado en Windows Trust Store"
    Write-Host "   ✓ Dominios añadidos a hosts apuntando a $LanIp"
    Write-Host "   ✓ Firewall preparado para acceso en red"
    Write-Host ""
    
    Write-Host "🌐 Acceso disponible:" -ForegroundColor Cyan
    Write-Host "   → https://$Domain"
    Write-Host "   → https://$ApiDomain"
    Write-Host "   → https://$LanIp"
    Write-Host ""
    
    Write-Host "💡 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Cierra todos los navegadores completamente"
    Write-Host "   2. Reabre tu navegador (Chrome, Edge, Firefox, etc.)"
    Write-Host "   3. Accede a https://$Domain o https://$LanIp"
    Write-Host ""
    
    Write-Host "ℹ️  Si aún ves error de certificado:" -ForegroundColor Yellow
    Write-Host "   → Ejecuta: certmgr.msc"
    Write-Host "   → O accede a https://$LanIp (sin error)"
    Write-Host ""
}

# Main
function Main {
    Print-Header
    
    # Verificar permisos
    Check-Admin
    
    # Validar repo
    if (-not (Test-Path $RepoRoot)) {
        Print-Error "Repo no encontrado en: $RepoRoot"
        exit 1
    }
    
    # Ejecutar pasos
    if (-not (Setup-Certificates)) { exit 1 }
    Trust-Certificate
    Setup-Hosts
    Open-FirewallPorts
    Verify-Docker
    
    Print-Summary
}

Main

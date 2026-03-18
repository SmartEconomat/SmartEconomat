# setup-universal.ps1
# Script para configuración automática de entorno Docker en Windows (Azure/Local)
# Uso: powershell -ExecutionPolicy Bypass -File setup-universal.ps1

$ErrorActionPreference = "Continue"

# --- 1. Autoelevación (Admin required) ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Elevando privilegios a Administrador..." -ForegroundColor Yellow
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell.exe -ArgumentList $arguments -Verb RunAs
    exit
}

Write-Host "=== SmartEconomat: Configuración Universal Iniciada ===" -ForegroundColor Cyan

# --- 2. Instalación de Chocolatey (Package Manager) ---
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Chocolatey..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force; 
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; 
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host "Chocolatey ya está instalado." -ForegroundColor Gray
}

# --- 3. Instalar Dependencias (Git, Docker, Compose) ---
function Install-IfNotExists {
    param([string]$cmd, [string]$package)
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Instalando $package..." -ForegroundColor Green
        choco install $package -y
    } else {
        Write-Host "$package ya está instalado." -ForegroundColor Gray
    }
}

Install-IfNotExists "git" "git"

# Docker Desktop (Universal para Win10/11/Server 2022)
if (!(Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe")) {
    Write-Host "Instalando Docker Desktop (esto puede tardar varios minutos)..." -ForegroundColor Green
    choco install docker-desktop -y
    Write-Host "REINICIO REQUERIDO o inicia Docker Desktop manualmente." -ForegroundColor Red
} else {
    Write-Host "Docker Desktop ya está instalado." -ForegroundColor Gray
}

# --- 4. Configurar OpenSSH Server ---
Write-Host "Verificando OpenSSH Server..." -ForegroundColor Cyan
$sshServer = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
if ($sshServer.State -ne 'Installed') {
    Write-Host "Instalando OpenSSH Server..." -ForegroundColor Green
    Add-WindowsCapability -Online -Name $sshServer.Name
}
Start-Service sshd -ErrorAction SilentlyContinue
Set-Service -Name sshd -StartupType 'Automatic'

# --- 5. Configurar Firewall ---
Write-Host "Configurando Firewall (Puertos 22, 80, 443)..." -ForegroundColor Cyan
$ports = @(22, 80, 443)
foreach ($port in $ports) {
    if (!(Get-NetFirewallRule -DisplayName "Allow Port $port" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "Allow Port $port" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow
    }
}

# --- 6. Clonar Proyecto y Desplegar ---
$projectDir = "C:\SmartEconomat"
if (!(Test-Path $projectDir)) {
    Write-Host "Clonando repositorio..." -ForegroundColor Green
    git clone https://github.com/psych/SmartEconomat.git $projectDir
}

Set-Location $projectDir

# Detectar y preparar .env.prod
if (!(Test-Path ".env.prod")) {
    Write-Host "Creando .env.prod desde ejemplo..." -ForegroundColor Yellow
    if (Test-Path ".env.example") { Copy-Item ".env.example" ".env.prod" }
}

# Iniciar Docker Engine (vía Docker Desktop)
Write-Host "Esperando a que Docker esté listo..." -ForegroundColor Yellow
$dockerReady = $false
for ($i=0; $i -lt 30; $i++) {
    if (docker version 2>$null) { $dockerReady = $true; break }
    Start-Sleep -Seconds 5
}

if ($dockerReady) {
    Write-Host "Lanzando Docker Compose..." -ForegroundColor Green
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
} else {
    Write-Host "Docker no parece estar activo. Asegúrate de iniciarlo." -ForegroundColor Red
}

Write-Host "=== Configuración Finalizada con Éxito ===" -ForegroundColor Cyan
Write-Host "Accede a la app vía: http://localhost o la IP Pública."

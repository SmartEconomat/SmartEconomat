# Guía de Despliegue en Windows Server (Azure)

Esta guía detalla el proceso completo realizado para desplegar el proyecto **SmartEconomat** en una máquina virtual Windows Server 2025 Datacenter en Azure.

## Requisitos de la Máquina
- **Tamaño:** Standard D2s v3 (mínimo 2 vCPUs y 8GB RAM para soportar virtualización anidada).
- **Sistema Operativo:** Windows Server 2025 Datacenter.
- **Red (Azure NSG):** Puertos abiertos 80 (HTTP), 443 (HTTPS), 22 (SSH), 3389 (RDP).

## Paso 1: Configuración de OpenSSH
Windows Server incluye OpenSSH, pero requiere configuración manual para uso profesional:

1. **Instalación:**
   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   Start-Service sshd
   Set-Service -Name sshd -StartupType 'Automatic'
   ```

2. **Permisos de Seguridad (Crítico):**
   OpenSSH en Windows es muy estricto. Se deben eliminar los permisos heredados del archivo `authorized_keys`:
   ```powershell
   icacls "C:\Users\psych\.ssh\authorized_keys" /inheritance:r
   icacls "C:\Users\psych\.ssh\authorized_keys" /grant "psych:F"
   icacls "C:\Users\psych\.ssh\authorized_keys" /grant "SYSTEM:F"
   ```

3. **Configuración de sshd_config:**
   Ubicación: `C:\ProgramData\ssh\sshd_config`. Ajustes realizados:
   - `PubkeyAuthentication yes`
   - `PasswordAuthentication yes`
   - `AuthorizedKeysFile .ssh/authorized_keys`
   - Desactivado el bloque `Match Group administrators` que redirigía las llaves de administradores a una ruta global protegida.

## Paso 2: Preparación para Docker (Linux Containers)
Como el proyecto usa imágenes de Linux (Redis, Postgres, Node), Windows debe actuar como host de contenedores Linux:

1. **Habilitar Virtualización:**
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart
   Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart
   # Reinicio requerido
   ```

2. **Instalación de WSL2:**
   Se instaló el kernel de WSL2 para permitir que Docker ejecute contenedores Linux con alto rendimiento.

3. **Instalación de Docker Desktop:**
   Se instaló mediante línea de comandos:
   ```powershell
   .\DockerDesktopInstaller.exe install --quiet --accept-license
   ```

## Paso 3: Despliegue de la Aplicación

1. **Subida de archivos:** El proyecto se subió comprimido vía SCP y se descomprimió en `C:\Users\psych\SmartEconomat`.
2. **Configuración de Entorno:** Se creó el archivo `.env.prod` basándose en `.env.example`, configurando el dominio con `nip.io` para SSL automático.
3. **Ejecución:**
   ```powershell
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

## Mantenimiento y Logs
- Ver logs de contenedores: `docker logs -f smarteconomat-backend`
- Estado del sistema: `docker ps`
- Reiniciar app: `docker-compose restart`

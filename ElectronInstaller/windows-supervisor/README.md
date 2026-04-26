# SmartEconomat Windows Supervisor

Servicio Windows persistente para supervisar Docker y el stack SmartEconomat.

## Qué hace

- Verifica Docker daemon en cada ciclo.
- Arranca/repara Docker y el stack Compose si detecta degradación.
- Ejecuta vigilancia continua cada 15 segundos.
- Valida salud local y dominio público (`smarteconomat.app`).
- Registra logs y estado en `C:\ProgramData\SmartEconomat`.

## Requisitos

- .NET 8 SDK
- Docker Engine operativo en Windows (WSL2 headless)
- WinSW (`winsw-x64.exe`) copiado en el directorio de publicación

## Instalación del servicio

```powershell
cd ElectronInstaller\windows-supervisor\scripts
.\install-service.ps1
```

## Desinstalación del servicio

```powershell
cd ElectronInstaller\windows-supervisor\scripts
.\uninstall-service.ps1
```

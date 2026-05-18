# SmartEconomat Windows Supervisor

Servicio Windows persistente para supervisar Docker y el stack SmartEconomat.

## Qué hace

- **Reconciliación por estado deseado**: compara estado observado vs catálogo fijo (docker, postgres, redis, backend, frontend).
- Aplica **una acción mínima por ciclo** (L1–L4) con cooldowns desacoplados.
- Ciclo cada 3 min (120–300 s). Ver `docs/RECONCILIATION.md`.
- Logs y estado en `C:\ProgramData\SmartEconomat`.

## Tests

```powershell
dotnet test ElectronInstaller/windows-supervisor/tests
```

Cubre mapeo drift → niveles L1–L4 (`DriftAnalyzerTests`).

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

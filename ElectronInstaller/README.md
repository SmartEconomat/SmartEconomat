# SmartEconomat Installer

Instalador desktop para despliegue self-hosted de SmartEconomat con Docker Compose.

## Alcance v1

- Wizard de instalación guiada: preflight, configuración, deploy y verificación.
- Generación automática de `.env.prod` validada por schema.
- Configuración TLS local autofirmada.
- Panel operativo local: start/stop/restart, health, logs, backup/restore, diagnóstico.
- IPC segura con allowlist, validación de payloads y sin acceso directo a Node desde renderer.

## Requisitos

- Node.js >= 22.2.0
- Docker Engine activo
- Docker Compose plugin (`docker compose version`)
- OpenSSL disponible para generación TLS local

## Desarrollo

```bash
cd ElectronInstaller
npm ci
npm run dev
```

## Calidad

```bash
cd ElectronInstaller
npm run lint
npm run type-check
npm run test
npm run build:app
```

## Build de instalador

```bash
cd ElectronInstaller
npm run build
npm run build:linux
npm run build:mac
npm run build:win
```

`npm run build` detecta la plataforma actual y construye el target correspondiente (Linux -> `--linux`, macOS -> `--mac`, Windows -> `--win`).

## Flujo operativo

1. Ejecutar preflight.
2. Configurar datos iniciales (admin/host/runtime path/TLS/backups).
3. Generar `.env.prod` en runtime path.
4. Preparar TLS local.
5. Levantar stack Docker.
6. Verificar salud.
7. Operar desde Control Panel.

## Runtime path

El runtime path lo elige el usuario. Se guardan:

- `.env.prod`
- `installation-journal.json`
- `certs/`
- `certs-webroot/`
- `backups/`
- `diagnostics/`

## Scripts instalador

### Bootstrap

- Linux: `scripts/install/linux/bootstrap.sh`
- macOS: `scripts/install/macos/bootstrap.sh`
- Windows: `scripts/install/windows/bootstrap.ps1`

### Operaciones

- Backup: `scripts/ops/backup.sh` / `scripts/ops/backup.ps1`
- Restore: `scripts/ops/restore.sh` / `scripts/ops/restore.ps1`
- Health: `scripts/ops/health-check.sh` / `scripts/ops/health-check.ps1`

## Runbook rápido

### Linux/macOS

```bash
bash ElectronInstaller/scripts/install/linux/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all
```

Si 80/443 están ocupados y quieres que el script intente liberarlos automáticamente:

```bash
bash ElectronInstaller/scripts/install/linux/bootstrap.sh --runtime-path /tmp/smarteconomat-runtime --mode all --release-busy-ports
```

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File ElectronInstaller/scripts/install/windows/bootstrap.ps1 -RuntimePath C:\SmartEconomatRuntime -Mode all
```

Si 80/443 están ocupados y quieres que PowerShell intente cerrarlos automáticamente:

```powershell
powershell -ExecutionPolicy Bypass -File ElectronInstaller/scripts/install/windows/bootstrap.ps1 -RuntimePath C:\SmartEconomatRuntime -Mode all -ReleaseBusyPorts
```

## Troubleshooting

### Docker no disponible

- Verifica `docker version` y `docker compose version`.
- Inicia Docker Desktop o daemon de Docker.

### Puertos 80/443 ocupados

- Identifica proceso ocupando puertos.
- Usa bootstrap con `--release-busy-ports` (Linux/macOS) o `-ReleaseBusyPorts` (Windows).
- Si prefieres manual: detén el proceso detectado o aplica remapeo explícito en compose.

### Error de TLS local

- Verifica que OpenSSL esté instalado.
- Reintenta bootstrap con permisos suficientes.

### Backup/restore falla

- Verifica que el stack esté levantado y `.env.prod` exista.
- Comprueba permisos de escritura en runtime path.
- Valida artefacto y metadata del backup.

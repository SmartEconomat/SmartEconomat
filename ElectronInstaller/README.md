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
npm run build:win:fast
npm run build:win:release
npm run build:win:signed
node ./scripts/sign-windows-artifact.mjs
node ./scripts/verify-win-signature.mjs
```

`npm run build` detecta la plataforma actual y construye el target correspondiente (Linux -> `--linux`, macOS -> `--mac`, Windows -> `--win`).

`npm run build:win:fast` es el flujo recomendado para entorno local de Windows: evita dependencias de `winCodeSign` cuando no hay material de firma. Si defines variables de firma (`WIN_CSC_PFX_PATH` o `WIN_CSC_THUMBPRINT`), el script firma y verifica el `.exe` automáticamente al final.

`npm run build:win:release` está pensado para distribución en equipos Windows donde `winCodeSign` puede fallar por privilegios de symlink. El script fuerza `signAndEditExecutable=false` para evitar ese error y, si detecta certificado, firma y verifica automáticamente el instalador.

`npm run build:win:signed` es la variante estricta: además de construir, exige verificación de firma válida al final (fallará si el `.exe` no está firmado).

### Firma de código (Windows)

Variables soportadas:

- `WIN_CSC_PFX_PATH`: ruta al certificado `.pfx`.
- `WIN_CSC_PFX_PASSWORD`: password del `.pfx` (si aplica).
- `WIN_CSC_THUMBPRINT`: huella SHA1 de certificado instalado en store de Windows (alternativa al `.pfx`).
- `SIGNTOOL_PATH`: ruta explícita a `signtool.exe` (opcional si está en PATH).
- `WIN_TIMESTAMP_URL`: servidor RFC3161 (opcional, por defecto `http://timestamp.digicert.com`).

Ejemplo PowerShell:

```powershell
$env:WIN_CSC_PFX_PATH = "C:\certs\smarteconomat.pfx"
$env:WIN_CSC_PFX_PASSWORD = "<secret>"
npm run build:win:release
```

Nota: Smart App Control puede bloquear binarios sin firma de confianza o sin reputación. Para producción se recomienda certificado de firma de código confiable (idealmente EV/Trusted Signing).

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

## Runbooks operativos

- Arquitectura Plug-and-Play: `docs/ARQUITECTURA_PLUG_AND_PLAY.md`
- Firma Windows: `docs/WINDOWS_SIGNING.md`
- Matriz de caos del supervisor autónomo: `docs/SUPERVISOR_CHAOS_MATRIX.md`
- Ejecución guiada en 1 sesión (QA/soporte): `docs/SUPERVISOR_CHAOS_SESSION_GUIDE.md`

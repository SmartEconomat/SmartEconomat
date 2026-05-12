# Reinstalación Docker: caché y preservación de datos

## Cambios aplicados (2026-05-12)

### Objetivo
Garantizar que Docker aproveche la caché BuildKit en reinstalaciones y que el proceso sea no-destructivo (datos preservados).

## Comportamiento por modo

### `installMode: "reinstall"` (forceClean: false, destroyVolumes: false)
- NO se ejecuta `docker compose down` → los contenedores siguen corriendo
- Se ejecuta `docker compose up -d --build --remove-orphans`
  - `--build` reconstruye imágenes aprovechando la caché de Docker BuildKit
  - Sin `--force-recreate`: solo se recrean contenedores cuya imagen/config cambió
  - Volúmenes de datos (PostgreSQL, Redis) **nunca se tocan** ✅

### `installMode: "new"` (forceClean: true, destroyVolumes: true) — DESTRUCTIVO
**Flujo:**
1. **PRE_INSTALL_BACKUP**: si existe instalación previa (`hasInstalledRuntime`):
   - Ejecuta `BackupRestoreService.backupNow()` con label `pre-install-new`
   - Si backup falla → la instalación se CANCELA (protección anti data-loss)
   - Si no hay instalación previa → skip (primer install)
2. `docker compose down --volumes --remove-orphans` → **elimina contenedores Y volúmenes**
3. `docker compose up -d --build --force-recreate --remove-orphans` → stack limpio

### Boot Guardian Level 3 (forceClean: true, destroyVolumes: false)
- `docker compose down --remove-orphans` (SIN `--volumes`) → volúmenes preservados ✅
- Recuperación agresiva de emergencia, nunca destructiva de datos

## Cambios en código

### `docker-orchestrator.service.ts`
- `startStack()` default cambiado de `{ forceClean: true }` a `{ forceClean: false }` para evitar operaciones destructivas accidentales
- `startStack()` options extendidas: `{ forceClean?: boolean; destroyVolumes?: boolean }`
  - `destroyVolumes: true` añade `--volumes` al comando `down` (elimina volúmenes)
  - `destroyVolumes: false` (default) preserva volúmenes en cualquier `down`
- `getDockerEnvironment()` inyecta siempre `DOCKER_BUILDKIT=1` y `COMPOSE_DOCKER_CLI_BUILD=1` para garantizar BuildKit y su caché
- `startStack()` emite logs informativos explicando el modo y qué se preserva

### `boot-guardian.service.ts`
- `performRecoveryLevel3()` pasa `{ forceClean: true }` explícitamente (comportamiento intencional de recuperación agresiva que conserva volúmenes)

### `external-supervisor.service.ts`
- `startStack()` pasa `{ forceClean: false }` explícitamente en el path de recuperación (no destructivo)

### `installer.ipc.ts`
- `installerConfigSchema` incluye `installMode: z.union([z.literal("new"), z.literal("reinstall")])`
- `BackupRestoreService` inyectado como dependencia del constructor
- `runInstallation()` implementa paso `PRE_INSTALL_BACKUP` para `installMode: "new"`:
  - Verifica instalación previa con `hasInstalledRuntime()`
  - Si existe: ejecuta `backupService.backupNow()` con label `pre-install-new`
  - Si falla: cancela la instalación (`PRE_INSTALL_BACKUP_FAILED`)
  - Si no existe: omite backup (primer install)
- `startStack` call: `{ forceClean: true, destroyVolumes: true }` para new, `{ forceClean: false }` para reinstall

## Regla clave
- `docker compose down` SIN `--volumes` preserva los named volumes (PostgreSQL, Redis)
- `--build` sin `--no-cache` usa la caché de capas Docker → builds rápidos en reinstalación
- La caché BuildKit persiste mientras no se limpie el daemon Docker (docker system prune)

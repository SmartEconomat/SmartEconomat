# Guía completa: SmartEconomat Electron Installer (Windows / macOS / Linux)

Este documento explica cómo funciona el instalador Electron (`ElectronInstaller/`), cómo empaquetarlo en `.exe` (Windows), `.dmg` (macOS) y `.AppImage` (Linux), y qué limitaciones/decisiones técnicas existen al distribuir una app fullstack Dockerizada a usuarios finales.

## 1. Objetivo del instalador

El instalador es una aplicación **Electron** que guía al usuario final para:

- Verificar que **Docker** está instalado y en ejecución.
- Pedir los valores necesarios del **`.env.prod`**.
- Pedir credenciales del **usuario administrador**.
- Crear una instalación local en `~/SmartEconomat`.
- Ejecutar `docker compose` con `docker-compose.prod.yml`.
- Ejecutar el seed para asegurar que existe un admin.
- Mostrar al final la URL de acceso en el navegador.
- Permitir desinstalación completa (contenedores + volúmenes + carpeta).

## 2. Estructura del proyecto del instalador

Ruta: `SmartEconomat/ElectronInstaller/`

Archivos principales:

- `main.js`
  - Proceso principal de Electron.
  - Implementa IPC (`ipcMain.handle`) para:
    - `check-dependencies`
    - `run-installation`
    - `run-uninstall`
- `preload.js`
  - Expone una API segura (`contextBridge`) hacia el renderer.
- `index.html` + `style.css` + `renderer.js`
  - UI (wizard) y lógica de formulario.
- `package.json`
  - `electron` + `electron-builder`.

## 3. Prerrequisitos en la máquina del usuario

El instalador **no sustituye Docker**. Requiere:

- Docker instalado.
- Docker en ejecución.
- Docker Compose disponible (normalmente incluido como `docker compose`).

Si no se cumplen, la GUI mostrará un mensaje y un enlace a la guía oficial de instalación (dependiendo del sistema operativo).

## 4. Variables pedidas al usuario (.env.prod)

El instalador pide (GUI) y genera `~/SmartEconomat/.env.prod` con estas variables:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `JWT_SECRET`
- `JWT_EXPIRATION`

Además pide:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (con confirmación)

Notas:

- El instalador **no guarda** `ADMIN_EMAIL`/`ADMIN_PASSWORD` dentro del `.env.prod` por defecto. Se pasan al contenedor backend vía `docker compose exec -e ...` para el seed.

## 5. Flujo de instalación (paso a paso)

### 5.1 Check de dependencias

1. El renderer llama `installerAPI.checkDependencies()`.
2. `main.js` ejecuta:
   - `docker info`
   - `docker compose version` (o `docker-compose version` como fallback)
3. Si falla:
   - Se muestra error en UI.
   - Se ofrece enlace para instalar Docker.

### 5.2 Configuración

1. Usuario rellena formulario.
2. `renderer.js` valida:
   - Puertos válidos (1-65535).
   - Campos no vacíos.
   - `JWT_SECRET` mínimo 16 caracteres.
   - Coherencia básica entre `POSTGRES_*` y `DB_*`.
   - Contraseña admin y confirmación coinciden.

### 5.3 Copia de proyecto + `.env.prod`

`main.js` crea `~/SmartEconomat` y copia:

- `docker-compose.prod.yml`
- `backend/`
- `frontend/`
- `database/`
- (si existen) `Dockerfile.prod` y `Dockerfile.dev`

Luego genera:

- `~/SmartEconomat/.env.prod`

### 5.4 Arranque Docker

En `~/SmartEconomat`:

- `docker compose -f docker-compose.prod.yml pull`
- `docker compose -f docker-compose.prod.yml up -d`
- `docker compose -f docker-compose.prod.yml ps`

### 5.5 Seed de admin (garantía mínima actual)

El instalador intenta ejecutar:

- Si existe el script `seed:admin` en backend:
  - `docker compose -f docker-compose.prod.yml exec -T -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... backend npm run seed:admin`
- Si NO existe (estado actual del repo):
  - `docker compose -f docker-compose.prod.yml exec -T -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... backend npm run seed usuario`

Después verifica en PostgreSQL:

- `SELECT COUNT(*) FROM usuario WHERE username='admin' OR email='<ADMIN_EMAIL>'`

Si el count es `< 1`, la instalación falla.

Limitación importante:

- Con el fallback `seed usuario`, el admin creado es el **default** del seeder (`admin/123456/admin@smarteconomat.com`). La GUI pide credenciales, pero el backend aún no las consume.

Recomendación:

- Implementar un `seed:admin` real en backend (idempotente) que cree/actualice el admin con `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### 5.6 Pantalla final

La UI muestra:

- `http://localhost:<FRONTEND_PORT>`

## 6. Desinstalación

Desde la GUI:

- Confirma con diálogo.
- Ejecuta:
  - `docker compose -f docker-compose.prod.yml down -v`
- Borra la carpeta:
  - `~/SmartEconomat`

## 7. Empaquetado con electron-builder (Windows/macOS/Linux)

### 7.1 Scripts

En `ElectronInstaller/package.json`:

- `npm run start` (dev)
- `npm run pack` (dir)
- `npm run build` (instalables)

### 7.2 Construir instaladores

Desde `ElectronInstaller/`:

- Windows:
  - `npm run build` genera NSIS (`.exe`) en `ElectronInstaller/dist/`
- macOS:
  - `npm run build` genera `.dmg` en `ElectronInstaller/dist/`
- Linux:
  - `npm run build` genera `.AppImage` en `ElectronInstaller/dist/`

### 7.3 Consideraciones cross-platform

- Para crear `.dmg` en macOS, lo ideal es compilar en macOS.
- Para crear `.exe` confiable, compilar en Windows.
- Para `.AppImage`, compilar en Linux.

Aunque electron-builder soporta cross-compile en algunos casos, para releases de producción se recomienda CI multi-OS (GitHub Actions) o build nativo por OS.

## 8. Limitación actual crítica: instalador autocontenido

El requisito "doble clic" para usuario final implica que el instalador lleve todo lo necesario.

Estado actual:

- En modo **dev**, el instalador copia `backend/frontend/database` desde el repo (`repoRootDir`).
- En modo **packaged**, `repoRootDir` es `null` y `main.js` aborta con un error.

Para cumplir el requisito final, hay que:

- Incluir `backend/`, `frontend/`, `database/`, `docker-compose.prod.yml`, `Dockerfile.prod` como `extraResources` (o `asarUnpack`) en electron-builder.
- Y modificar `main.js` para copiar desde `process.resourcesPath` cuando `app.isPackaged === true`.

## 9. Recomendaciones de seguridad

- No usar `JWT_SECRET=secret`. Debe ser largo y aleatorio.
- Usar contraseñas robustas para `POSTGRES_PASSWORD` y admin.
- El `.env.prod` queda guardado en `~/SmartEconomat/.env.prod`.
  - En entornos compartidos, esto es sensible.
- Considera cifrado local (difícil) o al menos advertencias claras.

## 10. Checklist de release

- Asegurar que `seed:admin` existe y es idempotente.
- Verificar que `docker-compose.prod.yml` no requiere ficheros fuera de `~/SmartEconomat`.
- Empaquetar recursos (extraResources) para modo packaged.
- Probar en:
  - Windows 10/11
  - macOS (Intel y Apple Silicon si aplica)
  - Ubuntu/Debian

---

Si quieres, el siguiente paso es:

1) Hacer el instalador **autocontenido** (resources empaquetados)
2) Implementar `seed:admin` real en backend (usar las credenciales introducidas)
3) Mejorar healthchecks (esperar a que frontend responda HTTP)

# Auditoría de dependencias, Node.js 22 LTS y Docker — SmartEconomat

**Fecha:** 2026-05-16  
**Alcance:** `backend/smart-economat-backend`, `frontend/smart-economat-frontend`, Docker dev/prod, CI, ElectronInstaller (engines).  
**Node objetivo:** `>=22.13.0` LTS (pin recomendado: `22.13.1`, ver `.nvmrc`).

---

## A. Diagnóstico técnico

### A.1 Node.js 22.2.0 (causa raíz de EBADENGINE)

| Síntoma | Causa |
|---------|--------|
| `EBADENGINE Unsupported engine` | Paquetes modernos (p. ej. `eslint-visitor-keys@5`) exigen `^20.19.0 \|\| ^22.13.0 \|\| >=24`. |
| Incompatibilidad silenciosa en ESLint/TS | Node 22.2.0 queda por debajo del umbral mínimo del ecosistema ESLint 9 + typescript-eslint 8. |

**Impacto:** instalaciones con warnings, riesgo de fallos en CI/local al actualizar tooling.  
**Decisión:** `engines.node` → `>=22.13.0`; imágenes Docker `node:22.13-alpine`; CI ya usaba `22.13.1` en `deploy.yml`.

### A.2 Override `chokidar@^3.6.0` (ERESOLVE / peer conflict)

| Paquete | Esperaba | El proyecto forzaba |
|---------|----------|---------------------|
| `@angular-devkit/core@19` (vía `@nestjs/cli`) | `chokidar@^4` (optional peer) | `chokidar@^3.6.0` en `overrides` |
| `@nestjs/cli` | `chokidar@4.0.3` | mismo override |

**Impacto:** `npm warn ERESOLVE overriding peer dependency`, `npm ls` marcaba `chokidar@4.0.3 invalid`.  
**Solución:** eliminar override de `chokidar`. Coexisten `chokidar@4` (CLI/webpack) y `chokidar@3` (`nestjs-i18n`) sin conflicto de instalación.

### A.3 `inflight@1.0.6` y `glob@7.x` (abandonados / CVEs conocidos)

**Cadena típica (antes):**

```
jest@29 → glob@7 → inflight
exceljs → archiver → glob@7 → inflight
erdia → rimraf@3 → glob@7 → inflight
```

**Solución aplicada:** `overrides.glob: "^13.0.6"` en backend — unifica glob en v13 (API compatible para usos de dependencias transitivas en este árbol).  
**Resultado:** `inflight` ausente en `package-lock.json`; sin `glob@7` ni `glob@10` deprecados en lockfile.

**Riesgo residual:** `erdia` (solo dev, `npm run generate:erd`) arrastra `react-native` vía `alasql`; no afecta runtime ni Docker prod. Valorar sustituir erdia a medio plazo.

### A.4 `glob@10.5.0` deprecated

Provenía de `typeorm`, `jest@30`, `erdia` antes del override. Con `glob@13` el warning desaparece en instalación limpia.

### A.5 Jest 30 en backend

`jest@30` + `@jest/*` en parches distintos (`30.4.1` vs `30.4.2`) provocó:

```
TypeError: this._moduleMocker.clearMocksOnScope is not a function
```

**Decisión:** mantener **Jest 29.7** (estable con `@swc/jest` y NestJS 11). La eliminación de `inflight` no depende de Jest 30 sino del override de `glob`.

### A.6 Frontend: Jest sin uso

El frontend usa **Vitest** exclusivamente. `jest`, `ts-jest` y `@types/jest` eran dependencias huérfanas que reintroducían `glob@7` + `inflight` vía `babel-plugin-istanbul` / `test-exclude@6`.

**Acción:** eliminados; `@testing-library/*` movidos a `devDependencies`.

### A.7 Seguridad (`npm audit`)

| Paquete | Severidad | Origen | Mitigación |
|---------|-----------|--------|------------|
| `uuid@11.0.x` | moderate | `exceljs`, `typeorm` | override + dep directa → `11.1.1` |
| `basic-ftp`, `fast-uri`, `ip-address`, `mermaid` | high/moderate | cadena dev (`erdia`/docs) | `npm audit fix` |

**Estado final:** `0 vulnerabilities` en backend y frontend tras `npm audit fix`.

### A.8 Docker

| Problema | Antes | Después |
|----------|-------|---------|
| Node obsoleto | `node:22.2.0-alpine` | `node:22.13-alpine` |
| Sin capa cacheable de deps (dev) | solo `COPY package*` + `ensure-deps` en arranque | `npm ci` en build de imagen + `ensure-deps` si cambia lock |
| Prod backend | ya usaba multi-stage + `npm ci` | imágenes Node actualizadas |

`ensure-deps.sh` se mantiene: sincroniza `node_modules` del volumen anónimo cuando cambia `package-lock.json` (bind mount dev).

---

## B. Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `.nvmrc` | **Nuevo** — `22.13.1` |
| `.npmrc` | **Nuevo** — `engine-strict=true`, `fund=false`, `audit=true` |
| `backend/.../package.json` | engines, uuid 11.1.1, overrides (glob, uuid, yauzl), jest 29, sin glob/ts-jest/chokidar override |
| `backend/.../package-lock.json` | regenerado |
| `frontend/.../package.json` | engines, sin jest; testing-library en devDeps; typescript-eslint alineado |
| `frontend/.../package-lock.json` | regenerado (~415 paquetes vs ~662) |
| `ElectronInstaller/package.json` | engines `>=22.13.0` |
| `backend/Dockerfile.dev`, `frontend/Dockerfile.dev` | Node 22.13 + `npm ci` en build |
| `backend/Dockerfile.prod` | Node 22.13 |
| `.github/workflows/docs-internal-links.yml` | Node `22.13.1` _(workflow retirado del repo con posterioridad)_ |
| `README.md` | requisito Node actualizado |
| `frontend/eslint.config.mjs` | eliminado `globals.jest` (tests importan desde vitest) |

---

## C. Comandos de reproducción

```bash
# Versión Node (nvm / fnm / instalador oficial)
nvm install 22.13.1
nvm use 22.13.1

# Limpieza e instalación backend
cd backend/smart-economat-backend
rm -rf node_modules
npm ci
npm dedupe
npm audit
npm run build
npm run lint
npm run test

# Frontend
cd ../../frontend/smart-economat-frontend
rm -rf node_modules
npm ci
npm dedupe
npm audit
npm run build
npm run lint
npm run test

# Docker desarrollo
cd ../..
docker compose --env-file .env.dev -f docker-compose.dev.yml build backend frontend
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

---

## D. Validaciones ejecutadas (2026-05-16)

| Comando | Backend | Frontend |
|---------|---------|----------|
| `npm ci` | OK | OK |
| `npm audit` | 0 vulns | 0 vulns |
| `npm run build` | OK (541 archivos SWC) | OK (Vite) |
| `npm run lint` | OK | OK (4 warnings react-refresh preexistentes) |
| `npm run test` | OK (617 tests) | OK (316 tests) |
| `inflight` en lockfile | ausente | ausente |

---

## E. Recomendaciones enterprise (no implementadas — roadmap)

1. **Monorepo npm workspaces** en raíz (`backend`, `frontend`, `ElectronInstaller`) + un solo lockfile opcional — mejor dedupe y CI; requiere migración planificada.
2. **pnpm + `pnpm.overrides`** — instalaciones más rápidas y estrictas; activar vía `corepack enable`.
3. **Turborepo** — solo si se unifican paquetes; útil para `build`/`test`/`lint` en paralelo con caché remota.
4. **Sustituir `erdia`** por generación ERD sin `react-native`/`alasql` (p. ej. TypeORM + Mermaid manual o `typeorm-uml`).
5. **Jest 30** — reevaluar cuando NestJS documente matriz oficial y todas las `@jest/*` estén en el mismo patch.
6. **Imagen prod frontend multi-stage** — builder Node 22.13 + `npm ci` + `npm run build` en CI/Dockerfile (hoy es prebuild en host para instalador slim).

---

## F. Justificación técnica de versiones clave

| Tecnología | Versión | Motivo |
|------------|---------|--------|
| Node | >=22.13.0 | LTS con soporte de `eslint-visitor-keys`, npm 10+, parches de seguridad |
| NestJS | 11.x | Sin cambio; alineado con arquitectura |
| Jest (backend) | 29.7 | Compatibilidad `@swc/jest` + estabilidad; glob unificado vía override |
| Vitest (frontend) | 3.2 | Stack de tests real del proyecto |
| glob (override) | 13.0.6 | Elimina cadenas 7.x/10.x deprecadas sin subir a Jest 30 |
| uuid | 11.1.1 | Parche GHSA-w5hq-g745-h8pq |

---

*Auditoría aplicada en repositorio; para incidencias nuevas de dependencias, repetir `npm ls <paquete>` y revisar este documento antes de añadir overrides.*

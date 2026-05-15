# Arquitectura

## Vision general

SmartEconomat se divide en cuatro bloques principales:

- Frontend web (`frontend/smart-economat-frontend`) - React 19 + Vite.
- Backend API (`backend/smart-economat-backend`) - NestJS 11 + TypeORM.
- Datos (`database` + servicio `db` en Compose) - PostgreSQL con `pg_uuidv7`.
- Instalador desktop (`ElectronInstaller`) - Electron + NSIS para despliegue asistido.

## Topologia de runtime

### Desarrollo

- `docker-compose.dev.yml` levanta `db`, `redis`, `backend` y `frontend`.
- Frontend expuesto en `FRONTEND_PORT` (default `5173`).
- Backend expuesto en `BACKEND_PORT` (default `3000`).
- API base: `/api/v1` (ver `backend/.../src/main.ts`).

### Produccion

- `docker-compose.prod.yml` levanta `db`, `redis`, `backend`, `frontend` y perfiles opcionales (`seeder`, `tools`).
- Frontend sirve HTTP/HTTPS via Nginx (`80`/`443`).
- Backend se conecta internamente a `db` y `redis`.

## Backend

- Framework: NestJS 11.
- ORM: TypeORM 0.3.
- Seguridad: JWT (cookie + bearer), guards, CSRF middleware.
- API versionada en `/api/v1`.
- Swagger en `/api/v1/docs`.
- Modulos de negocio principales:
  - Catalogo: productos, proveedores.
  - Compras: pedidos, lotes de compra.
  - Recepcion e incidencias.
  - Inventario y movimientos.
  - Produccion (recetas/preparaciones).
  - Seguridad RBAC (usuarios, roles, permisos).
  - Dominio educativo (profesor/alumno).

## Frontend

- React + React Router + MUI.
- Cliente HTTP central en `src/services/api.service.ts`.
- `credentials: "include"` para autenticacion por cookie.
- Rutas protegidas por contexto de autenticacion/permisos.

### Arquitectura frontend por capas

La arquitectura del frontend se organiza en capas para evitar acoplamiento entre UI y transporte HTTP:

- Capa de presentacion: `src/pages`, `src/components`, `src/features`.
- Capa de navegacion y autorizacion: `src/routes` (`AppRouter`, `ProtectedRoute`, `PublicRoute`).
- Capa de estado global: `src/store` y `src/sherlock-auth` (sesion, permisos, tema, toasts).
- Capa de integracion: `src/services` (cliente API central + servicios por dominio).
- Capa de soporte: `src/hooks`, `src/utils`, `src/types`.

Flujo recomendado:

`UI` -> `hooks/features` -> `services/*` -> `api.service.ts` -> `backend /api/v1`.

## ElectronInstaller

- Proceso principal en `src/main`.
- Renderer React en `src/renderer`.
- Validacion de plantilla de entorno con schema (`resources/templates/env.schema.json`).
- Build empaqueta artefactos backend/frontend listos para despliegue.

## Persistencia y cache

- PostgreSQL para datos transaccionales.
- Redis para cache y soporte a componentes de seguridad/rendimiento.

## Integracion continua y despliegue

- Workflow `deploy.yml`: lint, test, build y despliegue remoto.
- Workflow `electron-installer-screenshots.yml`: build y capturas del instalador en matriz de SO.

## Lo que no existe hoy

- No hay `package.json` en la raiz del repo.
- No existe una carpeta `wiki/` activa en la estructura actual.

## Profundización

- [Índice de arquitectura (ADRs y capas)](./architecture/index.md)
- [Mapa estructural extendido](../.github/ai/ARCHITECTURE.md) (fuente usada por automatización y `AGENTS.md`)

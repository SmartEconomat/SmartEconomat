# SmartEconomat

Plataforma integral para gestionar economato educativo: catalogo, compras, recepcion, inventario, produccion y control de acceso por roles.

## Estado del proyecto

- Arquitectura principal: `frontend` (React + Vite), `backend` (NestJS + TypeORM), `database` (PostgreSQL), `ElectronInstaller` (desktop installer).
- Entornos soportados: Docker Compose desarrollo y produccion.
- CI/CD activo en GitHub Actions para validacion y despliegue.

## Estructura del repositorio

```text
backend/smart-economat-backend      API REST y logica de negocio
frontend/smart-economat-frontend    Aplicacion web React
ElectronInstaller                   Instalador Electron/NSIS
database                            Imagen PostgreSQL personalizada (pg_uuidv7)
scripts                             Automatizacion operativa y despliegue
docs                                Documentacion canonicamente mantenida
```

## Requisitos recomendados

### Ejecucion con Docker (recomendada)

- Docker Desktop / Docker Engine + Compose v2
- Git

### Desarrollo local fuera de Docker (opcional)

- Node.js `>=22.2.0` (backend, frontend y ElectronInstaller)
- npm (incluido con Node)

## Inicio rapido

1. Clonar repositorio:

```bash
git clone https://github.com/SmartEconomat/SmartEconomat.git
cd SmartEconomat
```

2. Copiar plantilla de entorno:

```bash
cp .env.example .env.dev
```

3. Arrancar entorno de desarrollo:

```bash
docker compose --env-file .env.dev --file docker-compose.dev.yml up
```

Para levantar el stack de produccion con la configuracion productiva:

```bash
docker compose --env-file .env.prod --file docker-compose.prod.yml up -d
```

4. Servicios principales:

- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`

## Comandos principales

### Backend (`backend/smart-economat-backend`)

- `npm run start:dev` - servidor NestJS en watch
- `npm run build` - compilacion
- `npm run lint` - lint
- `npm run test` - unit tests
- `npm run test:e2e` - e2e
- `npm run migration:run` - migraciones
- `npm run seed` - seeders

### Frontend (`frontend/smart-economat-frontend`)

- `npm run dev` - Vite dev server
- `npm run build` - build produccion
- `npm run lint` - lint
- `npm run test` - Vitest
- `npm run test:e2e` - Playwright

### ElectronInstaller (`ElectronInstaller`)

- `npm run dev` - app Electron en desarrollo
- `npm run build:app` - build app installer
- `npm run test` - tests unitarios
- `npm run test:e2e` - e2e del instalador
- `npm run capture:screenshots` - capturas de wizard/panel

## Documentacion oficial

Toda la documentacion mantenida como fuente de verdad esta en `docs/README.md`.

Documentos clave:

- `docs/architecture.md`
- `docs/business-rules.md`
- `docs/installation.md`
- `docs/configuration.md`
- `docs/environment-variables.md`
- `docs/development.md`
- `docs/deployment.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/faq.md`
- `docs/changelog.md`
- `docs/documentation-audit-report.md`

## Notas de veracidad

- Si una guia antigua contradice el codigo, prevalece el codigo.
- Esta documentacion no asume funcionalidades no implementadas.
- Cuando una capacidad no existe hoy, se documenta explicitamente como "no implementada".

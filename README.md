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

- Node.js `>=22.13.0` LTS (backend, frontend y ElectronInstaller; ver `.nvmrc`)
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

## Configuración de credenciales de administrador

Para configurar la contraseña inicial de los usuarios `admin` y `superadmin` (especialmente útil en el primer despliegue o para reseteos), define la siguiente variable de entorno en tu archivo `.env.dev` (local) o `.env.prod` (servidor):

```env
SEED_DEFAULT_ADMIN_TEMP_PASSWORD=SmartEconomat2026!
```

Una vez definida, ejecuta el seeder de bootstrap para aplicar los cambios:

```bash
# En backend/smart-economat-backend
npm run seed:bootstrap-admin-users
```

> [!IMPORTANT]
> Si no se define esta variable, el sistema generará una contraseña aleatoria de 24 caracteres tipo base64url que podrás encontrar en los logs o en el archivo `.env.prod` del servidor tras el despliegue.

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

Toda la documentacion mantenida como fuente de verdad esta en [docs/README.md](docs/README.md). Para una primera incorporación, usar también [docs/onboarding/README.md](docs/onboarding/README.md).

Documentos clave (runbooks en la raíz de `docs/`):

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

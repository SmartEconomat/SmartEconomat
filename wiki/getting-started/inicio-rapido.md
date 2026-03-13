# Guía de Inicio Rápido

Instrucciones para clonar, configurar y ejecutar SmartEconomat en un entorno de desarrollo local.

---

## Requisitos Previos

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| **Node.js** | 20+ | `node -v` |
| **npm** | 10+ | `npm -v` |
| **Docker** | 24+ | `docker -v` |
| **Docker Compose** | 2.20+ | `docker compose version` |
| **Git** | 2.40+ | `git --version` |

**Editor recomendado:** VS Code con las extensiones ESLint, Prettier y Docker.

---

## 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio> SmartEconomat
cd SmartEconomat
```

---

## 2. Configurar Variables de Entorno

Copiar el archivo de ejemplo y ajustar los valores:

```bash
cp .env.example .env.dev
```

Editar `.env.dev` con los valores adecuados:

```env
# Base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=smart_economat
DB_PORT=5432

# Backend
BACKEND_PORT=3000
BACKEND_API_URL=http://localhost:3000

# Frontend
FRONTEND_PORT=5173
FRONTEND_API_URL=http://localhost:3000

# Entorno
NODE_ENV=development
```

> **Nota:** En desarrollo, `DB_SYNC=true` se activa automáticamente cuando `NODE_ENV` no es `production`. Esto sincroniza el esquema de la base de datos con las entidades de TypeORM.

---

## 3. Levantar el Proyecto con Docker (Recomendado)

Este es el método más sencillo. Levanta PostgreSQL, el backend y el frontend con un solo comando:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Servicios disponibles tras el arranque:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | `http://localhost:5173` | Aplicación React (Vite dev server) |
| **Backend API** | `http://localhost:3000/api/v1` | API REST NestJS |
| **Swagger (Docs)** | `http://localhost:3000/docs` | Documentación interactiva de la API |
| **PostgreSQL** | `localhost:5432` | Base de datos (acceder con un cliente como DBeaver) |

### Comandos Docker útiles

```bash
# Levantar en segundo plano
docker compose -f docker-compose.dev.yml up -d

# Ver logs del backend
docker compose -f docker-compose.dev.yml logs -f backend

# Detener todos los servicios
docker compose -f docker-compose.dev.yml down

# Reconstruir un servicio específico
docker compose -f docker-compose.dev.yml up --build backend
```

---

## 4. Ejecución Local sin Docker (Alternativa)

Si prefieres ejecutar los servicios de forma nativa:

### 4.1. Base de Datos

Asegúrate de tener PostgreSQL instalado y ejecutándose. Crea la base de datos:

```sql
CREATE DATABASE smart_economat;
```

> La extensión UUID v7 personalizada debe compilarse e instalarse manualmente desde `database/pg_uuidv7/`. Consulta [architecture/uuid-v7.md](../architecture/uuid-v7.md) para más detalles.

### 4.2. Backend

```bash
cd backend/smart-economat-backend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo (hot-reload con SWC)
npm run start:dev
```

### 4.3. Frontend

```bash
cd frontend/smart-economat-frontend

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
```

---

## 5. Poblar la Base de Datos (Seeders)

Una vez que el backend esté en ejecución y conectado a la base de datos:

```bash
cd backend/smart-economat-backend

# Ejecutar todos los seeders en orden
npm run seed
```

Esto creará datos de ejemplo: usuarios, productos, proveedores, inventario, pedidos, recetas, etc.

Para un reset completo de la base de datos y datos:

```bash
npm run db:reset
```

> Ver [Documentación de Seeders](../development/seeders.md) para detalles sobre cada seeder.

### Credenciales de Desarrollo

Tras ejecutar los seeders, puedes iniciar sesión con:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | *(creado por seeder)* | `SmartEconomat2026!` |

> Consulta los logs del seeder para ver los usuarios creados exactos.

---

## 6. Scripts Disponibles

### Backend (`backend/smart-economat-backend/`)

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Desarrollo con hot-reload (SWC) |
| `npm run start:debug` | Modo debug con inspector |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm run start:prod` | Ejecutar build compilado |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:e2e` | Ejecutar tests E2E |
| `npm run test:cov` | Generar reporte de cobertura |
| `npm run seed` | Poblar la base de datos |
| `npm run db:reset` | Drop + Sync + Seed completo |
| `npm run lint` | Linting con auto-fix |
| `npm run format` | Formatear código con Prettier |
| `npm run generate:erd` | Generar diagrama ER |

### Frontend (`frontend/smart-economat-frontend/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server con Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar build |
| `npm run lint` | Linting |

---

## 7. Estructura del Proyecto

```
SmartEconomat/
├── backend/
│   ├── Dockerfile.dev              # Dockerfile de desarrollo
│   ├── Dockerfile.prod             # Dockerfile de producción
│   └── smart-economat-backend/     # Proyecto NestJS
│       ├── src/
│       │   ├── modules/            # 20 módulos de negocio
│       │   ├── common/             # Decoradores, filtros, pipes, DTOs
│       │   ├── config/             # Configuración de BD e i18n
│       │   ├── seeders/            # 12 seeders de datos
│       │   ├── i18n/               # Traducciones (es, en)
│       │   └── migrations/         # Migraciones TypeORM
│       └── test/                   # Tests E2E (23+ archivos)
├── frontend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── smart-economat-frontend/    # Proyecto React + Vite
│       └── src/
├── database/
│   └── pg_uuidv7/                  # Extensión PostgreSQL UUID v7
├── docker-compose.dev.yml          # Compose para desarrollo
├── docker-compose.prod.yml         # Compose para producción
├── .env.example                    # Variables de entorno de ejemplo
└── wiki/                           # Documentación del proyecto
```

---

## 8. Despliegue en Producción

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

En producción:
- El backend ejecuta `npm run start:prod` (código compilado)
- El frontend se sirve con **Nginx** como servidor estático y proxy inverso
- La base de datos usa un volumen persistente

Consulta [Errores Comunes y Soluciones](errores/README.md) para problemas frecuentes en despliegue.

---

## Siguientes Pasos

- [Arquitectura del Backend](../architecture/backend.md) — Entender la estructura del servidor
- [Referencia Rápida Backend](../development/backend-quick-reference.md) — Cheatsheet para desarrollo
- [API Completa](../reference/api.md) — Explorar todos los endpoints
- [Guía de TypeORM](../development/typeorm.md) — Trabajar con la base de datos

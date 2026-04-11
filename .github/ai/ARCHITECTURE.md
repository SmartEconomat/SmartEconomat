# Arquitectura de SmartEconomat

> Sistema de gestión integral de economato para centros educativos.  
> Stack: **NestJS 11 · React 19 · PostgreSQL · Redis · Docker**

---

## Visión general

SmartEconomat es una aplicación web full-stack que digitaliza la cadena completa de un economato: catálogo de productos, compras a proveedores, recepción de mercancía, control de inventario, producción/cocina, gestión de incidencias y generación de albaranes. Incluye además un módulo educativo (profesores y alumnos) y un sistema RBAC completo con permisos dinámicos.

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  Vite · MUI 7 · Context API · React Router 7 · Vitest          │
│  Puerto: 5173 (dev) / 80+443 vía Nginx (prod)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │  fetch (credentials: 'include')
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                       BACKEND (NestJS 11)                       │
│  TypeORM 0.3 · Passport JWT · class-validator · i18n · Sentry   │
│  API REST: /api/v1/*  ·  Swagger: /api/v1/docs                 │
│  Puerto: 3000                                                   │
└──────┬──────────────────────────────────┬────────────────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│  PostgreSQL  │                  │    Redis     │
│  + pg_uuidv7 │                  │   7-alpine   │
│  Puerto 5432 │                  │  Puerto 6379 │
└──────────────┘                  └──────────────┘
```

---

## Capa API y contratos

### Capa API

La capa API del sistema se divide en dos niveles coordinados:

- **Frontend**: `frontend/smart-economat-frontend/src/services/` concentra el acceso HTTP por módulo y `api.service.ts` centraliza `baseFetch`, cookies, normalización de respuestas y manejo de errores comunes.
- **Backend**: la API pública vive bajo `/api/v1`, con controladores NestJS que validan entrada mediante DTOs y delegan la lógica de negocio a servicios y transacciones.

Los componentes y hooks del frontend no deben saltarse esta capa ni duplicar `fetch`, serialización de payloads o lógica de autenticación.

### Flujo de datos

El flujo de datos esperado es:

`UI / pages / hooks` → `services frontend` → `api.service.ts` → `API REST /api/v1` → `controllers NestJS` → `services backend` → `repositories / transacciones` → `PostgreSQL / Redis` → respuesta normalizada → `contextos / UI`.

### Contratos backend como fuente de verdad

Los contratos backend son la fuente de verdad del sistema:

- DTOs, enums, filtros, shapes de respuesta y validaciones definidas por el backend mandan sobre cualquier supuesto del cliente.
- El frontend debe adaptarse a esos contratos, no al revés.
- Si aparece un `400 Bad Request` por desalineación, la primera acción es corregir payloads, query params, tipos o mapeos del cliente antes de relajar validaciones del backend.

---

## Backend

### Stack y dependencias principales

| Área | Tecnología |
|------|-----------|
| Framework | NestJS 11.0.1 |
| ORM | TypeORM 0.3.27 |
| Base de datos | PostgreSQL 15+ con extensión `pg_uuidv7` |
| Caché | Redis 7-alpine (ioredis 5.7.0) |
| Autenticación | JWT vía Passport (`passport-jwt`) en cookie `httpOnly` |
| Validación | `class-validator` + `class-transformer` + `I18nValidationPipe` |
| Internacionalización | `nestjs-i18n` (es/en) |
| Documentación API | Swagger (`@nestjs/swagger`) en `/api/v1/docs` |
| Rate limiting | `@nestjs/throttler` (3 niveles: auth 500/min, write 1000/min, read 5000/min) |
| Monitorización | Sentry 10.43.0 |
| Exportación | ExcelJS, PDFKit, PDFMake |
| Email | Nodemailer |

### Estructura de carpetas

```
backend/smart-economat-backend/src/
├── main.ts                     # Bootstrap: pipes, guards, interceptors, Swagger
├── app.module.ts               # Módulo raíz (importa 26 módulos de dominio)
├── common/                     # Código compartido
│   ├── decorators/             # @RequirePermissions, @IsUnique, @Normalize
│   ├── dto/                    # PaginatedResponseDto, PaginationQueryDto
│   ├── entities/               # BaseEntity (UUID v7, soft delete, versioning)
│   ├── enums/                  # Constantes globales, error keys
│   ├── filters/                # GlobalExceptionFilter
│   ├── guards/                 # JwtAuthGuard, RolesGuard, SmartAuthThrottlerGuard
│   ├── helpers/                # I18nHelper, MovimientoHelper, VersionHelper
│   ├── interceptors/           # TransformInterceptor, HighTrafficAlertInterceptor
│   ├── pipes/                  # ParseUUIDv7Pipe, TrimStringTransformer
│   ├── transformers/           # ColumnNumericTransformer (numéricos monetarios)
│   └── utils/                  # ValidateEAN13
├── config/                     # database.config.ts, i18n.config.ts, typeorm.config.ts
├── i18n/                       # Diccionarios (es, en)
├── migrations/                 # Migraciones TypeORM
├── modules/                    # 26 módulos de dominio (ver sección siguiente)
└── seeders/                    # Seeders (roles, usuarios, productos, proveedores…)
```

### Pipeline de request

```
Request HTTP
  → Middleware (cookie-parser, helmet)
  → Guards (JWT auth → permisos RBAC → rate limit)
  → Pipes (I18nValidationPipe: whitelist + forbidNonWhitelisted + transform)
  → Controller
  → Service (lógica de negocio, transacciones)
  → Repository / QueryBuilder → PostgreSQL
  ↓ Response
  ← Interceptors (TransformInterceptor: { statusCode, message, data })
  ← GlobalExceptionFilter (normalización de errores + i18n)
  ← Cliente
```

### Módulos de dominio (26)

| Dominio | Módulos | Entidades principales |
|---------|---------|----------------------|
| **Catálogo** | `producto`, `proveedor` | `Producto`, `ProductoProveedor`, `ProductoAlergeno`, `HistorialPrecio`, `Proveedor` |
| **Compras** | `pedido`, `pedido-draft`, `purchase-batch` | `PedidoUsuario`, `PedidoUsuarioLinea`, `Pedido`, `PedidoProducto`, `PurchaseBatch`, `PedidoDraft` |
| **Recepción** | `recepcion`, `recepcion-draft`, `albaran` | `Recepcion`, `RecepcionPedido`, `RecepcionProducto`, `Albaran`, `AlbaranPedidoRecepcion`, `RecepcionDraft` |
| **Incidencias** | `incidencia` | `Incidencia`, `IncidenciaLinea`, `IncidenciaResuelta` |
| **Inventario** | `inventario`, `ubicacion`, `movimiento`, `merma` | `Inventario`, `Ubicacion`, `Movimiento`, `Merma` |
| **Producción** | `receta`, `preparacion` | `Receta`, `RecetaIngrediente`, `Preparacion`, `ProduccionLote` |
| **Seguridad** | `auth`, `usuario`, `roles`, `permisos`, `plantillas-roles`, `sherlock-auth` | `Usuario`, `Rol`, `Permiso`, `PlantillaRol` |
| **Educativo** | `alumno`, `profesor` | `Alumno`, `AlumnoSlot`, `Profesor` |
| **Soporte** | `archivo`, `admin`, `dashboard`, `export` | `Archivo` |

### Patrón estándar de módulo

```
modulo-x/
├── modulo-x.module.ts          # @Module: imports, providers, exports
├── controller/
│   └── entidad.controller.ts   # Endpoints REST, @ApiTags, guards
├── service/
│   └── entidad.service.ts      # Lógica de negocio, transacciones
├── repository/
│   └── entidad.repository.ts   # TypeORM Repository + QueryBuilder
├── entity/
│   └── entidad.entity.ts       # @Entity, @Column, relaciones
├── dto/
│   ├── create-entidad.dto.ts   # Validación de creación
│   ├── update-entidad.dto.ts   # PartialType(CreateDto)
│   └── filter-entidad.dto.ts   # Filtros + paginación
└── enums/
    └── modulo.enums.ts         # Estados y tipos del dominio
```

---

## Frontend

### Stack y dependencias principales

| Área | Tecnología |
|------|-----------|
| Framework | React 19.2.0 |
| Build | Vite 6.1.0 |
| Routing | React Router 7.13.0 |
| Estado | Context API (auth, theme, toast) + Redux Toolkit 2.11.2 |
| UI | Material UI (MUI) 7.3.7 + Emotion |
| Testing | Vitest 3.2.4 + React Testing Library |
| Escaneo códigos | `@zxing/library` |
| Monitorización | Sentry 10.43.0 |

### Estructura de carpetas

```
frontend/smart-economat-frontend/src/
├── main.tsx                    # Bootstrap: providers, router
├── App.tsx                     # Componente raíz
├── assets/                     # Fonts, imágenes, SCSS
├── components/                 # Componentes reutilizables (ui/, common/, por módulo)
├── features/                   # Módulos funcionales (auth…)
├── hooks/                      # Hooks personalizados
├── layouts/                    # MainLayout, AuthLayout, DefaultLayout
├── pages/                      # Vistas por ruta (Productos, Pedidos, Inventario…)
├── routes/                     # AppRouter, Guards (ProtectedRoute/PublicRoute), menuConfig
├── services/                   # Servicios HTTP por módulo (api.service.ts base)
├── sherlock-auth/              # Integración auth educativo
├── store/                      # AuthContext, ThemeContext, ToastContext
├── types/                      # Tipos globales (api.types, models, enums)
└── utils/                      # Helpers (auth, config, theme, validators)
```

### Gestión de estado

| Context | Responsabilidad |
|---------|----------------|
| `AuthContext` | Usuario autenticado, permisos efectivos, `login()`, `logout()`, `hasPermission()` |
| `ThemeContext` | Modo claro/oscuro |
| `ToastContext` | Notificaciones globales |

### Autenticación (cookie-first)

1. `POST /api/v1/auth/login` → backend devuelve JWT en cookie `httpOnly`
2. Frontend llama `GET /api/v1/usuarios/perfil` → carga usuario en `AuthContext`
3. Peticiones posteriores incluyen cookie automáticamente (`credentials: 'include'`)
4. Si 401 → evento `AUTH_UNAUTHORIZED` → logout limpio
5. Rutas protegidas validan `AuthContext.user` + permiso requerido vía `ProtectedRoute`

### Rendimiento y UX (Carga Progresiva)

- **Code Splitting**: Se utiliza `React.lazy` y `Suspense` para cargar componentes pesados y modales de forma diferida.

### Accesibilidad (Arquitectura Semántica)

SmartEconomat sigue los estándares WCAG AA para garantizar una experiencia inclusiva:
- **Outline Semántico**: Cada página debe poseer un único `h1` que defina el contexto principal, seguido de una jerarquía lógica de `h2`, `h3`, etc., sin saltar niveles.
- **Etiquetado ARIA**: Todo elemento interactivo sin texto (como `IconButton`) debe incluir un `aria-label` descriptivo. Los iconos meramente decorativos se ocultan mediante `aria-hidden="true"`.
- **Ratios de Contraste**: Se garantiza un contraste mínimo de 4.5:1, ajustando los tokens de texto secundario en temas oscuros para maximizar la legibilidad.

### Transporte HTTP

`api.service.ts` expone un `baseFetch()` que:
- Usa `credentials: 'include'` (envía cookies automáticamente)
- No inyecta header `Authorization` (la cookie lo maneja)
- Normaliza respuestas a `{ data, statusCode, message }`
- Emite `AUTH_UNAUTHORIZED` en 401 para logout automático

---

## Base de datos

### PostgreSQL + pg_uuidv7

La base de datos es PostgreSQL 15+ con una extensión custom (`pg_uuidv7`) compilada en C que genera UUID v7 directamente en la BD. Los UUID v7 son ordenables cronológicamente, lo que mejora el rendimiento de índices B-tree frente a UUID v4.

### BaseEntity

Todas las entidades (salvo tablas puente con PK compuesta) heredan de `BaseEntity`:

```typescript
{
  id:        UUID v7   // PK generada por BD
  createdAt: timestamp // auto
  updatedAt: timestamp // auto
  deletedAt: timestamp // soft delete (borrado lógico)
  deletedBy: UUID      // quién eliminó
  version:   number    // optimistic locking
}
```

### Modelo de datos — dominios principales

```
Producto ──(1:N)──▸ ProductoProveedor ◂──(N:1)── Proveedor
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Inventario  HistorialPrecio  PedidoProducto
              │                           │
              ▼                           ▼
         Ubicacion                     Pedido ◂──(N:1)── PedidoUsuario
                                          │                    │
                                          ▼                    ▼
                                    RecepcionPedido    PedidoUsuarioLinea
                                          │
                                          ▼
                                      Recepcion ──(1:N)──▸ RecepcionProducto
                                                                 │
                                                                 ▼
                                                            Incidencia ──(1:N)──▸ IncidenciaLinea

Receta ──(1:N)──▸ RecetaIngrediente
  │
  ├──(1:N)──▸ Preparacion
  └──(1:N)──▸ ProduccionLote

Usuario ──(N:M)──▸ Rol ──(N:M)──▸ Permiso
  │
  ├── permisosAdicionales (N:M directo)
  └── permisosExcluidos   (N:M directo)
```

### Convenciones de BD

- Tablas en singular `snake_case` (`producto`, `pedido_producto`)
- Columnas en `snake_case`; FKs como `<entidad>_id`
- Numéricos monetarios/cantidades: columna `numeric` con `ColumnNumericTransformer`
- Soft delete global vía `deletedAt IS NULL`

---

## Seguridad

### Autenticación

- JWT firmado con `JWT_SECRET`, expiración configurable (`JWT_EXPIRES_IN`)
- Token almacenado en cookie `httpOnly` (no accesible desde JavaScript)
- Cookie `secure` en producción
- Contraseñas hasheadas con bcrypt

### Autorización (RBAC dinámico)

```
Usuario
  └─ Rol del sistema (admin, profesor, alumno…)
       └─ Permisos base del rol (80+ permisos definidos)
  └─ Permisos adicionales (por usuario)
  └─ Permisos excluidos (por usuario)
  = Permisos efectivos (cacheados en Redis, TTL 300s)
```

Endpoints protegidos con `@RequirePermissions('modulo:accion')`.  
Guard `AuthPermissionsGuard` valida JWT → consulta `SherlockAuthService` → verifica permiso → 200 o 403.

### Validación de entrada

- `I18nValidationPipe` global con `whitelist: true`, `forbidNonWhitelisted: true`
- DTOs con decoradores `class-validator` y mensajes i18n
- `ParseUUIDv7Pipe` para parámetros UUID en rutas
- Validación EAN-13 para códigos de barras

### Rate limiting

Tres niveles via `@nestjs/throttler`:
- **auth**: 500 req/min (login, registro)
- **write**: 1000 req/min (POST, PUT, DELETE)
- **read**: 5000 req/min (GET)

### Headers de seguridad (producción)

Nginx en producción aplica: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.

---

## Infraestructura

### Docker Compose

| Servicio | Dev | Prod | Descripción |
|----------|-----|------|-------------|
| `db` | ✅ | ✅ | PostgreSQL custom con `pg_uuidv7`, healthcheck `pg_isready` |
| `redis` | ✅ | ✅ | Redis 7-alpine con AOF persistence |
| `backend` | ✅ | ✅ | NestJS. Dev: watch mode. Prod: multi-stage `node dist/main.js` |
| `frontend` | ✅ | ✅ | Dev: Vite dev server. Prod: Nginx multi-stage con SSL |
| `tls` | ❌ | ✅ | Certificados TLS gestionados por `scripts/deploy.sh` (autofirmado por defecto) |

### Dockerfiles multi-stage (producción)

**Backend**: `builder` (npm install + build) → `production` (solo `dist/` + `node_modules` prod + usuario sin privilegios).

**Frontend**: `builder` (npm install + vite build) → `nginx:alpine` (archivos estáticos + `nginx.conf`).

### Nginx (producción)

- Puerto 80: ACME challenge + redirect 301 a HTTPS
- Puerto 443: SSL (TLS 1.2/1.3), SPA routing (`try_files $uri /index.html`), proxy inverso `/api/*` → `backend:3000`

### Redes Docker

- **Dev**: `smarteconomat-dev-network` (bridge, todos los servicios)
- **Prod**: `backend-network` (db + redis + backend) + `frontend-network` (backend + frontend)

---

## Testing

### Backend (Jest)

```
test/
├── setup/          # pg-mem (PostgreSQL in-memory), globalSetup/Teardown
├── common/         # test-app.helper.ts (crear app NestJS de test)
├── e2e/            # Specs E2E (admin, alumnos, incidencias, RBAC, ubicaciones…)
├── modules/        # Tests unitarios por módulo
└── utils/          # Helpers de test
```

Comandos:
- `npm run test` — unitarios
- `npm run test:e2e` — E2E contra BD
- `npm run test:cov` — cobertura

### Frontend (Vitest + RTL)

Tests unitarios y de componentes con Vitest + React Testing Library.

Comandos:
- `npm run test` — ejecución única
- `npm run test:watch` — modo watch
- `npm run test:coverage` — cobertura V8

---

## Patrones arquitectónicos clave

| Patrón | Implementación | Beneficio |
|--------|---------------|-----------|
| **Repository** | Clase `@Injectable()` que extiende `Repository<T>` con métodos custom | Desacopla persistencia de lógica de negocio |
| **DTO + Validación en borde** | DTOs separados (create, update, filter) con `class-validator` | Sanitización automática, type-safety |
| **Soft delete** | `BaseEntity` con `@DeleteDateColumn()` + `deletedBy` | Recuperación de datos, auditoría, integridad histórica |
| **UUID v7** | Generados en BD con `pg_uuidv7` | PKs ordenables cronológicamente, mejor rendimiento en índices |
| **Transacciones ACID** | `DataSource.transaction()` en servicios multi-entidad | Atomicidad garantizada (e.g., pedido + líneas + movimiento) |
| **Caché Redis** | Permisos de usuario (TTL 300s), invalidación explícita | Reduce queries de auth por request |
| **Guards composables** | `JwtAuthGuard` → `PermisosGuard` → `ThrottlerGuard` | Pipeline de seguridad declarativo |
| **Context API (frontend)** | `AuthContext`, `ThemeContext`, `ToastContext` | Estado global sin Redux para conceptos transversales |
| **Cookie-first auth** | JWT en cookie `httpOnly` + `secure` | Protección contra XSS (token no accesible desde JS) |

---

## Convenciones de código

- **Idioma de negocio**: español
- **Carpetas**: `kebab-case`, singular (`producto/`, `pedido-draft/`)
- **Archivos TS**: `kebab-case` con sufijo de tipo (`producto.controller.ts`, `create-producto.dto.ts`)
- **Clases**: `PascalCase`; propiedades/variables: `camelCase`
- **Rutas API**: plural bajo `/api/v1` (`/productos`, `/proveedores`)
- **IDs**: UUID v7 siempre (no autoincrementales)
- **Relaciones TypeORM**: `import type { Relation } from 'typeorm'`
- **Guards en controladores**: `@ApiTags` + `JwtAuthGuard` + `PermisosGuard` + `@RequirePermissions`

---

## Referencias

- [Arquitectura Backend detallada](../wiki/architecture/backend-structure.md)
- [Modelo de datos](../wiki/architecture/data-model.md)
- [Arquitectura Frontend](../wiki/architecture/frontend.md)
- [UUID v7](../wiki/architecture/uuid-v7.md)
- [Soft Delete](../wiki/architecture/soft-delete.md)
- [Patrones y trade-offs](../wiki/architecture/patrones-y-tradeoffs.md)
- [Sistema RBAC](../wiki/security/rbac.md)
- [Guía de despliegue](../wiki/DEPLOYMENT.md)
- [Auditoría de seguridad](../wiki/audits/security-report.md)

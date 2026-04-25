# Revisión de Arquitectura — SmartEconomat Backend

> Fecha: 23 de marzo de 2026

---

## Resumen ejecutivo

SmartEconomat Backend es una API REST construida con NestJS 11 siguiendo principios de **módulos verticales** (por dominio de negocio) combinados con una capa `common/` transversal que provee base services, repositories, guards, filters, decoradores e interceptores reutilizables. La arquitectura se apoya en un sistema de permisos dinámico (apodado "Sherlock") con cache Redis, lo que otorga flexibilidad RBAC sin penalizar rendimiento en la verificación de acceso.

---

## Diagrama de arquitectura general

```mermaid
graph TB
  subgraph Cliente
    FE[Frontend Vue 3]
    EL[ElectronInstaller]
  end

  subgraph "API Gateway (NestJS)"
    direction TB
    MW["Middlewares\n cookieParser · trust proxy"]
    CORS["CORS Guard\n URL_FRONTEND_DERIVADA"]
    THROTTLE["SmartAuthThrottlerGuard\n in-memory | user/IP tracker"]
    PIPE["I18nValidationPipe\n whitelist · forbidNonWhitelisted"]
    GEF["GlobalExceptionFilter\n i18n errors · Sentry capture"]
    TI["TransformInterceptor\n envelope ApiResponse"]
    CSI["ClassSerializerInterceptor"]
  end

  subgraph "Auth & IAM"
    JWT["JwtStrategy\n Passport · cookie httpOnly"]
    JG["JwtAuthGuard / SherlockJwtAuthGuard"]
    PG["AuthPermissionsGuard\n @RequirePermissions · @RequireAnyPermission"]
    APS["AuthPermissionsService\n cache Redis TTL 300s"]
  end

  subgraph "Módulos de Dominio (21)"
    direction LR
    AUTH[auth]
    USR[usuario]
    PDO[pedido · pedido-draft]
    RCP[recepcion · recepcion-draft]
    PRD[producto · proveedor]
    INV[inventario]
    RCT[receta · preparacion · produccion]
    INC[incidencia · merma]
    ALB[albaran]
    DASH[dashboard]
    EXP[export]
    ARC[archivo]
    EDU[alumno · profesor · admin]
    ROLES[roles · permisos · plantillas-roles]
  end

  subgraph "Infraestructura"
    PG_DB[(PostgreSQL)]
    REDIS[(Redis\n cache · draft TTL)]
    FS[File System\n /uploads]
    SENTRY[Sentry\n monitoring]
  end

  FE -->|HTTPS + cookie JWT| MW
  EL -->|HTTPS| MW
  MW --> CORS --> THROTTLE --> PIPE
  PIPE --> JG
  JG --> APS
  APS -->|cache hit| REDIS
  APS -->|cache miss| PG_DB
  JG --> PG
  PG --> Módulos

  Módulos --> PG_DB
  AUTH --> APS
  ARC --> FS
  GEF --> SENTRY
```

---

## Diagrama de flujo de autenticación y autorización

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Frontend
  participant API as NestJS API
  participant JWT as JwtStrategy
  participant PERM as AuthPermissionsService
  participant CACHE as Redis Cache
  participant DB as PostgreSQL

  U->>FE: Introduce credenciales
  FE->>API: POST /api/v1/auth/login
  API->>DB: SELECT usuario WHERE email/username
  DB-->>API: Usuario + password hash
  API->>API: bcrypt.compare(password, hash)
  API-->>FE: { access_token } + Set-Cookie: jwt (httpOnly)

  Note over FE,API: Peticiones posteriores

  FE->>API: GET /api/v1/inventario (cookie jwt)
  API->>JWT: Valida token (firma + expiración)
  JWT-->>API: JwtPayload { sub, username, role }
  API->>PERM: getUserPermissions(userId)
  PERM->>CACHE: GET user:permissions:UUID
  alt Cache hit
    CACHE-->>PERM: string[] permisos
  else Cache miss
    PERM->>DB: SELECT permisos FROM roles + adicionales - excluidos
    DB-->>PERM: string[] permisos
    PERM->>CACHE: SET user:permissions:UUID TTL 300s
  end
  PERM-->>API: string[] permisos efectivos
  API->>API: @RequirePermissions check
  alt Permiso concedido
    API-->>FE: 200 + datos
  else Permiso denegado
    API-->>FE: 403 Forbidden
  end
```

---

## Diagrama de módulos y dependencias principales

```mermaid
graph LR
  APP[AppModule] --> AUTH[AuthModule]
  APP --> USR[UsuarioModule]
  APP --> ROLES[RolesModule]
  APP --> SHERLOCK[SherlockAuthModule]
  APP --> PDO[PedidoModule]
  APP --> RCP[RecepcionModule]
  APP --> PRD[ProductoModule]
  APP --> INV[InventarioModule]
  APP --> RCT[RecetaModule]
  APP --> INC[IncidenciaModule]

  AUTH --> USR
  AUTH --> ROLES
  SHERLOCK --> USR
  SHERLOCK --> ROLES
  SHERLOCK --> PERM[PermisosModule]

  PDO --> PRD
  PDO --> USR
  RCP --> PDO
  RCP --> INV
  RCP --> PRD
  INV --> PRD
  RCT --> INV
  RCT --> PRD
  INC --> RCP
  INC --> PDO
```

---

## Evaluación por dimensión

### Adherencia a Clean Architecture

| Aspecto | Estado | Notas |
|---|---|---|
| Módulos verticales por dominio | Cumple | 21 módulos bien delimitados |
| Capa `common/` transversal | Cumple | Guards, filters, pipes, interceptores |
| Interfaces de repositorio | Parcial | `BaseRepository` existe; algunos repositorios extienden `Repository<T>` directamente |
| Use cases explícitos | Parcial | Existe `src/application/product/use-cases/` pero no generalizado a todos los módulos |
| DDD base entities | Cumple | `src/common/ddd/base-entity.ts`, `domain-error.ts`, `use-case.ts` presentes |

### Patrones de diseño detectados

| Patrón | Ubicación | Evaluación |
|---|---|---|
| Repository Pattern | `**/repository/*.repository.ts` | Bien aplicado, separado de servicios |
| Service Layer | `**/service/*.service.ts` | Lógica de negocio aislada del controlador |
| Data Mapper (TypeORM) | Entidades con `@Entity()` | Sin Active Record, favorece testabilidad |
| Decorator pattern | `src/common/decorators/` | Decoradores `@RequirePermissions`, `@Public`, `@Resource` |
| Command/Factory | `src/application/pedido/pedido.factory.ts` | Presente aunque limitado a un módulo |
| CQRS | — | No implementado. Podría beneficiar al módulo de inventario de alta escritura |
| Event Sourcing | — | No aplica en el estado actual del sistema |

### Inversión de dependencias (DI)

NestJS provee DI nativo. Todos los servicios, repositorios y guards se inyectan correctamente. El uso de `@Inject(CACHE_MANAGER)` y `@InjectDataSource()` es correcto y testeable.

### Gestión de módulos circulares

No se detectaron `forwardRef()` problemáticos que indiquen dependencias circulares en el núcleo del sistema. El patrón `SherlockAuthModule` importado globalmente es el de mayor solapamiento pero está bien aislado.

---

## Deuda técnica arquitectural destacada

| Área | Deuda | Impacto | Esfuerzo para resolver |
|---|---|---|---|
| Use cases | Solo un módulo tiene use cases explícitos | Bajo (hoy), Alto (a escala) | Alto |
| CQRS | Escribir y leer del mismo servicio en InventarioService | Bajo–Medio | Alto |
| Event system | No hay eventos de dominio para notificar cambios cross-módulo | Bajo (hoy) | Alto |
| Rate limiting distribuido | Throttler en memoria, no escala a múltiples instancias | Medio si se escala horizontalmente | Medio |

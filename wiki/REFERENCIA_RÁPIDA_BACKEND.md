# SmartEconomat Backend - Guía de Referencia Rápida

## 🚀 Inicio Rápido

### Ubicación del Servidor
```bash
cd /home/psych/projects/SmartEconomat/backend/smart-economat-backend/
```

### Iniciar Servidor de Desarrollo
```bash
npm install
npm run start:dev
```

### Acceso a la API
- **API**: `http://localhost:3000/api/v1`
- **Documentación Swagger**: `http://localhost:3000/api/v1/docs`

---

## 📂 Mapa de Directorios

```
src/
├── main.ts                           # Punto de entrada
├── app.module.ts                     # Módulo raíz (importa los 20 módulos)
├── common/                           # INFRAESTRUCTURA COMPARTIDA (~2,472 LOC)
│   ├── decorators/                  # @Public, @RequirePermissions, @Normalize
│   ├── dto/                         # BaseDto, PaginationDto
│   ├── entities/                    # BaseEntity (UUID v7, borrado lógico)
│   ├── filters/                     # GlobalExceptionFilter
│   ├── helpers/                     # i18n, movimientos
│   ├── interceptors/                # TransformInterceptor
│   ├── pipes/                       # UUID v7, normalización
│   ├── transformers/                # Conversiones de tipos
│   └── utils/                       # Validación EAN-13
│
└── modules/                          # 20 MÓDULOS DE FUNCIONALIDADES (Cada uno con controller/service/entity/dto/repo)
    ├── admin/
    ├── albaran/
    ├── alumno/
    ├── archivo/
    ├── auth/
    ├── dashboard/
    ├── incidencia/
    ├── inventario/
    ├── movimiento/
    ├── pedido/
    ├── permisos/
    ├── plantillas-roles/
    ├── producto/          ⭐ El más complejo (4 sub-recursos)
    ├── profesor/
    ├── proveedor/        ✓ CRUD Simple
    ├── recepcion/
    ├── receta/
    ├── roles/
    ├── ubicacion/
    └── usuario/
```

---

## 🏗️ Estructura de Módulo (Patrón Estándar)

Cada módulo contiene:

```
nombre-del-modulo/
├── [nombre].module.ts                  # Declaración del módulo NestJS
├── controller/
│   ├── [entidad].controller.ts        # HTTP GET, POST, PUT, DELETE
│   └── [sub-entidad].controller.ts    # Sub-recursos (si hay)
├── service/
│   ├── [entidad].service.ts           # Lógica de negocio
│   └── [helper].service.ts           # Servicios de apoyo
├── entity/
│   ├── [entidad].entity.ts            # Entidad TypeORM (extiende BaseEntity)
│   └── [sub-entidad].entity.ts        # Entidades relacionadas
├── repository/
│   ├── [entidad].repository.ts        # Consultas personalizadas
│   └── [sub-entidad].repository.ts    # Sub-repositorios
├── dto/
│   ├── create-[entidad].dto.ts        # Payload POST
│   ├── update-[entidad].dto.ts        # Payload PUT/PATCH
│   ├── [entidad]-filter.dto.ts        # Consulta de búsqueda/filtro
│   └── [sub-carpeta]/                 # DTOs de sub-recursos
├── interfaces/
│   └── [entidad].interface.ts         # Contratos de TypeScript
├── enums/
│   └── [modulo].enums.ts             # Constantes del módulo
└── constants/
    └── es/
        └── [modulo]-messages.ts      # Traducciones al español
```

---

## 📋 Decoradores y Características Comunes

### Autenticación y Autorización

```typescript
@Public()                              // Omite autenticación (usar en controlador o método)
@RequirePermissions('read', 'write')   // RBAC - requiere TODOS los permisos
@RequireAnyPermission('read', 'admin') // RBAC - requiere CUALQUIER permiso
@Resource('producto')                  // Marca el recurso para auditoría
@ControllerPermissions(...)            // Permisos de endpoints en bloque
@Normalize()                           // Normalización de datos
```

### Pipes Personalizados

```typescript
// Usar en @Param, @Query, @Body
ParseUuidV7Pipe                    // Valida formato UUID v7
NormalizeDataPipe                  // Normaliza datos complejos
NormalizeStringPipe                // Trim y normaliza cadenas
I18nValidationPipe                 // Validación + i18n (aplicado globalmente)
```

---

## 🗄️ BaseEntity (Todas las Entidades la Extienden)

```typescript
export abstract class BaseEntity {
  @PrimaryColumn('uuid', { default: () => 'uuid_generate_v7()' })
  readonly id!: string;                    // UUID v7 (ordenado por tiempo)

  @CreateDateColumn({ type: 'timestamptz' })
  readonly createdAt!: Date;               // Auto-asignado al crear

  @UpdateDateColumn({ type: 'timestamptz' })
  readonly updatedAt!: Date;               // Auto-actualizado al guardar

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;                 // Marca de borrado lógico

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string | null;               // Usuario que eliminó

  @VersionColumn({ default: 1 })
  version!: number;                        // Bloqueo optimista
}
```

---

## 📊 Patrón de Servicio (CRUD Estándar)

### Métodos Comunes

Cada servicio típicamente tiene:

```typescript
async create(dto: CreateDto, userId: string): Promise<Entity>
async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Entity>>
async findOne(id: string): Promise<Entity>
async update(id: string, dto: UpdateDto, userId: string): Promise<Entity>
async remove(id: string, userId: string): Promise<void>
```

### Paginación

```typescript
// DTO de Consulta
class PaginationQueryDto {
  page?: number;      // Por defecto: 1
  limit?: number;     // Por defecto: 20, Máx: 100
  searchTerm?: string;
}

// Respuesta
class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 🔄 Formato de Respuesta (Estándar)

Cada respuesta de la API sigue este formato:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Producto",
    "createdAt": "2024-03-12T10:30:45.123Z",
    "updatedAt": "2024-03-12T10:30:45.123Z"
  },
  "meta": {
    "app": "SmartEconomat",
    "version": "1.0",
    "timestamp": "2024-03-12T10:30:45.123Z",
    "environment": "development",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 🛠️ Creación de un Nuevo Módulo

### Paso 1: Crear Estructura de Carpetas
```bash
mkdir -p src/modules/mimodulo/{controller,service,entity,repository,dto,interfaces,enums,constants/es}
```

### Paso 2: Crear Entidad
```typescript
// src/modules/mimodulo/entity/mimodulo.entity.ts
import { BaseEntity } from '../../../common/entities/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('my_modules')
export class MyModule extends BaseEntity {
  @Column()
  name!: string;
}
```

---

## 🧪 Llamadas de Ejemplo a la API

### Listado con Paginación
```bash
curl "http://localhost:3000/api/v1/proveedores?page=1&limit=20&searchTerm=Proveedor"
```

---

## 🌍 Internacionalización (i18n)

### Mensajes de Error
```typescript
// En el servicio, usar:
throw new NotFoundException(I18nHelper.getError('NOT_FOUND'));
throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
```

### Idiomas Soportados
- Español (es) - Por defecto
- Inglés (en)

---

## 🚦 Pruebas

### Ejecutar Pruebas
```bash
npm run test            # Pruebas unitarias
npm run test:watch     # Modo watch
npm run test:e2e       # Pruebas E2E
```

---

Para información detallada, consulte `/home/psych/projects/SmartEconomat/ESTRUCTURA_BACKEND.md`

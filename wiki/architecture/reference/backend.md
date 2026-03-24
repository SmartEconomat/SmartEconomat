# Estructura del Backend (NestJS + TypeORM)

Esta guía de referencia documenta la arquitectura técnica del servidor **SmartEconomat**, basado en NestJS, TypeORM y TypeScript, siguiendo un enfoque modular impulsado por el dominio (Domain-Driven Design simplificado).

## 1. Organización del Código Base

El backend se organiza en el directorio clave `src/`. Todo el código está configurado para transpilar usando SWC, enfocado en alto rendimiento durante desarrollo y producción.

```text
src/
├── main.ts                 # Bootstrap de la aplicación y config global (/api/v1)
├── app.module.ts           # Root Module que importa submódulos e infraestructura
├── app.controller.ts       # Route raíz de chequeos (health check)
├── app.service.ts          # Servicios raíz
├── common/                 # Componentes core transversales (~2500 LOC)
├── config/                 # Configuraciones centralizadas (DB, ennv, etc.)
├── i18n/                   # Diccionarios de internacionalización (ES / EN)
├── migrations/             # Archivos TypeORM generados para versionar la BBDD
├── modules/                # Módulos de dominio (20 funcionales)
└── seeders/                # Scripts para poblar BBDD con datos de catálogo y pruebas
```

---

## 2. Infraestructura Transversal (`src/common`)

El directorio `common/` encapsula contratos, adaptadores, extensiones de tipo y utilidades reutilizables.

### Componentes principales
- **decorators/**: Roles, permisos RBAC (`@Roles`, `@RequirePermissions`), y rutas públicas (`@Public`).
- **dto/**: Estandarización (`PaginatedResponseDto`, `PaginationQueryDto`). Globalmente utilizados para asegurar uniformidad.
- **entities/**: Destaca `BaseEntity`, preconfigurada con:
  - `id`: llave primaria UUID v7.
  - `version`: Soporte de *Optimistic Locking*.
  - `createdAt`, `updatedAt`, `deletedAt`, `deletedBy`: Trazabilidad y *Soft Delete*.
- **filters/**: `GlobalExceptionFilter` que normaliza errores genéricos y de Base de Datos para el frontend.
- **interceptors/**: Estandariza la salida exitosa envolviéndola en el atributo de respuesta esperado.
- **pipes/**: Validadores centralizados, ej. `ParseUUIDv7Pipe`.

---

## 3. Módulos de Dominio (`src/modules`)

Están registrados en `AppModule` (~20 funcionales, ej: Usuario, Pedido, Inventario, Producto). Cada módulo encapsula todo el ciclo de su recurso ("Bounded Context"):

### Estructura Estándar de Módulo
Cada carpeta en `modules/[dominio]/` está segregada claramente:

- `controller/`: Interfaz HTTP externa (Rutas, validación DTO, Swagger doc, control de roles).
- `dto/`: Input validation (`create`, `update`, `filter`) validados por `class-validator`.
- `service/`: Lógica de negocio y orquestación. Usa transacciones manuales `dataSource.transaction` si afecta múltiples entidades.
- `repository/`: Clase que extiende (o inyecta) el ORM TypeORM. Abstracción pura sobre SQL.
- `entity/`: Clases de persistencia mapeadas a tablas PostgreSQL.
- `enums/` & `constants/`: Claves localizadas o listas de valores acotadas al dominio.

---

## 4. Ciclo de Vida de la Petición (Request Lifecycle)

Cuando un cliente hace una petición HTTP, atraviesa este pipeline de forma estricta:

1. **Entrada y Prefijo**: Petición interceptada por `main.ts` en `/api/v1/...`.
2. **Guards (Seguridad)**: Se evalúan `JwtAuthGuard`, `RolesGuard` y `PermissionsGuard` (Verifican Token JWT y chequean los decoradores correspondientes).
3. **Pipes (Validación)**: `I18nValidationPipe` y utilidades como `ParseUUIDv7Pipe` sanean el input o lanzan `400 Bad Request` tipados con el diccionario i18n.
4. **Controladores**: Delegan inmediatamente los argumentos validados.
5. **Servicios (Aplicación)**: Se procesa negocio complejo, se llama a módulos auxiliares (`MovimientoHelper`) y se controla persistencia.
6. **Persistencia (TypeORM)**: Se usa QueryBuilder para reportes o Repositories sencillos para inserciones. TypeORM inyecta los `uuid_generate_v7()` si son CREATES.
7. **Interceptors / Exception Filter**: La salida devuelta se estandariza globalmente antes de ir por red, o se atrapan y normalizan excepciones fallidas (Error 500 o 404).

---

## 5. Capacidades Configuradas Out-of-the-Box

- **Internacionalización (i18n)**: Los errores de validación retornados a los clientes son resueltos basándose en encabezados `Accept-Language` o estáticos en español por defecto.
- **Integridad Física y Lógica**: 
  - Soporte de cascadas blandas.
  - El sistema depende activamente de *Soft Delete*, preservando coherencia de transacciones pasadas, como recepciones antiguas, aunque se haya borrado el proveedor o receta raíz.
- **Seguridad Dinámica**: Integración robusta Multi-Rol con RBAC Dinámico. Las plantillas de permisos (`ADMIN`, `PROFESOR`, `ALUMNO`) se combinan con excepciones puntuales por usuario (`usuario_permiso_adicional`).
- **Observabilidad**: Logger integrado de NestJS ampliado con captura per-request a través de un RequestId y soporte base de Sentry si las variables de entorno están activas.

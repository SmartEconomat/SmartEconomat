# Documentación de Arquitectura Backend (SmartEconomat)

Este documento detalla la arquitectura del servidor de `SmartEconomat`, construido con **NestJS**, siguiendo un enfoque modular, orientado a capas y optimizado para alto rendimiento con **SWC** y **UUID v7**.

## Estructura del Proyecto

El backend se organiza en módulos funcionales dentro de `src/modules/`:

```text
src/
├── common/             # Helpers, DTOs y utilidades compartidas.
│   ├── dto/            # PaginatedResponseDto, PaginationQueryDto.
│   └── helpers/        # I18nHelper, MovimientoHelper.
├── config/             # Configuraciones de TypeORM, i18n y variables de entorno.
├── database/           # Archivos relacionados con la base de datos.
├── i18n/               # Diccionarios de internacionalización (es, en).
├── migrations/         # Control de versiones de la base de datos (TypeORM).
├── modules/            # Módulos de negocio (Auth, Usuario, Producto, etc.).
│   └── [module_name]/
│       ├── controller/ # Manejo de peticiones HTTP y Swagger.
│       ├── service/    # Lógica de negocio y orquestación.
│       ├── repository/ # Consultas específicas y acceso a datos (TypeORM).
│       ├── dto/        # Objetos de transferencia de datos y validaciones.
│       ├── entity/     # Definición de tablas y relaciones (TypeORM).
│       └── [name].module.ts
├── seeders/            # Scripts para poblar la base de datos inicial.
├── main.ts             # Punto de entrada (Configuración de pipes, guards, Swagger).
└── app.module.ts       # Módulo raíz que importa todos los submódulos.
```

## Arquitectura de Capas

Seguimos una estructura de responsabilidades clara:

1.  **Controllers (Controladores):**
    *   Gestionan las rutas de la API.
    *   Validan los parámetros de entrada mediante DTOs y `ValidationPipe`.
    *   Documentan los endpoints con Swagger (`@ApiTags`, `@ApiOperation`).
    *   Aplican seguridad mediante `@UseGuards`.

2.  **Services (Servicios):**
    *   Contienen la lógica de negocio pura.
    *   Orquestan llamadas a múltiples repositorios o helpers.
    *   Lanzan excepciones controladas de NestJS (ej. `NotFoundException`).

3.  **Repositories (Repositorios):**
    *   Abstraen la interacción con la base de datos.
    *   Utilizan el patrón Repository de TypeORM para desacoplar la lógica de las consultas SQL.

4.  **Entities (Entidades):**
    *   Representan el esquema de la base de datos.
    *   Definen relaciones (ManyToMany, ManyToOne, OneToMany) y restricciones.

## Patrones Comunes

### Gestión de Stock y Movimientos
Contamos con un `MovimientoHelper` centralizado que asegura que cada acción que afecte al stock (compras, ajustes, consumos) genere un registro en la tabla de `Movimientos` para garantizar la trazabilidad total.

### Paginación Global
Utilizamos los DTOs `PaginationQueryDto` y `PaginatedResponseDto` de forma estandarizada en todos los listados (`findAll`) para mantener una interfaz API consistente.

### Internacionalización (i18n)
La mayoría de los mensajes de error y respuestas están centralizados en `i18n`, facilitando el cambio de idioma (actualmente configurado en Español como principal).

### Identificadores UUID v7
Todas las entidades del sistema utilizan **UUID v7** como llave primaria. A diferencia de v4, v7 es ordenable temporalmente, lo que optimiza drásticamente los índices de base de datos y permite una ordenación cronológica natural sin depender solo de `created_at`.

### Sistema de Permisos Dinámico (RBAC+)
Además de los roles estáticos (`ADMINISTRADOR`, `PROFESOR`, `ALUMNO`), el sistema permite:
- **Permisos Adicionales**: Conceder permisos específicos a un usuario concreto.
- **Permisos Excluidos**: Revocar permisos específicos a un usuario aunque su rol los incluya.
Esto se gestiona a través de las tablas `usuario_permiso_adicional` y `usuario_permiso_excluido`.

### Borrado Lógico (Soft Delete)
Implementado en la `BaseEntity`. Los registros no se borran físicamente (`DELETE`), sino que se marca la columna `deleted_at` y se registra el `deleted_by` para auditoría.

### Caché y Rendimiento
- **SWC**: Utilizado en desarrollo para una compilación ultra rápida.
- **Cache-Manager**: Integrado con Redis para cachear respuestas pesadas o datos de configuración frecuentes.

## Modelo actual de pedidos

El dominio de compras quedó separado en tres niveles para evitar ambigüedades funcionales:

### 1. `PedidoUsuario`
- Es el agregado de negocio que representa el pedido visible para el usuario.
- Mantiene el identificador técnico UUID v7 y además expone `numeroGlobal` como numeración incremental de negocio.
- Agrupa líneas de negocio (`PedidoUsuarioLinea`) y varios pedidos internos por proveedor.
- Sus estados son: `pendiente`, `en_proceso`, `entregado`, `cancelado`.

### 2. `Pedido`
- Ya no representa el pedido “completo” de cara a negocio.
- Ahora es el pedido interno operativo dirigido a un proveedor concreto.
- Puede vincularse opcionalmente a `pedidoUsuarioId` y a un `batchId` cuando entra en una compra consolidada.
- Sigue siendo la unidad que interactúa directamente con recepción, incidencias y movimientos de stock.

### 3. `PurchaseBatch`
- Pasa a representar exclusivamente una consolidación de compras.
- Agrupa pedidos internos ya existentes para gestionar compras semanales o administrativas.
- No sustituye a `PedidoUsuario` ni se utiliza ya como agregado principal de “Mis pedidos”.

### Sincronización entre capas
- `PedidoDraftService` finaliza borradores creando `PedidoUsuario`.
- `PedidoUsuarioService` descompone el agregado en varios `Pedido` internos usando `buildPedidoAggregate(...)`.
- `PedidoService.handleStatusTransition(...)` sigue recalculando el estado del pedido interno y, además, sincroniza el estado del `PurchaseBatch` y del `PedidoUsuario` asociado.
- `PdfReportService` y recepción permiten filtrar por `pedidoUsuarioId` para emitir documentos del agregado completo.

### Contratos backend relevantes
- `GET/POST/PATCH /pedido-usuarios`: agregado visible de negocio.
- `GET/POST/PATCH /purchase-batches` y `POST /purchase-batches/consolidate`: consolidación de compras.
- `GET/PATCH /pedidos`: pedido interno por proveedor.
- `PaginationQueryDto` se amplía con `usuarioId`, `fechaDesde`, `fechaHasta` y `sinLote` para reutilizar filtros en varios módulos.

## Seguridad

*   **Autenticación:** Basada en **JWT (JSON Web Tokens)**.
*   **Autorización:** Guardias personalizados (`RolesGuard`) que verifican el rol del usuario (`ADMINISTRADOR`, `PROFESOR`, `ALUMNO`) contra los decoradores `@Roles` definidos en los controladores.

---
*Este documento refleja la estructura técnica del backend y debe actualizarse ante cambios estructurales significativos.*

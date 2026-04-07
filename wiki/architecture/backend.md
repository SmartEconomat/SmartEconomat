# Documentación de Arquitectura Backend (SmartEconomat)

Este documento detalla la arquitectura del servidor de `SmartEconomat`, construido con **NestJS**, siguiendo un enfoque modular, orientado a capas y optimizado para alto rendimiento con **SWC** y **UUID v7**.

## Resumen estructural actual

El backend expone una API pública bajo `/api/v1` y organiza su dominio en 27 carpetas de módulo dentro de `src/modules`, con 36 controladores HTTP visibles en `src/modules/**/controller/*.ts`.

Los dominios principales son:

- seguridad y administración: `auth`, `sherlock-auth`, `usuario`, `roles`, `permisos`, `plantillas-roles`, `admin`, `dashboard`;
- catálogo y stock: `producto`, `proveedor`, `inventario`, `movimiento`, `merma`, `ubicacion`, `openfoodfacts`;
- compras y recepción: `pedido`, `pedido-draft`, `recepcion`, `recepcion-draft`, `incidencia`, `albaran`, `distribucion`;
- producción: `receta`, `preparacion`;
- educativo y soporte: `profesor`, `alumno`, `archivo`, `export`.

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
├── modules/            # Módulos de negocio y soporte expuestos por dominio.
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

## Organización del dominio

### Seguridad y administración

- `auth`: login, logout, recuperación y cambio de contraseña.
- `sherlock-auth`: resolución de permisos efectivos y piezas compartidas de autenticación.
- `usuario`: perfil, CRUD de usuarios y permisos por usuario.
- `roles`, `permisos`, `plantillas-roles`: gobierno del RBAC.
- `admin` y `dashboard`: operaciones privilegiadas y KPIs.

### Catálogo y stock

- `producto`: producto maestro, producto-proveedor, alérgenos e histórico de precios.
- `proveedor`: proveedores.
- `inventario`, `movimiento`, `merma`, `ubicacion`: stock, trazabilidad y localización.
- `openfoodfacts`: integración de catálogo externo.

### Compras, recepción e incidencias

- `pedido`: pedidos internos, `PedidoUsuario` y `PurchaseBatch`.
- `pedido-draft`: borradores de pedido.
- `recepcion` y `recepcion-draft`: recepción operativa y borradores.
- `incidencia`: discrepancias y resolución.
- `albaran`: documentación de entrega.
- `distribucion`: preparación y confirmación de distribuciones.

### Producción

- `receta`: recetas y producción.
- `preparacion`: preparación operativa.

### Educativo y soporte

- `profesor` y `alumno`: dominio educativo.
- `archivo`: gestión de ficheros.
- `export`: exportaciones PDF y XLSX.

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

El acceso HTTP no se limita a un `RolesGuard` clásico. El backend combina autenticación JWT, guards de permisos y resolución dinámica de capacidades efectivas.

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
- Usa `EstadoPedido`; en la agregación de negocio se muestran estados `pendiente_de_aprobacion`, `por_recepcionar`, `recepcionado` y `cancelado`.

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

*   **Autenticación:** Basada en **JWT (JSON Web Tokens)** y en el uso de cookie `access_token` para el flujo web principal.
*   **Autorización:** Se apoya en guards como `JwtAuthGuard` y `PermisosGuard`, además de decoradores de permisos para control fino por acción.
*   **Rate limiting:** El backend trabaja con perfiles `auth`, `write` y `read` mediante `ThrottlerModule`.

## Relación con la documentación de referencia

- Contrato API: `wiki/reference/api/README.md`
- Mapa de endpoints: `wiki/reference/endpoints.md`
- Módulos y responsabilidades: `wiki/reference/modulos-y-responsabilidades.md`
- Cobertura pendiente: `wiki/planning/improvements/auditoria-documentacion-backend-api.md`

---
*Este documento refleja la estructura técnica del backend y debe actualizarse ante cambios estructurales significativos.*

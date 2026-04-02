# Reference: Endpoints del backend

Base URL: `http://localhost:3000/api/v1`
Autenticación principal: JWT (Bearer) y cookie `access_token`.

## Convenciones de respuesta
- `200 OK`: consulta/operación correcta
- `201 Created`: alta creada
- `204 No Content`: borrado lógico completado
- `400 Bad Request`: DTO inválido
- `401 Unauthorized`: token ausente/incorrecto
- `403 Forbidden`: rol o permiso insuficiente
- `404 Not Found`: recurso inexistente
- `409 Conflict`: conflicto de integridad/negocio

## Catálogo de controllers y rutas

| Controller | Base path | Métodos detectados |
|---|---|---|
| AuthController | `/auth` | `POST /register`, `POST /login`, `POST /logout`, `GET /profile`, `PATCH /change-password`, `POST /forgot-password`, `POST /reset-password` |
| UsuarioController | `/usuarios` | CRUD + perfil + password + rol + permisos adicionales/excluidos |
| PedidoController | `/pedidos` | CRUD + `POST /from-recipes` + `PATCH /:id/fecha-entrega` + `PATCH /:id/cancelar` + `PATCH /:id/aceptar` |
| PedidoUsuarioController | `/pedido-usuarios` | Listar agregados + detalle + aceptar/cancelar/restaurar + PDF + DELETE |
| PurchaseBatchController | `/purchase-batches` | CRUD de lotes de compra |
| PedidoDraftController | `/pedido/draft` | `POST`, `GET`, `DELETE` |
| RecepcionController | `/recepciones` | CRUD + `GET /reporte-pdf` |
| RecepcionProductoController | `/recepcion-productos` | CRUD |
| RecepcionDraftController | `/recepcion/draft` | `POST`, `GET`, `DELETE` |
| ProductoController | `/productos` | CRUD + `GET /generar-ean13` |
| ProductoProveedorController | `/producto-proveedor` | CRUD de relación producto-proveedor |
| ProductoAlergenoController | `/producto-alergenos` | CRUD de alérgenos por producto |
| HistorialPrecioController | `/historial-precio` | CRUD de históricos de precio |
| ProveedorController | `/proveedor` | CRUD |
| InventarioController | `/inventario` | CRUD + `GET /stock` + `POST /ajustes-manuales` |
| DistribucionController | `/distribuciones` | Listar distribuibles + CRUD de distribuciones + confirmar/cancelar |
| AlertaController | `/alertas` | endpoints de alertas de inventario |
| MovimientoController | `/movimientos` | CRUD/listados de movimientos |
| MermaController | `/merma` | CRUD + estadísticas |
| RecetaController | `/recetas` | CRUD + duplicado + detalle + escandallo + PDF + recalcular costes + cocinar |
| ProduccionController | `/produccion` | ejecutar, validar, listar, consumir lote, detalle |
| PreparacionController | `/preparaciones` | endpoints operativos de preparación |
| AlbaranController | `/albaranes` | gestión de albaranes y vínculos con recepción/pedido |
| IncidenciaController | `/incidencias` | CRUD/incidencias |
| IncidenciaResueltaController | `/incidencias-resueltas` | gestión de incidencias resueltas |
| ArchivoController | `/archivos` | subida/consulta/descarga de archivos |
| ProfesorController | `/profesores` | gestión de profesorado y slots de alumnos |
| AlumnoController | `/alumnos` | CRUD de alumno y operaciones relacionadas |
| AdminController | `/admin` | operaciones administrativas centralizadas |
| DashboardController | `/dashboard` | KPIs y agregados |
| ExportController | `/export` | exportaciones en distintos formatos |
| UbicacionController | `/ubicacion` | CRUD + restore |

## Endpoints detallados por módulo clave

### Auth
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/auth/register` | `RegisterUserDto` | usuario + token | 201 |
| POST | `/auth/login` | `LoginUserDto` | token + cookie + usuario | 200 |
| POST | `/auth/logout` | - | mensaje | 200 |
| GET | `/auth/profile` | - | perfil autenticado | 200 |
| PATCH | `/auth/change-password` | `ChangePasswordDto` | mensaje | 200 |
| POST | `/auth/forgot-password` | `{ email }` | mensaje | 200 |
| POST | `/auth/reset-password` | `ResetPasswordDto` | mensaje | 200 |

### Usuarios
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/usuarios` | `CreateUsuarioDto` | usuario | 201 |
| POST | `/usuarios/admin` | `AdminCreateUsuarioDto` | usuario | 201 |
| GET | `/usuarios` | `PaginationQueryDto` | `PaginatedResponseDto<Usuario>` | 200 |
| GET | `/usuarios/minimos` | - | listado reducido | 200 |
| GET | `/usuarios/:id` | - | usuario | 200 |
| GET | `/usuarios/perfil` | - | usuario + permisos | 200 |
| PATCH | `/usuarios/:id` | `UpdateUsuarioDto` | usuario | 200 |
| PATCH | `/usuarios/:id/admin` | `AdminUpdateUsuarioDto` | usuario | 200 |
| PATCH | `/usuarios/:id/password` | `ResetPasswordDto` | usuario actualizado | 200 |
| DELETE | `/usuarios/:id` | - | - | 204 |

### Productos
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| GET | `/productos/generar-ean13` | - | `{ codigo_barras }` | 200 |
| POST | `/productos` | `CreateProductoDto` | `Producto` | 201 |
| GET | `/productos` | `ProductFilterDto` | `PaginatedResponseDto<Producto>` | 200 |
| GET | `/productos/:id` | - | `Producto` | 200 |
| PATCH | `/productos/:id` | `UpdateProductoDto` | `Producto` | 200 |
| DELETE | `/productos/:id` | - | - | 204 |

### Pedidos
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/pedidos` | `CreatePedidoDto` | `Pedido` | 201 |
| GET | `/pedidos` | `PaginationQueryDto` | `PaginatedResponseDto<Pedido>` | 200 |
| POST | `/pedidos/from-recipes` | `GeneratePedidoFromRecetasDto` | `Pedido` | 201 |
| GET | `/pedidos/:id` | - | `Pedido` | 200 |
| PATCH | `/pedidos/:id` | `UpdatePedidoDto` | `Pedido` | 200 |
| PATCH | `/pedidos/:id/cancelar` | `CancelPedidoDto` | `Pedido` | 200 |
| PATCH | `/pedidos/:id/aceptar` | - | `Pedido` | 200 |
| DELETE | `/pedidos/:id` | - | - | 204 |

### Pedido Usuarios
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/pedido-usuarios` | `CreatePedidoUsuarioDto` | `PedidoUsuario` | 201 |
| GET | `/pedido-usuarios` | `PaginationQueryDto` | `PaginatedResponseDto<PedidoUsuario>` | 200 |
| GET | `/pedido-usuarios/:id` | - | `PedidoUsuario` | 200 |
| PATCH | `/pedido-usuarios/:id` | `UpdatePedidoUsuarioDto` | `PedidoUsuario` | 200 |
| PATCH | `/pedido-usuarios/:id/aceptar` | - | `PedidoUsuario` | 200 |
| PATCH | `/pedido-usuarios/:id/cancelar` | - | `PedidoUsuario` | 200 |
| PATCH | `/pedido-usuarios/:id/restaurar` | - | `PedidoUsuario` | 200 |
| GET | `/pedido-usuarios/:id/pdf` | - | stream PDF | 200 |
| DELETE | `/pedido-usuarios/:id` | - | - | 204 |

### Recepciones
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/recepciones` | `CreateRecepcionDto` | `RecepcionResultadoDto` | 201 |
| GET | `/recepciones` | `PaginationQueryDto` | `PaginatedResponseDto<Recepcion>` | 200 |
| GET | `/recepciones/reporte-pdf` | `RecepcionReportePdfDto` (query) | stream PDF | 200 |
| GET | `/recepciones/:id` | - | `Recepcion` | 200 |
| PATCH | `/recepciones/:id` | `UpdateRecepcionDto` | `Recepcion` | 200 |
| DELETE | `/recepciones/:id` | - | - | 204 |

### Inventario
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| POST | `/inventario` | `CreateInventarioItemDto` | `Inventario` | 201 |
| GET | `/inventario` | `PaginationQueryDto` | `PaginatedResponseDto<Inventario>` | 200 |
| GET | `/inventario/stock` | `InventoryQueryDto` (query) | stock por ubicación/consolidado | 200 |
| POST | `/inventario/ajustes-manuales` | `CreateMovimientoManualDto` | `Inventario` actualizado | 201 |
| GET | `/inventario/:id` | - | `Inventario` | 200 |
| PATCH | `/inventario/:id` | `UpdateInventarioDto` | `Inventario` | 200 |
| DELETE | `/inventario/:id` | - | - | 204 |

### Distribuciones
| Método | Ruta | DTO input | DTO output/response | Status |
|---|---|---|---|---|
| GET | `/distribuciones` | `PaginationQueryDto` | `PaginatedResponseDto<Distribucion>` | 200 |
| GET | `/distribuciones/disponibles` | `PaginationQueryDto` | `DistribucionDisponibleDto[]` | 200 |
| GET | `/distribuciones/:id` | - | `Distribucion` | 200 |
| POST | `/distribuciones` | `CreateDistribucionDto` | `Distribucion` | 201 |
| PATCH | `/distribuciones/:id/confirmar` | - | `Distribucion` | 200 |
| PATCH | `/distribuciones/:id/cancelar` | `CancelDistribucionDto` | `Distribucion` | 200 |

## Ejemplos cURL

### Login
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Crear producto
```bash
curl -X POST "http://localhost:3000/api/v1/productos" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Leche semidesnatada","codigoBarras":"1234567890123","tipo":"ALIMENTO"}'
```

### Listar inventario paginado
```bash
curl -X GET "http://localhost:3000/api/v1/inventario?page=1&limit=20&sortBy=createdAt&sortOrder=DESC" \
  -H "Authorization: Bearer <JWT>"
```

### Crear pedido desde recetas
```bash
curl -X POST "http://localhost:3000/api/v1/pedidos/from-recipes" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"recetas":[{"recetaId":"<uuid>","raciones":30}]}'
```

### Descargar PDF de recepciones
```bash
curl -X GET "http://localhost:3000/api/v1/recepciones/reporte-pdf?fechaInicio=2026-01-01&fechaFin=2026-01-31" \
  -H "Authorization: Bearer <JWT>" \
  --output reporte-recepcion.pdf
```

## Notas de seguridad por endpoint
- Rutas de `auth/register`, `auth/login`, `auth/forgot-password`, `auth/reset-password` son públicas.
- El resto se protege con `JwtAuthGuard` y, según controlador, `RolesGuard` y/o `PermisosGuard`.
- Los permisos se asignan por `@RequirePermissions('modulo:accion')`.

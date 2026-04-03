# Referencia de API

Esta es la referencia canónica de integración del backend SmartEconomat. Su función es fijar las convenciones estables del sistema; para el detalle exhaustivo de DTOs y esquemas debe usarse Swagger local o la colección Postman del repositorio.

## Base URL y documentación

- Prefijo global: `/api/v1`
- Desarrollo local: `http://localhost:3000/api/v1`
- Swagger local: `http://localhost:3000/docs`
- Producción: el `nginx.conf` actual solo publica `/api/`; Swagger no queda expuesto externamente por defecto.

## Autenticación y sesión

### Modelo actual

- El backend acepta JWT por cookie `access_token` y por `Authorization: Bearer <token>`.
- La cookie de sesión se establece en `POST /auth/login` y se limpia en `POST /auth/logout`.
- La cookie es `httpOnly`, `sameSite=strict` y `secure` solo en producción.
- El frontend trabaja en modo cookie-first y realiza las peticiones con `credentials: 'include'`.

### Endpoints clave de sesión

| Método | Ruta | Uso real |
| --- | --- | --- |
| `POST` | `/auth/login` | Inicio de sesión. El body usa `{ email, password }`; el campo `email` acepta email o username. |
| `POST` | `/auth/logout` | Limpia la cookie de sesión. |
| `GET` | `/auth/profile` | Devuelve el payload autenticado básico del JWT. |
| `GET` | `/usuarios/perfil` | Fuente canónica de sesión para el frontend; devuelve usuario completo y permisos resueltos. |
| `PATCH` | `/auth/change-password` | Cambio de contraseña del usuario autenticado. |
| `PATCH` | `/usuarios/perfil/password` | Cambio de contraseña desde el módulo de usuarios. |
| `POST` | `/auth/forgot-password` | Inicia la recuperación de contraseña por email. |
| `POST` | `/auth/reset-password` | Aplica un token de recuperación y define la nueva contraseña. |

### Registro

- `POST /auth/register` crea un usuario general y devuelve el token en el body, pero no establece cookie.
- `POST /alumnos/register` y `POST /profesores/register` cubren el registro público del sistema educativo.
- El inicio de sesión posterior debe hacerse siempre mediante `POST /auth/login`.

## Convenciones de integración

- A nivel HTTP, el frontend consume la API como un envelope estándar `{ success, message, data }`.
- Lo que cambia entre endpoints es la forma interna de `data`: puede ser una entidad, un wrapper paginado o un objeto de mensaje.
- Los identificadores de dominio son UUID.
- Las fechas se intercambian en formato ISO 8601.
- Los enums se envían como strings con los valores definidos por el backend.
- Muchos listados comparten `page`, `limit`, `sortBy`, `order` y filtros específicos por módulo.
- Los códigos de error más frecuentes son `400`, `401`, `403`, `404` y `409`.

## Familias de recursos

# Referencia de API

Referencia canónica de los endpoints expuestos actualmente por el backend de SmartEconomat. Este documento se ha reconstruido a partir del Swagger vivo disponible en `http://localhost:3000/docs` y refleja el contrato publicado por la aplicación en ejecución.

## Base URL y fuentes

- Prefijo global: `/api/v1`
- Base local: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`
- Swagger JSON: `http://localhost:3000/docs-json`
- Paths publicados: 156
- Operaciones publicadas: 219

## Cómo leer esta referencia

- `Auth`: `si` indica que Swagger declara `security` para la operación; `no` indica endpoint público o no marcado en el contrato.
- `Params`: parámetros de ruta con su tipo OpenAPI.
- `Query`: query params con `*` cuando Swagger los marca como obligatorios.
- `Body`: media type y schema principal del request body.
- `Respuestas`: códigos HTTP y schema declarado; `sin schema` significa que Swagger no publica un esquema concreto para esa respuesta.

## Resumen por dominio

| Dominio Swagger | Operaciones |
| --- | --- |
| Admin | 6 |
| Albaranes | 7 |
| Alerta | 2 |
| Alumno | 6 |
| App | 1 |
| Archivos | 5 |
| Auth | 7 |
| Dashboard | 1 |
| Export | 17 |
| HistorialPrecio | 5 |
| IncidenciaResuela | 5 |
| incidencias | 8 |
| Inventario | 7 |
| Merma | 4 |
| movimientos | 6 |
| OpenFoodFacts | 2 |
| Pedido | 9 |
| Pedido Draft | 4 |
| PedidoUsuario | 9 |
| Preparacion | 7 |
| Producción | 5 |
| Producto Alérgenos | 5 |
| Producto Proveedor | 5 |
| Productos | 8 |
| Profesor | 13 |
| Proveedor | 5 |
| PurchaseBatch | 10 |
| Recepcion | 6 |
| Recepcion Draft | 3 |
| RecepcionProducto | 5 |
| Recetas | 12 |
| Ubicaciones | 6 |
| Usuario | 18 |

## Inventario exhaustivo de endpoints

### Admin (6)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/admin/permissions | no | AdminController_getPermissions | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/admin/profesores | no | AdminController_createProfesor | n/a | n/a | application/json:CreateProfesorDto | 201:sin schema |
| GET | /api/v1/admin/roles | no | AdminController_getRoles | n/a | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/admin/users/{id}/activate | no | AdminController_activateUser | id:string | n/a | application/json:UpdateAdminUserActivationDto | 200:sin schema |
| POST | /api/v1/admin/users/{id}/force-reset | no | AdminController_forcePasswordReset | id:string | n/a | n/a | 201:sin schema |
| PATCH | /api/v1/admin/users/{id}/role | no | AdminController_updateUserRole | id:string | n/a | application/json:UpdateAdminUserRoleDto | 200:sin schema |

### Albaranes (7)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/albaranes | si | AlbaranController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/albaranes | si | AlbaranController_create | n/a | n/a | application/json:CreateAlbaranDto | 201:sin schema |
| GET | /api/v1/albaranes/{id} | si | AlbaranController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/albaranes/{id} | si | AlbaranController_update | id:string | n/a | application/json:UpdateAlbaranDto | 200:sin schema |
| DELETE | /api/v1/albaranes/{id} | si | AlbaranController_remove | id:string | n/a | n/a | 204:sin schema |
| GET | /api/v1/albaranes/documento/{filename} | si | Obtener documento de albarán | filename:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/albaranes/upload-documento | si | Subir documento de albarán | n/a | n/a | multipart/form-data:object | 201:sin schema, 400:sin schema, 404:sin schema, 409:sin schema |

### Alerta (2)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/alertas/caducidad | no | AlertaController_alertasCaducidad | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/alertas/stock | no | AlertaController_alertasStock | n/a | n/a | n/a | 200:sin schema |

### Alumno (6)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/alumnos/aulas | no | AlumnoController_getAulas | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/alumnos/aulas/{aula}/clases | no | AlumnoController_getClasesByAula | aula:string | n/a | n/a | 200:sin schema |
| GET | /api/v1/alumnos/aulas/{aula}/clases/{clase}/profesores | no | AlumnoController_getProfesoresBySlot | aula:string, clase:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/alumnos/change-profesor | no | AlumnoController_changeProfesor | n/a | n/a | application/json:ChangeProfesorDto | 200:sin schema |
| POST | /api/v1/alumnos/register | no | AlumnoController_register | n/a | n/a | application/json:RegisterAlumnoDto | 201:sin schema |
| GET | /api/v1/alumnos/slots/{codigoClase} | no | AlumnoController_getSlotByCode | codigoClase:string | n/a | n/a | 200:sin schema |

### App (1)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1 | no | AppController_getHello | n/a | n/a | n/a | 200:sin schema |

### Archivos (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/archivos | si | Listar archivos | n/a | usuarioId:string, mimeType:string | n/a | 200:sin schema |
| GET | /api/v1/archivos/{id} | si | Obtener metadata de un archivo por ID | id:string | n/a | n/a | 200:sin schema |
| DELETE | /api/v1/archivos/{id} | si | Eliminar un archivo (soft-delete) | id:string | n/a | n/a | 204:sin schema |
| GET | /api/v1/archivos/content/{filename} | si | Servir el contenido de un archivo subido | filename:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/archivos/upload | si | Subir un nuevo archivo | n/a | n/a | multipart/form-data:object | 201:sin schema |

### Auth (7)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PATCH | /api/v1/auth/change-password | no | AuthController_changePassword | n/a | n/a | application/json:ChangePasswordDto | 200:sin schema |
| POST | /api/v1/auth/forgot-password | no | AuthController_forgotPassword | n/a | n/a | application/json:ForgotPasswordDto | 200:sin schema |
| POST | /api/v1/auth/login | no | AuthController_login | n/a | n/a | application/json:LoginUserDto | 200:sin schema |
| POST | /api/v1/auth/logout | no | AuthController_logout | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/auth/profile | no | AuthController_getProfile | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/auth/register | no | AuthController_register | n/a | n/a | application/json:RegisterUserDto | 201:sin schema |
| POST | /api/v1/auth/reset-password | no | AuthController_resetPassword | n/a | n/a | application/json:ResetPasswordDto | 200:sin schema |

### Dashboard (1)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/dashboard/stats | si | Get dashboard statistics (KPIs) | n/a | n/a | n/a | 200:DashboardStatsDto |

### Export (17)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/export/albaranes/pdf | no | ExportController_exportAlbaranesPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/albaranes/xlsx | no | ExportController_exportAlbaranes | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/incidencias/xlsx | no | ExportController_exportIncidencias | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/inventario/pdf | no | ExportController_exportInventarioPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/inventario/xlsx | no | ExportController_exportInventario | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/movimientos/xlsx | no | ExportController_exportMovimientos | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/pedidos/pdf | no | ExportController_exportPedidosPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/pedidos/xlsx | no | ExportController_exportPedidos | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/productos/pdf | no | ExportController_exportProductosPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/productos/xlsx | no | ExportController_exportProductos | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/proveedores/pdf | no | ExportController_exportProveedoresPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/proveedores/xlsx | no | ExportController_exportProveedores | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/recepciones/xlsx | no | ExportController_exportRecepciones | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/recetas/pdf | no | ExportController_exportRecetasPdf | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/recetas/xlsx | no | ExportController_exportRecetas | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/ubicaciones/xlsx | no | ExportController_exportUbicaciones | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/export/usuarios/xlsx | no | ExportController_exportUsuarios | n/a | n/a | n/a | 200:sin schema |

### HistorialPrecio (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/historial-precio | no | HistorialPrecioController_findAll | n/a | order:enum(ASC, DESC) | n/a | 200:sin schema |
| POST | /api/v1/historial-precio | no | HistorialPrecioController_create | n/a | n/a | application/json:CreateHistorialPrecioDto | 201:sin schema |
| GET | /api/v1/historial-precio/{id} | no | HistorialPrecioController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/historial-precio/{id} | no | HistorialPrecioController_update | id:string | n/a | application/json:UpdateHistorialPrecioDto | 200:sin schema |
| DELETE | /api/v1/historial-precio/{id} | no | HistorialPrecioController_remove | id:string | n/a | n/a | 204:sin schema |

### IncidenciaResuela (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/incidencias-resueltas | no | IncidenciaResuelaController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/incidencias-resueltas | no | IncidenciaResuelaController_create | n/a | n/a | application/json:CreateIncidenciaResuelaDto | 201:sin schema |
| GET | /api/v1/incidencias-resueltas/{id} | no | IncidenciaResuelaController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/incidencias-resueltas/{id} | no | IncidenciaResuelaController_update | id:string | n/a | application/json:UpdateIncidenciaResuelaDto | 200:sin schema |
| DELETE | /api/v1/incidencias-resueltas/{id} | no | IncidenciaResuelaController_remove | id:string | n/a | n/a | 204:sin schema |

### incidencias (8)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/incidencias | no | IncidenciaController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/incidencias | no | IncidenciaController_create | n/a | n/a | application/json:CreateIncidenciaDto | 201:sin schema |
| GET | /api/v1/incidencias/{id} | no | IncidenciaController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/incidencias/{id} | no | IncidenciaController_update | id:string | n/a | application/json:UpdateIncidenciaDto | 200:sin schema |
| DELETE | /api/v1/incidencias/{id} | no | IncidenciaController_remove | id:string | n/a | n/a | 204:sin schema |
| POST | /api/v1/incidencias/{id}/resolver | no | Resuelve una incidencia de forma transaccional | id:string | n/a | application/json:ResolveIncidenciaDto | 201:sin schema |
| PATCH | /api/v1/incidencias/{id}/resolver | no | IncidenciaController_resolver | id:string | n/a | application/json:ResolverIncidenciaDto | 200:sin schema |
| POST | /api/v1/incidencias/reportar | no | Reporta una nueva incidencia vinculada a una recepción | n/a | n/a | application/json:ReportIncidenciaDto | 201:sin schema |

### Inventario (7)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/inventario | no | InventarioController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/inventario | no | InventarioController_create | n/a | n/a | application/json:CreateInventarioItemDto | 201:sin schema |
| GET | /api/v1/inventario/{id} | no | InventarioController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/inventario/{id} | no | InventarioController_update | id:string | n/a | application/json:UpdateInventarioDto | 200:sin schema |
| DELETE | /api/v1/inventario/{id} | no | InventarioController_remove | id:string | n/a | n/a | 204:sin schema |
| POST | /api/v1/inventario/ajustes-manuales | no | Registrar un ajuste manual de stock con auditoría | n/a | n/a | application/json:CreateMovimientoManualDto | 201:Inventario, 400:sin schema, 404:sin schema, 409:sin schema |
| GET | /api/v1/inventario/stock | no | InventarioController_queryStock | n/a | n/a | n/a | 200:sin schema |

### Merma (4)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/merma | no | Listar todas las mermas con paginación | n/a | n/a | n/a | 200:Array<Merma> |
| POST | /api/v1/merma | no | Registrar una merma y descontar stock del inventario | n/a | n/a | application/json:CreateMermaDto | 201:Merma, 400:sin schema, 404:sin schema |
| GET | /api/v1/merma/{id} | no | Obtener una merma por ID | id:string | n/a | n/a | 200:Merma, 404:sin schema |
| GET | /api/v1/merma/stats | no | Obtener estadísticas de merma por motivo y producto | n/a | n/a | n/a | 200:sin schema |

### movimientos (6)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/movimientos | no | Listar todos los movimientos | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/movimientos | no | Crear un nuevo movimiento | n/a | n/a | application/json:CreateMovimientoDto | 201:sin schema, 400:sin schema, 403:sin schema |
| GET | /api/v1/movimientos/{id} | no | Obtener un movimiento por ID | id:string | n/a | n/a | 200:sin schema, 404:sin schema |
| PATCH | /api/v1/movimientos/{id} | no | Actualizar un movimiento | id:string | n/a | application/json:UpdateMovimientoDto | 200:sin schema, 400:sin schema, 403:sin schema, 404:sin schema |
| DELETE | /api/v1/movimientos/{id} | no | Eliminar un movimiento (soft delete) | id:string | n/a | n/a | 204:sin schema, 403:sin schema, 404:sin schema |
| GET | /api/v1/movimientos/historial | no | Obtener historial de movimientos (Trazabilidad) | n/a | sortOrder:enum(ASC, DESC), sortBy:enum(createdAt, cantidad), endDate:string, startDate:string, type:enum(entrada, salida, ajuste, pedido, entrada_compra), userId:string, entityId:string | n/a | 200:sin schema, 400:sin schema, 403:sin schema, 404:sin schema |

### OpenFoodFacts (2)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/openfoodfacts/buscar | no | Buscar productos en OpenFoodFacts por nombre | n/a | nombre:string | n/a | 200:Array<OffProductResponseDto> |
| GET | /api/v1/openfoodfacts/producto/{codigoBarras} | no | Buscar un producto en OpenFoodFacts por código de barras | codigoBarras:string | n/a | n/a | 200:OffProductResponseDto |

### Pedido (9)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/pedidos | no | PedidoController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/pedidos | no | PedidoController_create | n/a | n/a | application/json:CreatePedidoDto | 201:sin schema |
| GET | /api/v1/pedidos/{id} | no | PedidoController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/pedidos/{id} | no | PedidoController_update | id:string | n/a | application/json:UpdatePedidoDto | 200:sin schema |
| DELETE | /api/v1/pedidos/{id} | no | PedidoController_remove | id:string | n/a | n/a | 204:sin schema |
| PATCH | /api/v1/pedidos/{id}/aceptar | no | PedidoController_aceptarPedido | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/pedidos/{id}/cancelar | no | PedidoController_cancelarPedido | id:string | n/a | application/json:CancelPedidoDto | 200:sin schema |
| PATCH | /api/v1/pedidos/{id}/fecha-entrega | no | PedidoController_updateFechaEntrega | id:string | n/a | application/json:UpdatePedidoDto | 200:sin schema |
| POST | /api/v1/pedidos/from-recipes | no | PedidoController_createFromRecipes | n/a | n/a | application/json:GeneratePedidoFromRecetasDto | 201:sin schema |

### Pedido Draft (4)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/pedido/draft | no | Recuperar el borrador de creación de pedido más reciente | n/a | n/a | n/a | 200:PedidoDraftResponseDto |
| POST | /api/v1/pedido/draft | no | Crear o actualizar el borrador seguro de creación de pedido | n/a | n/a | application/json:UpsertPedidoDraftDto | 200:PedidoDraftResponseDto |
| DELETE | /api/v1/pedido/draft | no | Eliminar el borrador activo de creación de pedido | n/a | n/a | n/a | 204:sin schema |
| POST | /api/v1/pedido/draft/finalize | no | Finalizar la creación del pedido a partir del borrador persistido | n/a | n/a | n/a | 200:PedidoUsuario |

### PedidoUsuario (9)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/pedido-usuarios | no | PedidoUsuarioController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/pedido-usuarios | no | PedidoUsuarioController_create | n/a | n/a | application/json:CreatePedidoUsuarioDto | 201:sin schema |
| GET | /api/v1/pedido-usuarios/{id} | no | PedidoUsuarioController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/pedido-usuarios/{id} | no | PedidoUsuarioController_update | id:string | n/a | application/json:UpdatePedidoUsuarioDto | 200:sin schema |
| PATCH | /api/v1/pedido-usuarios/{id}/aceptar | no | PedidoUsuarioController_accept | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/pedido-usuarios/{id}/cancelar | no | PedidoUsuarioController_cancel | id:string | n/a | application/json:CancelPedidoUsuarioDto | 200:sin schema |
| GET | /api/v1/pedido-usuarios/{id}/pdf | no | PedidoUsuarioController_generatePdf | id:string | incluirCancelados:string, paginaPorProveedor:string | n/a | 200:sin schema |
| POST | /api/v1/pedido-usuarios/from-missing-stock | no | PedidoUsuarioController_createFromMissingStock | n/a | n/a | application/json:CreateMissingStockBatchDto | 201:sin schema |
| POST | /api/v1/pedido-usuarios/from-recipes | no | PedidoUsuarioController_createFromRecipes | n/a | n/a | application/json:GeneratePedidoFromRecetasDto | 201:sin schema |

### Preparacion (7)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/preparaciones | no | PreparacionController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/preparaciones | no | PreparacionController_create | n/a | n/a | application/json:CreatePreparacionDto | 201:sin schema |
| GET | /api/v1/preparaciones/{id} | no | PreparacionController_findOne | id:string | n/a | n/a | 200:sin schema |
| DELETE | /api/v1/preparaciones/{id} | no | PreparacionController_remove | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/preparaciones/{id}/cancelar | no | PreparacionController_cancelar | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/preparaciones/{id}/finalizar | no | PreparacionController_finalizar | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/preparaciones/{id}/iniciar | no | PreparacionController_iniciar | id:string | n/a | n/a | 200:sin schema |

### Producción (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/produccion | no | Listar todos los lotes de producción | n/a | n/a | n/a | 200:Array<ProduccionLote> |
| GET | /api/v1/produccion/{id} | no | Obtener un lote de producción por ID | id:string | n/a | n/a | 200:ProduccionLote, 404:sin schema |
| POST | /api/v1/produccion/ejecutar | no | Ejecutar la producción de una receta y registrar el lote | n/a | n/a | application/json:EjecutarProduccionDto | 201:ProduccionLote, 400:sin schema, 404:sin schema |
| PATCH | /api/v1/produccion/lote/{id}/consumir | no | Consumir raciones o cantidad de un lote de producción | id:string | n/a | application/json:ConsumirProduccionDto | 200:ProduccionLote |
| POST | /api/v1/produccion/validar | no | Validar stock disponible para una o varias producciones | n/a | n/a | application/json:ValidarProduccionDto | 200:sin schema |

### Producto Alérgenos (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/producto-alergenos | no | Listar asociaciones producto-alérgeno | n/a | idProducto:string | n/a | 200:Array<ProductoAlergeno> |
| POST | /api/v1/producto-alergenos | no | Crear una asociación entre producto y alérgeno | n/a | n/a | application/json:CreateProductoAlergenoDto | 201:ProductoAlergeno, 404:sin schema, 409:sin schema |
| GET | /api/v1/producto-alergenos/{id} | no | Obtener los alérgenos de un producto | id:string | n/a | n/a | 200:Array<ProductoAlergeno>, 404:sin schema |
| PATCH | /api/v1/producto-alergenos/{id} | no | Reemplazar completamente los alérgenos de un producto | id:string | n/a | application/json:UpdateProductoAlergenoDto | 200:Array<ProductoAlergeno>, 404:sin schema |
| DELETE | /api/v1/producto-alergenos/{idProducto}/{alergeno} | no | Eliminar una asociación concreta entre producto y alérgeno | idProducto:string, alergeno:string | n/a | n/a | 204:sin schema, 400:sin schema, 404:sin schema |

### Producto Proveedor (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/producto-proveedor/{id}/historial | no | Obtener el historial de precios de un producto proveedor | id:string | limit:number, page:number | n/a | 200:Array<HistorialPrecio>, 404:sin schema |
| PATCH | /api/v1/producto-proveedor/{id}/merma | no | Actualizar la merma esperada de un producto-proveedor | id:string | n/a | application/json:UpdateMermaProveedorDto | 200:ProductoProveedor, 404:sin schema, 409:sin schema |
| PATCH | /api/v1/producto-proveedor/{id}/precio | no | Actualizar el precio de un producto de un proveedor y registrar histórico | id:string | n/a | application/json:UpdatePrecioProductoDto | 200:sin schema, 404:sin schema, 409:sin schema |
| GET | /api/v1/producto-proveedor/comparar/{productoId} | no | Comparar proveedores de un producto por coste efectivo (precio + merma esperada) | productoId:string | n/a | n/a | 200:sin schema, 404:sin schema |
| GET | /api/v1/producto-proveedor/search | no | Buscar relaciones producto-proveedor (autocomplete) | n/a | n/a | n/a | 200:sin schema |

### Productos (8)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/productos | no | Listar productos con filtros y paginación | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/productos | no | Alta compleja de producto maestro con alérgenos y proveedores en una sola operación | n/a | n/a | application/json:CreateProductoDto | 201:Producto, 400:sin schema, 404:sin schema, 409:sin schema |
| GET | /api/v1/productos/{id} | no | Obtener un producto por ID | id:string | n/a | n/a | 200:Producto, 404:sin schema |
| PATCH | /api/v1/productos/{id} | no | Actualizar un producto | id:string | n/a | application/json:UpdateProductoDto | 200:Producto |
| DELETE | /api/v1/productos/{id} | no | Eliminar un producto | id:string | n/a | n/a | 204:sin schema |
| GET | /api/v1/productos/{id}/historial-precios | no | Obtener el historial de precios de un producto | id:string | proveedorId*:string | n/a | 200:Array<HistorialPrecio> |
| GET | /api/v1/productos/{id}/pmp | no | Obtener el PMP actual de un producto, desglosado por proveedor | id:string | n/a | n/a | 200:object |
| GET | /api/v1/productos/generar-ean13 | no | Generar un código EAN-13 único | n/a | n/a | n/a | 200:sin schema |

### Profesor (13)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/profesores/admin-slots | no | ProfesorController_adminCreateSlot | n/a | n/a | n/a | 201:sin schema |
| PATCH | /api/v1/profesores/admin-slots/{id} | no | ProfesorController_adminUpdateSlot | id:string | n/a | n/a | 200:sin schema |
| DELETE | /api/v1/profesores/admin-slots/{id} | no | ProfesorController_adminDeleteSlot | id:string | n/a | n/a | 200:sin schema |
| GET | /api/v1/profesores/all-profesores | no | ProfesorController_getAllProfesores | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/profesores/all-slots | no | ProfesorController_getAllSlots | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/profesores/alumnos | no | ProfesorController_getAlumnos | n/a | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/profesores/alumnos/{id}/activate | no | ProfesorController_activateAlumno | id:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/profesores/alumnos/{id}/force-reset | no | ProfesorController_forcePasswordReset | id:string | n/a | n/a | 201:sin schema |
| POST | /api/v1/profesores/register | no | ProfesorController_register | n/a | n/a | application/json:CreateProfesorDto | 201:sin schema |
| GET | /api/v1/profesores/slots | no | ProfesorController_getSlots | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/profesores/slots | no | ProfesorController_createSlot | n/a | n/a | application/json:CreateSlotDto | 201:sin schema |
| PATCH | /api/v1/profesores/slots/{id} | no | ProfesorController_updateSlot | id:string | n/a | application/json:UpdateSlotDto | 200:sin schema |
| DELETE | /api/v1/profesores/slots/{id} | no | ProfesorController_deleteSlot | id:string | n/a | n/a | 200:sin schema |

### Proveedor (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/proveedor | no | ProveedorController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/proveedor | no | ProveedorController_create | n/a | n/a | application/json:CreateProveedorDto | 201:sin schema |
| GET | /api/v1/proveedor/{id} | no | ProveedorController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/proveedor/{id} | no | ProveedorController_update | id:string | n/a | application/json:UpdateProveedorDto | 200:sin schema |
| DELETE | /api/v1/proveedor/{id} | no | ProveedorController_remove | id:string | n/a | n/a | 204:sin schema |

### PurchaseBatch (10)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/purchase-batches | no | PurchaseBatchController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/purchase-batches | no | PurchaseBatchController_create | n/a | n/a | application/json:CreatePurchaseBatchDto | 201:sin schema |
| GET | /api/v1/purchase-batches/{id} | no | PurchaseBatchController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/purchase-batches/{id} | no | PurchaseBatchController_update | id:string | n/a | application/json:UpdatePurchaseBatchDto | 200:sin schema |
| PATCH | /api/v1/purchase-batches/{id}/aceptar | no | PurchaseBatchController_accept | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/purchase-batches/{id}/cancelar | no | PurchaseBatchController_cancel | id:string | n/a | application/json:CancelPurchaseBatchDto | 200:sin schema |
| GET | /api/v1/purchase-batches/{id}/pdf | no | PurchaseBatchController_generatePdf | id:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/purchase-batches/consolidate | no | PurchaseBatchController_consolidate | n/a | n/a | application/json:ConsolidatePurchaseBatchDto | 201:sin schema |
| POST | /api/v1/purchase-batches/from-missing-stock | no | PurchaseBatchController_createFromMissingStock | n/a | n/a | application/json:CreateMissingStockBatchDto | 201:sin schema |
| POST | /api/v1/purchase-batches/from-recipes | no | PurchaseBatchController_createFromRecipes | n/a | n/a | application/json:GeneratePedidoFromRecetasDto | 201:sin schema |

### Recepcion (6)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/recepciones | no | RecepcionController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/recepciones | no | RecepcionController_create | n/a | n/a | application/json:CreateRecepcionDto | 201:sin schema |
| GET | /api/v1/recepciones/{id} | no | RecepcionController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/recepciones/{id} | no | RecepcionController_update | id:string | n/a | application/json:UpdateRecepcionDto | 200:sin schema |
| DELETE | /api/v1/recepciones/{id} | no | RecepcionController_remove | id:string | n/a | n/a | 204:sin schema |
| GET | /api/v1/recepciones/reporte-pdf | no | RecepcionController_reportePdf | n/a | n/a | n/a | 200:sin schema |

### Recepcion Draft (3)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/recepcion/draft | no | Recuperar el borrador de recepción más reciente | n/a | n/a | n/a | 200:RecepcionDraftResponseDto |
| POST | /api/v1/recepcion/draft | no | Crear o actualizar el borrador seguro de recepción | n/a | n/a | application/json:UpsertRecepcionDraftDto | 200:RecepcionDraftResponseDto |
| DELETE | /api/v1/recepcion/draft | no | Eliminar el borrador activo de recepción | n/a | n/a | n/a | 204:sin schema |

### RecepcionProducto (5)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/recepcion-productos | no | RecepcionProductoController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/recepcion-productos | no | RecepcionProductoController_create | n/a | n/a | application/json:CreateRecepcionProductoDto | 201:sin schema |
| GET | /api/v1/recepcion-productos/{id} | no | RecepcionProductoController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/recepcion-productos/{id} | no | RecepcionProductoController_update | id:string | n/a | application/json:UpdateRecepcionProductoDto | 200:sin schema |
| DELETE | /api/v1/recepcion-productos/{id} | no | RecepcionProductoController_remove | id:string | n/a | n/a | 204:sin schema |

### Recetas (12)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/recetas | no | RecetaController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/recetas | no | RecetaController_create | n/a | n/a | application/json:CreateRecetaDto | 201:sin schema |
| GET | /api/v1/recetas/{id} | no | RecetaController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/recetas/{id} | no | RecetaController_update | id:string | n/a | application/json:UpdateRecetaDto | 200:sin schema |
| DELETE | /api/v1/recetas/{id} | no | RecetaController_remove | id:string | n/a | n/a | 204:sin schema |
| POST | /api/v1/recetas/{id}/cocinar | no | RecetaController_cocinar | id:string | n/a | application/json:CocinarRecetaDto | 200:sin schema |
| GET | /api/v1/recetas/{id}/detalle | no | RecetaController_getDetalle | id:string | n/a | n/a | 200:sin schema |
| GET | /api/v1/recetas/{id}/escandallo | no | Calcular el escandallo (coste) de una receta | id:string | n/a | n/a | 200:RecetaCostResponseDto, 404:sin schema |
| GET | /api/v1/recetas/{id}/pdf | no | Generar PDF de una receta | id:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/recetas/{id}/recalcular-costes | no | Recalcular y guardar el coste unitario estimado de la receta | id:string | n/a | n/a | 200:Receta |
| POST | /api/v1/recetas/duplicate | no | RecetaController_duplicate | n/a | n/a | application/json:DuplicateRecetaDto | 201:sin schema |
| GET | /api/v1/recetas/export/pdf | no | Generar PDF de varias recetas | n/a | n/a | n/a | 200:sin schema |

### Ubicaciones (6)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/ubicacion | si | Obtener todas las ubicaciones | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/ubicacion | si | Crear nueva ubicación | n/a | n/a | application/json:CreateUbicacionDto | 201:sin schema |
| GET | /api/v1/ubicacion/{id} | si | Obtener ubicación por ID | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/ubicacion/{id} | si | Actualizar una ubicación | id:string | n/a | application/json:UpdateUbicacionDto | 200:sin schema |
| DELETE | /api/v1/ubicacion/{id} | si | Eliminar una ubicación lógica | id:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/ubicacion/{id}/restore | si | Restaurar una ubicación eliminada | id:string | n/a | n/a | 201:sin schema |

### Usuario (18)

| Metodo | Ruta | Auth | Resumen | Params | Query | Body | Respuestas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/usuarios | no | UsuarioController_findAll | n/a | n/a | n/a | 200:sin schema |
| POST | /api/v1/usuarios | no | UsuarioController_create | n/a | n/a | application/json:CreateUsuarioDto | 201:sin schema |
| GET | /api/v1/usuarios/{id} | no | UsuarioController_findOne | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/usuarios/{id} | no | UsuarioController_update | id:string | n/a | application/json:UpdateUsuarioDto | 200:sin schema |
| DELETE | /api/v1/usuarios/{id} | no | UsuarioController_remove | id:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/usuarios/{id}/activar | no | UsuarioController_updateStatus | id:string | n/a | application/json:UpdateUsuarioStatusDto | 200:sin schema |
| PATCH | /api/v1/usuarios/{id}/admin | no | UsuarioController_updateAdmin | id:string | n/a | application/json:AdminUpdateUsuarioDto | 200:sin schema |
| PATCH | /api/v1/usuarios/{id}/password | no | UsuarioController_updatePassword | id:string | n/a | application/json:ResetPasswordDto | 200:sin schema |
| POST | /api/v1/usuarios/{id}/permisos-adicionales/{permisoId} | no | UsuarioController_addAdditionalPermission | id:string, permisoId:string | n/a | n/a | 201:sin schema |
| DELETE | /api/v1/usuarios/{id}/permisos-adicionales/{permisoId} | no | UsuarioController_removeAdditionalPermission | id:string, permisoId:string | n/a | n/a | 200:sin schema |
| POST | /api/v1/usuarios/{id}/permisos-excluidos/{permisoId} | no | UsuarioController_addExcludedPermission | id:string, permisoId:string | n/a | n/a | 201:sin schema |
| DELETE | /api/v1/usuarios/{id}/permisos-excluidos/{permisoId} | no | UsuarioController_removeExcludedPermission | id:string, permisoId:string | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/usuarios/{id}/rol | no | UsuarioController_updateRol | id:string | n/a | application/json:UpdateUsuarioRolDto | 200:sin schema |
| POST | /api/v1/usuarios/admin | no | UsuarioController_createAdmin | n/a | n/a | application/json:AdminCreateUsuarioDto | 201:sin schema |
| GET | /api/v1/usuarios/minimos | no | UsuarioController_findAllMinimal | n/a | n/a | n/a | 200:sin schema |
| GET | /api/v1/usuarios/perfil | no | UsuarioController_getPerfil | n/a | n/a | n/a | 200:sin schema |
| PATCH | /api/v1/usuarios/perfil | no | UsuarioController_updatePerfil | n/a | n/a | application/json:UpdateUsuarioDto | 200:sin schema |
| PATCH | /api/v1/usuarios/perfil/password | no | UsuarioController_changePassword | n/a | n/a | application/json:ChangePasswordDto | 200:sin schema |
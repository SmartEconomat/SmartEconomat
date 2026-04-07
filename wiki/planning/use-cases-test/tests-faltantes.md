# Análisis Exhaustivo de Tests Faltantes — SmartEconomat Backend

> **Fecha de análisis**: 13 de marzo de 2026  
> **Base**: Código fuente real del backend NestJS (`backend/smart-economat-backend/`)  
> **Metodología**: Revisión línea a línea de todos los módulos, servicios, controladores, entidades y tests existentes.

---

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Inventario de tests existentes](#inventario-de-tests-existentes)
3. [Tests unitarios faltantes](#tests-unitarios-faltantes)
4. [Tests de integración faltantes](#tests-de-integración-faltantes)
5. [Tests e2e faltantes](#tests-e2e-faltantes)

---

## Resumen ejecutivo

### Módulos analizados (20)

| Módulo | Servicios | Controladores | Entidades | Tests unit. | Tests e2e |
|--------|-----------|---------------|-----------|-------------|-----------|
| auth | 3 | 1 | — | 0 | 5 |
| admin | 1 | 1 | — | 0 | 7 |
| usuario | 1 | 1 | 1 | 0 | 8 |
| roles | 1 | 0 | 3 | 0 | 0 |
| permisos | 1 | 0 | 1 | 0 | 0 |
| plantillas-roles | 1 | 0 | 2 | 0 | 0 |
| producto | 4 | 4 | 4 | 2 (scaffold) | 6 |
| proveedor | 1 | 1 | 1 | 0 | 7 |
| pedido | 1 | 1 | 2 | 0 | 5 |
| recepcion | 3 | 2 | 3 | 0 | 2 |
| albaran | 1 | 1 | 2 | 0 | 5 |
| incidencia | 2 | 2 | 3 | 0 | 9 |
| inventario | 1 | 2 | 1 | 0 | 6 |
| movimiento | 1 | 1 | 1 | 0 | 17 |
| ubicacion | 1 | 1 | 1 | 0 | 6 |
| receta | 2 | 2 | 3 | 0 | 5 |
| dashboard | 1 | 1 | 0 | 0 | 2 |
| archivo | 1 | 1 | 1 | 0 | 4 |
| alumno | 1 | 1 | 1 | 0 | 5 |
| profesor | 1 | 1 | 2 | 0 | 3 |

### Tests de infraestructura existentes (common/)

| Área | Tests existentes |
|------|-----------------|
| `ParseUUIDv7Pipe` | Completo (spec) |
| Transformers (7) | Completo (specs) |
| `ean13.util` | Completo (spec) |
| `master-requirements.e2e` | Flujo completo auth+registro+activación+RBAC |
| `password-recovery.e2e` | 9 casos de recuperación de contraseña |
| `rbac.e2e` | 5 casos de permisos adicionales/excluidos |

### Hallazgo principal

- **0 tests unitarios de servicios** en los 20 módulos de negocio (excepto 2 scaffold vacíos en producto).
- **0 tests unitarios de guards, decoradores, filtros e interceptores**.
- **Cobertura e2e razonable** para flujos CRUD básicos, pero **faltan los flujos de negocio complejos** (recepción masiva, producción de recetas, escandallo, cocinar, historial de precios, resolución transaccional de incidencias, etc.).

---

## Inventario de tests existentes

### Tests unitarios (`test/common/` y `test/modules/`)

| Archivo | Tipo | Cobertura |
|---------|------|-----------|
| `test/common/pipes/parse-uuid-v7.pipe.spec.ts` | Unit | UUID v7 valid/invalid/variantes |
| `test/common/transformers/string-to-boolean.transformer.spec.ts` | Unit | Conversión boolean completa |
| `test/common/transformers/string-to-number.transformer.spec.ts` | Unit | Conversión numérica |
| `test/common/transformers/string-to-date.transformer.spec.ts` | Unit | Parseo de fechas |
| `test/common/transformers/trim-string.transformer.spec.ts` | Unit | Trim de cadenas |
| `test/common/transformers/lowercase-string.transformer.spec.ts` | Unit | Lowercase |
| `test/common/transformers/uppercase-string.transformer.spec.ts` | Unit | Uppercase |
| `test/common/transformers/normalize-array.transformer.spec.ts` | Unit | Normalización de arrays |
| `test/common/utils/ean13.util.spec.ts` | Unit | Generación/validación EAN-13 |
| `test/modules/producto/producto.service.spec.ts` | Unit | Solo instanciación (scaffold) |
| `test/modules/producto/producto.controller.spec.ts` | Unit | Solo instanciación (scaffold) |

### Tests e2e (`test/*.e2e-spec.ts`)

| Archivo | # Tests | Resumen de cobertura |
|---------|---------|---------------------|
| `app.e2e-spec.ts` | 1 | GET / → 200 |
| `auth.e2e-spec.ts` | 5 | Registro, duplicados, login correcto/incorrecto |
| `admin.e2e-spec.ts` | 7 | Crear profesor, activar, force-reset, RBAC |
| `usuarios.e2e-spec.ts` | 8 | Perfil, CRUD admin, cambio password, rol, status |
| `rbac.e2e-spec.ts` | 5 | Permisos adicionales/excluidos dinámicos |
| `password-recovery.e2e-spec.ts` | 9 | Flujo completo registro→activación→reset→cambio |
| `productos.e2e-spec.ts` | 6 | CRUD, EAN-13, búsqueda |
| `proveedores.e2e-spec.ts` | 7 | CRUD, unicidad nombre/NIF, relaciones |
| `pedidos.e2e-spec.ts` | 5 | Crear, listar, fecha entrega, cancelar, eliminar |
| `producto-proveedor.e2e-spec.ts` | 2 | Solo 404 para precio/historial inexistente |
| `recepcion.e2e-spec.ts` | 2 | Solo errores de validación (body vacío, pedido inexistente) |
| `albaran.e2e-spec.ts` | 5 | CRUD completo |
| `incidencias.e2e-spec.ts` | 8 | CRUD + resolver + validaciones |
| `incidencias-recepcion.e2e-spec.ts` | 1 | Flujo reportar→flag→resolver con movimiento |
| `inventario.e2e-spec.ts` | 6 | CRUD + alertas caducidad/stock |
| `movimientos.e2e-spec.ts` | 17 | Listado, historial con filtros, CRUD, roles |
| `ubicaciones.e2e-spec.ts` | 6 | CRUD + soft delete + restore |
| `recetas.e2e-spec.ts` | 5 | CRUD + duplicar |
| `dashboard.e2e-spec.ts` | 2 | Stats + auth |
| `archivos.e2e-spec.ts` | 4 | Upload, listar, detalle, eliminar |
| `alumnos.e2e-spec.ts` | 5 | Registro, CIAL inválido, ver alumnos, activar, reset |
| `profesores.e2e-spec.ts` | 3 | Registro, slots, listar alumnos |
| `frontend-integration-contracts.e2e-spec.ts` | 10 | Contratos frontend-backend: perfil, productos, pedidos, recepción, inventario, recetas e incidencias |
| `master-requirements.e2e-spec.ts` | ~12 | Flujo maestro auth+registro+activación+RBAC+edge |

---

## Tests unitarios faltantes

### 1. Módulo: `auth`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-AUTH-01 | Registro exitoso con hash bcrypt | `AuthService.register()` | Verificar que el password se hashea correctamente y el usuario se crea con status INACTIVE y rol ALUMNO | No |
| U-AUTH-02 | Registro con username duplicado | `AuthService.register()` | Debe lanzar ConflictException al intentar username existente | No |
| U-AUTH-03 | Registro con email duplicado | `AuthService.register()` | Debe lanzar ConflictException al intentar email existente | No |
| U-AUTH-04 | Login con usuario INACTIVE | `AuthService.login()` | Debe rechazar con UnauthorizedException indicando cuenta inactiva | No |
| U-AUTH-05 | Login con usuario BLOCKED | `AuthService.login()` | Debe rechazar con UnauthorizedException indicando cuenta bloqueada | No |
| U-AUTH-06 | Login exitoso genera JWT con payload correcto | `AuthService.login()` | Verificar que el token contiene userId, username y role | No |
| U-AUTH-07 | Forgot password con email inexistente no lanza error | `AuthService.forgotPassword()` | Patrón de seguridad: no revelar si el email existe | No |
| U-AUTH-08 | Forgot password genera token SHA256 con expiración 15min | `AuthService.forgotPassword()` | Verificar almacenamiento de hash y fecha de expiración | No |
| U-AUTH-09 | Reset password con token expirado | `AuthService.resetPassword()` | Debe rechazar tokens vencidos | No |
| U-AUTH-10 | Reset password exitoso limpia token y mustChangePassword | `AuthService.resetPassword()` | Verificar que se limpian campos de reset | No |
| U-AUTH-11 | Change password con contraseña actual incorrecta | `AuthService.changePassword()` | Debe lanzar UnauthorizedException | No |
| U-AUTH-12 | Change password exitoso actualiza hash | `AuthService.changePassword()` | Verificar que el nuevo hash es válido con bcrypt | No |

### 2. Módulo: `auth` — Permisos

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-AUTHP-01 | Carga de permisos desde caché | `AuthPermissionsService.getUserPermissions()` | Verificar que la segunda llamada usa caché (TTL 300s) | No |
| U-AUTHP-02 | Carga de permisos desde BD con herencia de plantilla | `AuthPermissionsService.loadUserPermissionsFromDB()` | Verificar resolución: roles base + plantilla + adicionales − excluidos | No |
| U-AUTHP-03 | userHasAllPermissions lógica AND | `AuthPermissionsService.userHasAllPermissions()` | Con array parcialmente presente debe retornar false | No |
| U-AUTHP-04 | userHasAnyPermission lógica OR | `AuthPermissionsService.userHasAnyPermission()` | Con al menos un permiso presente debe retornar true | No |
| U-AUTHP-05 | Invalidación de caché por usuario | `AuthPermissionsService.invalidateUserCache()` | Verificar que tras invalidar, la siguiente llamada consulta BD | No |
| U-AUTHP-06 | Permisos con array vacío concede acceso | `AuthPermissionsService.userHasAllPermissions([])` | Array vacío = sin restricción | No |

### 3. Módulo: `auth` — Guards y Decoradores

| # | Caso de uso | Componente | Motivo | Existe similar |
|---|-------------|------------|--------|----------------|
| U-GUARD-01 | JwtAuthGuard permite rutas @Public() | `JwtAuthGuard` | Verificar que el decorador @Public() bypasea la autenticación | No |
| U-GUARD-02 | JwtAuthGuard rechaza sin token | `JwtAuthGuard` | Debe retornar 401 sin access_token | No |
| U-GUARD-03 | AuthPermissionsGuard con modo AND | `AuthPermissionsGuard` | Verifica que require ALL permisos del metadata | No |
| U-GUARD-04 | AuthPermissionsGuard con modo OR | `AuthPermissionsGuard` | Verifica que require ANY permiso del metadata | No |
| U-GUARD-05 | AuthPermissionsGuard respeta @Public() | `AuthPermissionsGuard` | Rutas públicas deben pasar sin validar permisos | No |
| U-GUARD-06 | AuthPermissionsGuard retorna 403 con detalle | `AuthPermissionsGuard` | El ForbiddenException debe incluir permisos requeridos | No |
| U-GUARD-07 | JwtStrategy valida payload y carga usuario | `JwtStrategy` | Verificar extracción de userId del payload JWT | No |

### 4. Módulo: `admin`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-ADM-01 | Crear profesor con transacción atómica | `AdminService.createProfesor()` | Verificar que Usuario + Profesor se crean juntos o ninguno | No |
| U-ADM-02 | Crear profesor con CIAL duplicado | `AdminService.createProfesor()` | Debe lanzar ConflictException por CIAL duplicado | No |
| U-ADM-03 | Activar usuario ya activo | `AdminService.activateUser()` | Debe lanzar BadRequestException | No |
| U-ADM-04 | Activar usuario inexistente | `AdminService.activateUser()` | Debe lanzar NotFoundException | No |
| U-ADM-05 | Force reset genera password de 8 caracteres | `AdminService.forcePasswordReset()` | Verificar longitud y formato del password provisional | No |
| U-ADM-06 | Force reset establece mustChangePassword=true | `AdminService.forcePasswordReset()` | Verificar flag tras el reset | No |

### 5. Módulo: `usuario`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-USR-01 | Crear usuario con hash automático de password | `UsuarioService.create()` | Verificar que @BeforeInsert hashea el password | No |
| U-USR-02 | findAll con paginación válida | `UsuarioService.findAll()` | Verificar estructura paginada (data, total, page, limit, totalPages) | No |
| U-USR-03 | findOne con ID inexistente | `UsuarioService.findOne()` | Debe lanzar NotFoundException | No |
| U-USR-04 | changePassword con old password incorrecto | `UsuarioService.changePassword()` | Debe lanzar UnauthorizedException | No |
| U-USR-05 | resetPassword establece mustChangePassword | `UsuarioService.resetPassword()` | Verificar flag y hash del nuevo password | No |
| U-USR-06 | addAdditionalPermission invalida caché | `UsuarioService.addAdditionalPermission()` | Verificar llamada a invalidateUserCache | No |
| U-USR-07 | addExcludedPermission invalida caché | `UsuarioService.addExcludedPermission()` | Verificar llamada a invalidateUserCache | No |
| U-USR-08 | removeAdditionalPermission con permiso no asignado | `UsuarioService.removeAdditionalPermission()` | Verificar comportamiento con permiso inexistente | No |
| U-USR-09 | remove usuario con relaciones activas | `UsuarioService.remove()` | Verificar manejo de FK constraints | No |

### 6. Módulo: `roles`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-ROL-01 | Crear rol con nombre duplicado | `RolesService.create()` | Debe lanzar ConflictException | No |
| U-ROL-02 | Crear rol con permisos asignados en creación | `RolesService.create()` | Verificar asignación en una sola operación | No |
| U-ROL-03 | Actualizar rol de sistema (esSistema=true) | `RolesService.update()` | Debe prohibir edición de roles de sistema | No |
| U-ROL-04 | Eliminar rol con usuarios asignados | `RolesService.remove()` | Debe lanzar BadRequestException si hay usuarios | No |
| U-ROL-05 | Eliminar rol de sistema | `RolesService.remove()` | Debe prohibir eliminación de roles esSistema | No |
| U-ROL-06 | assignPermissions invalida caché de usuarios afectados | `RolesService.assignPermissions()` | Verificar propagación de invalidación de caché | No |
| U-ROL-07 | assignRoleToUser crea junction record | `RolesService.assignRoleToUser()` | Verificar creación de UsuarioRol con asignadoPor | No |
| U-ROL-08 | assignRoleToUser con asignación existente reactiva | `RolesService.assignRoleToUser()` | Verificar que actualiza activo=true si ya existe | No |
| U-ROL-09 | removeRoleFromUser inexistente | `RolesService.removeRoleFromUser()` | Debe lanzar NotFoundException | No |
| U-ROL-10 | getUserRoles con usuario inexistente | `RolesService.getUserRoles()` | Debe lanzar NotFoundException | No |
| U-ROL-11 | findAllNoPagination retorna todos los activos | `RolesService.findAllNoPagination()` | Verificar que no incluye roles inactivos | No |

### 7. Módulo: `permisos`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PERM-01 | Crear permiso con código duplicado | `PermisosService.create()` | Debe lanzar ConflictException | No |
| U-PERM-02 | createMany batch de permisos | `PermisosService.createMany()` | Verificar creación masiva para seeders | No |
| U-PERM-03 | Eliminar permiso usado por roles | `PermisosService.remove()` | Debe lanzar BadRequestException indicando N roles afectados | No |
| U-PERM-04 | findByCodigo con código inexistente | `PermisosService.findByCodigo()` | Debe retornar null | No |
| U-PERM-05 | findByCodigos con array vacío | `PermisosService.findByCodigos()` | Debe retornar array vacío | No |
| U-PERM-06 | findGroupedByModule agrupa correctamente | `PermisosService.findGroupedByModule()` | Verificar estructura { modulo: [permisos] } | No |

### 8. Módulo: `plantillas-roles`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PLANT-01 | Crear plantilla con herencia (plantillaPadreId) | `PlantillasRolesService.create()` | Verificar vinculación padre-hija | No |
| U-PLANT-02 | Actualizar plantilla no editable | `PlantillasRolesService.update()` | Debe rechazar si esEditable=false | No |
| U-PLANT-03 | Eliminar plantilla de sistema | `PlantillasRolesService.remove()` | Debe rechazar plantillas no editables | No |
| U-PLANT-04 | createRolFromPlantilla hereda permisos recursivamente | `PlantillasRolesService.createRolFromPlantilla()` | Verificar que la cadena de herencia se resuelve completa | No |
| U-PLANT-05 | getPermisosWithInheritance deduplicación | `PlantillasRolesService.getPermisosWithInheritance()` | Permisos duplicados entre padre e hijo deben deduplicarse | No |

### 9. Módulo: `producto`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PROD-01 | Crear producto con EAN-13 automático | `ProductoService.create()` | Verificar generación y asignación de código de barras | Scaffold vacío |
| U-PROD-02 | Crear producto con EAN-13 manual duplicado | `ProductoService.create()` | Debe rechazar código de barras existente | Scaffold vacío |
| U-PROD-03 | generateUniqueEan13 con 5 reintentos | `ProductoService.generateUniqueEan13()` | Verificar lógica de reintento y excepción tras agotarlos | No |
| U-PROD-04 | syncProveedoresWithManager crea/actualiza/elimina | `ProductoService.syncProveedoresWithManager()` | Verificar gestión transaccional de relaciones producto-proveedor | No |
| U-PROD-05 | findAll con filtros combinados | `ProductoService.findAll()` | Verificar filtros: categoría + marca + alergeno + stock mínimo | No |
| U-PROD-06 | remove registra auditoría | `ProductoService.remove()` | Verificar llamada a movimientoHelper.trackProductoCreation | No |

### 10. Módulo: `producto-proveedor`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PP-01 | updatePrecio con mismo precio | `ProductoProveedorService.updatePrecio()` | Debe lanzar ConflictException (no-op) | No |
| U-PP-02 | updatePrecio crea registro en historial | `ProductoProveedorService.updatePrecio()` | Verificar creación de HistorialPrecio con precio anterior | No |
| U-PP-03 | search por nombre/marca/barcode autocomplete | `ProductoProveedorService.search()` | Verificar búsqueda fuzzy y estructura de respuesta | No |
| U-PP-04 | getHistorial pagina correctamente | `ProductoProveedorService.getHistorial()` | Verificar orden DESC y paginación | No |

### 11. Módulo: `producto-alergeno`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PALERG-01 | Crear asociación duplicada | `ProductoAlergenoService.create()` | Debe rechazar duplicados por PK compuesta | No |
| U-PALERG-02 | update reemplaza todos los alergenos | `ProductoAlergenoService.update()` | Verificar delete-then-create y deduplicación | No |
| U-PALERG-03 | remove con alergeno inválido | `ProductoAlergenoService.remove()` | Verificar validación de enum Alergeno | No |

### 12. Módulo: `historial-precio`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-HIST-01 | Crear con precio negativo | `HistorialPrecioService.create()` | Debe rechazar precio < 0 | No |
| U-HIST-02 | Crear con ProductoProveedor inexistente | `HistorialPrecioService.create()` | Debe lanzar NotFoundException | No |
| U-HIST-03 | Update con precio negativo | `HistorialPrecioService.update()` | Debe rechazar precio < 0 | No |

### 13. Módulo: `proveedor`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PROV-01 | Crear con nombre duplicado | `ProveedorService.create()` | Debe lanzar BadRequestException | No |
| U-PROV-02 | Crear con NIF duplicado | `ProveedorService.create()` | Debe lanzar BadRequestException | No |
| U-PROV-03 | Eliminar con productos vinculados | `ProveedorService.remove()` | Debe lanzar BadRequestException indicando relaciones | No |
| U-PROV-04 | Eliminar con pedidos vinculados | `ProveedorService.remove()` | Debe lanzar BadRequestException indicando relaciones | No |
| U-PROV-05 | findAll con searchTerm busca en nombre/nif/contacto/email | `ProveedorService.findAll()` | Verificar ILike en múltiples campos | No |
| U-PROV-06 | Update nombre ya existente | `ProveedorService.update()` | Debe re-validar unicidad del nombre | No |

### 14. Módulo: `pedido`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PED-01 | Crear pedido calcula costeTotal correctamente | `PedidoService.create()` | Verificar sum(cantidad * precioUnitario) | Sí |
| U-PED-02 | Crear pedido con ProductoProveedor de otro proveedor | `PedidoService.create()` | Debe rechazar líneas que no pertenecen al proveedor del pedido | Sí |
| U-PED-03 | Crear pedido con ProductoProveedor sin precioUnitario | `PedidoService.create()` | Debe lanzar ConflictException | Sí |
| U-PED-04 | Cancelar pedido en estado POR_RECEPCIONAR | `PedidoService.cancelarPedido()` | Debe lanzar BadRequestException (solo PENDIENTE_DE_APROBACION/CANCELADO) | Sí |
| U-PED-05 | Cancelar pedido en estado RECEPCIONADO | `PedidoService.cancelarPedido()` | Debe lanzar BadRequestException | Sí |
| U-PED-06 | Eliminar pedido en estado RECEPCIONADO | `PedidoService.remove()` | Debe lanzar BadRequestException (solo PENDIENTE_DE_APROBACION/CANCELADO) | Sí |
| U-PED-07 | Update con líneas vacías | `PedidoService.update()` | Debe lanzar BadRequestException (mínimo 1 línea) | Sí |
| U-PED-08 | Update recalcula costeTotal | `PedidoService.update()` | Verificar recálculo tras modificar líneas | Sí |
| U-PED-09 | Transacción atómica en create | `PedidoService.create()` | Verificar rollback si falla una línea | No |
| U-PED-10 | Generar pedido desde múltiples recetas consolida cantidades | `RecetaToPedidoService.generateFromRecetas()` | Verificar aplanado de ingredientes repetidos | Sí |
| U-PED-11 | Generar pedido desde recetas con receta inexistente | `RecetaToPedidoService.generateFromRecetas()` | Debe lanzar NotFoundException | Sí |
| U-PED-12 | Generar pedido desde recetas sin proveedor asignado | `RecetaToPedidoService.generateFromRecetas()` | Debe rechazar productos sin proveedor vigente | Sí |
| U-PED-13 | Generar pedido desde recetas sin proveedor común | `RecetaToPedidoService.generateFromRecetas()` | Debe rechazar consolidación sin proveedor compartido | Sí |
| U-PED-14 | Generar pedido desde recetas con producto inactivo | `RecetaToPedidoService.generateFromRecetas()` | Debe rechazar ingredientes no disponibles | Sí |
| U-PED-15 | Generar pedido desde recetas con unidades incompatibles | `RecetaToPedidoService.generateFromRecetas()` | Debe rechazar agregación inconsistente | Sí |
| U-PED-16 | Generar pedido desde recetas aplica merma y elige proveedor óptimo | `RecetaToPedidoService.generateFromRecetas()` | Verificar cantidad efectiva y menor coste total | Sí |
| U-PED-17 | Generar pedido desde recetas registra el origen en logs | `RecetaToPedidoService.generateFromRecetas()` | Debe dejar trazabilidad del origen | Sí |

### 15. Módulo: `recepcion`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-REC-01 | procesarRecepcion crea inventario por producto recibido | `RecepcionStockService.procesarRecepcion()` | Verificar creación de Inventario + Movimiento ENTRADA_COMPRA | No |
| U-REC-02 | procesarRecepcion detecta faltantes | `RecepcionStockService.procesarRecepcion()` | Verificar auto-generación de Incidencia cuando recibido < pedido | No |
| U-REC-03 | procesarRecepcion detecta excesos | `RecepcionStockService.procesarRecepcion()` | Verificar auto-generación de Incidencia cuando recibido > pedido | No |
| U-REC-04 | procesarRecepcion detecta defectuosos | `RecepcionStockService.procesarRecepcion()` | Verificar incidencia con estadoVisual ROTO/DEFECTUOSO | No |
| U-REC-05 | procesarRecepcion determina estado COMPLETADA | `RecepcionStockService.procesarRecepcion()` | Cuando todas las cantidades coinciden | No |
| U-REC-06 | procesarRecepcion determina estado PARCIAL | `RecepcionStockService.procesarRecepcion()` | Cuando algunas cantidades faltan | No |
| U-REC-07 | procesarRecepcion determina estado CON_INCIDENCIAS | `RecepcionStockService.procesarRecepcion()` | Cuando hay discrepancias | No |
| U-REC-08 | procesarRecepcionMasiva transacción ACID | `RecepcionStockService.procesarRecepcionMasiva()` | Verificar atomicidad: todo o nada | No |
| U-REC-09 | procesarRecepcionMasiva crea albarán automático | `RecepcionStockService.procesarRecepcionMasiva()` | Verificar creación de Albaran si nAlbaran proporcionado | No |
| U-REC-10 | procesarRecepcionMasiva actualiza estado pedido | `RecepcionStockService.procesarRecepcionMasiva()` | Verificar transición POR_RECEPCIONAR→PARCIAL/RECEPCIONADO | No |
| U-REC-11 | remove con recepciones dependientes | `RecepcionService.remove()` | Verificar validación de registros dependientes | No |

### 16. Módulo: `albaran`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-ALB-01 | Crear albarán con nAlbaran duplicado | `AlbaranService.create()` | Debe rechazar por unique constraint | No |
| U-ALB-02 | Eliminar albarán inexistente | `AlbaranService.remove()` | Debe lanzar NotFoundException | No |

### 17. Módulo: `incidencia`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-INC-01 | Actualizar incidencia resuelta | `IncidenciaService.update()` | Debe prohibir edición si ya está resuelta | No |
| U-INC-02 | Eliminar incidencia resuelta | `IncidenciaService.remove()` | Debe prohibir eliminación si ya está resuelta | No |
| U-INC-03 | resolverIncidencia marca fechaResolucion | `IncidenciaService.resolverIncidencia()` | Verificar que se establece la fecha y el usuario resolutor | No |
| U-INC-04 | resolverIncidenciaTransaccional tipo DEVOLUCION crea movimiento | `IncidenciaService.resolverIncidenciaTransaccional()` | Verificar creación de Movimiento SALIDA_AJUSTE | No |
| U-INC-05 | reportarIncidencia activa flag en recepcion | `IncidenciaService.reportarIncidencia()` | Verificar que recepcion.incidencia = true | No |
| U-INC-06 | IncidenciaLinea cálculo de diferencia | Entity `IncidenciaLinea` | Verificar tipoDiferencia correcto según cantidades | No |
| U-INC-07 | Eliminar IncidenciaResuelta revierte estado | `IncidenciaResueltaService.remove()` | Verificar que la incidencia vuelve a estado no resuelta | No |

### 18. Módulo: `inventario`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-INV-01 | create valida existencia de ProductoProveedor | `InventarioService.create()` | Debe lanzar NotFoundException si no existe | No |
| U-INV-02 | create genera Movimiento ENTRADA | `InventarioService.create()` | Verificar creación automática de movimiento | No |
| U-INV-03 | update con cambio de cantidad genera movimiento | `InventarioService.update()` | ENTRADA si incrementa, SALIDA si decrementa | No |
| U-INV-04 | remove genera Movimiento SALIDA completo | `InventarioService.remove()` | Verificar movimiento con cantidad = cantidadActual | No |
| U-INV-05 | ajustarCantidad rechaza resultado negativo | Entidad `Inventario.ajustarCantidad()` | Debe lanzar error si result < 0 | No |
| U-INV-06 | esBajoStock threshold correcto | Entidad `Inventario.esBajoStock()` | True cuando cantidadActual < cantidadMinima | No |
| U-INV-07 | proximoACaducar cálculo de umbral | Entidad `Inventario.proximoACaducar()` | True cuando fechaCaducidad ≤ NOW + diasUmbral | No |
| U-INV-08 | obtenerAlertasCaducidad ventana de 7 días | `InventarioService.obtenerAlertasCaducidad()` | Solo items que caducan dentro de 7 días | No |
| U-INV-09 | obtenerAlertasStock criterio cantidadActual < cantidadMinima | `InventarioService.obtenerAlertasStock()` | Verificar filtro correcto | No |

### 19. Módulo: `movimiento`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-MOV-01 | getMovimientoHistory sin entityId ni userId | `MovimientoService.getMovimientoHistory()` | Debe lanzar BadRequestException | No |
| U-MOV-02 | getMovimientoHistory con startDate > endDate | `MovimientoService.getMovimientoHistory()` | Debe lanzar BadRequestException | No |
| U-MOV-03 | getMovimientoHistory sin resultados | `MovimientoService.getMovimientoHistory()` | Debe lanzar NotFoundException | No |
| U-MOV-04 | getMovimientoHistory filtro por tipo | `MovimientoService.getMovimientoHistory()` | Verificar filtrado correcto por TipoMovimiento | No |
| U-MOV-05 | getMovimientoHistory ordenamiento personalizado | `MovimientoService.getMovimientoHistory()` | Verificar sortBy=cantidad, sortOrder=ASC | No |

### 20. Módulo: `ubicacion`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-UBI-01 | Crear ubicación con nombre duplicado | `UbicacionService.create()` | Debe lanzar ConflictException | No |
| U-UBI-02 | restore ubicación no eliminada | `UbicacionService.restore()` | Verificar comportamiento cuando no hay soft delete | No |

### 21. Módulo: `receta`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-RECETA-01 | calcularEscandallo desglose de costes | `RecetaService.calcularEscandallo()` | Verificar cálculo coste por ingrediente usando precios de ProductoProveedor | No |
| U-RECETA-02 | cocinar consume inventario FIFO por caducidad | `RecetaService.cocinar()` | Verificar consumo ordenado por fechaCaducidad ASC | No |
| U-RECETA-03 | cocinar con stock insuficiente | `RecetaService.cocinar()` | Debe indicar ingredientes sin stock suficiente | No |
| U-RECETA-04 | cocinar crea movimientos SALIDA_ELABORACION | `RecetaService.cocinar()` | Verificar creación de movimientos por cada ingrediente consumido | No |
| U-RECETA-05 | duplicate copia ingredientes correctamente | `RecetaService.duplicate()` | Verificar que la receta duplicada tiene mismos ingredientes | No |
| U-RECETA-06 | getDetalle incluye niveles de stock y alergenos | `RecetaService.getDetalle()` | Verificar estructura de respuesta con stock actual | No |
| U-RECETA-07 | recalcularCostes actualiza costeUnitarioEstimado | `RecetaService.recalcularCostes()` | Verificar cálculo basado en precios actuales | No |
| U-RECETA-08 | ejecutarProduccion calcula merma | `ProduccionService.ejecutarProduccion()` | Verificar aplicación proporcional de mermaAplicada | No |
| U-RECETA-09 | ejecutarProduccion crea lote con coste real | `ProduccionService.ejecutarProduccion()` | Verificar ProduccionLote con costeTotalReal calculado | No |
| U-RECETA-10 | ejecutarProduccion almacena resultado en inventario | `ProduccionService.ejecutarProduccion()` | Verificar creación de Inventario para productoResultado | No |
| U-RECETA-11 | ejecutarProduccion depleta inventario de ingredientes | `ProduccionService.ejecutarProduccion()` | Verificar decrementos de stock | No |

### 22. Módulo: `dashboard`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-DASH-01 | getStats calcula valorTotal del inventario | `DashboardService.getStats()` | Verificar sum(cantidadActual * precioUnitario) | No |
| U-DASH-02 | getStats cuenta itemsBajoStock correctamente | `DashboardService.getStats()` | Verificar criterio cantidadActual < cantidadMinima | No |
| U-DASH-03 | getStats cuenta pedidos pendientes por estado | `DashboardService.getStats()` | Verificar filtro por PENDIENTE_DE_APROBACION + POR_RECEPCIONAR + INCIDENCIA | No |
| U-DASH-04 | getStats cuenta alertas de caducidad 7 días | `DashboardService.getStats()` | Verificar ventana temporal | No |
| U-DASH-05 | getStats cuenta productos creados este mes | `DashboardService.getStats()` | Verificar filtro por mes calendario actual | No |
| U-DASH-06 | getStats últimos 5 movimientos | `DashboardService.getStats()` | Verificar orden DESC y límite 5 | No |

### 23. Módulo: `archivo`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-ARCH-01 | uploadFile procesa imagen (resize, formato) | `ArchivoService.uploadFile()` | Verificar procesamiento con sharp (webp/jpeg/png) | No |
| U-ARCH-02 | uploadFile sin procesamiento | `ArchivoService.uploadFile()` | Verificar almacenamiento directo sin sharp | No |
| U-ARCH-03 | getFileContent previene directory traversal | `ArchivoService.getFileContent()` | Verificar rechazo de paths con `..` o rutas absolutas | No |
| U-ARCH-04 | remove solo permite owner o admin | `ArchivoService.remove()` | Verificar control de acceso por propietario | No |
| U-ARCH-05 | remove con usuario no propietario ni admin | `ArchivoService.remove()` | Debe lanzar ForbiddenException | No |
| U-ARCH-06 | findAll con filtro por usuarioId | `ArchivoService.findAll()` | Verificar filtrado por propietario | No |
| U-ARCH-07 | findAll con filtro por mimeType | `ArchivoService.findAll()` | Verificar filtrado por tipo MIME | No |

### 24. Módulo: `alumno`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-ALUM-01 | register valida existencia del CIAL del profesor | `AlumnoService.register()` | Debe lanzar NotFoundException si CIAL no existe | No |
| U-ALUM-02 | register valida disponibilidad del slot | `AlumnoService.register()` | Debe rechazar slot ya ocupado | No |
| U-ALUM-03 | register crea usuario INACTIVE con rol ALUMNO | `AlumnoService.register()` | Verificar status y rol asignado | No |
| U-ALUM-04 | changeProfesor valida autorización del profesor | `AlumnoService.changeProfesor()` | Profesor solo puede cambiar sus propios alumnos | No |
| U-ALUM-05 | changeProfesor admin puede cambiar cualquier alumno | `AlumnoService.changeProfesor()` | Admin bypasea restricción de propiedad | No |
| U-ALUM-06 | changeProfesor valida disponibilidad del nuevo slot | `AlumnoService.changeProfesor()` | Verificar que el nuevo slot no está ocupado | No |

### 25. Módulo: `profesor`

| # | Caso de uso | Servicio/Método | Motivo | Existe similar |
|---|-------------|-----------------|--------|----------------|
| U-PROF-01 | register con CIAL duplicado | `ProfesorService.register()` | Debe lanzar ConflictException | No |
| U-PROF-02 | register con username duplicado | `ProfesorService.register()` | Debe lanzar ConflictException | No |
| U-PROF-03 | register con email duplicado | `ProfesorService.register()` | Debe lanzar ConflictException | No |
| U-PROF-04 | createSlot con slot duplicado (profesor, aula, numeroClase) | `ProfesorService.createSlot()` | Debe rechazar por unique constraint | No |
| U-PROF-05 | activateAlumno de otro profesor | `ProfesorService.activateAlumno()` | Debe rechazar activación de alumno ajeno | No |
| U-PROF-06 | forcePasswordReset genera password temporal | `ProfesorService.forcePasswordReset()` | Verificar longitud y mustChangePassword=true | No |
| U-PROF-07 | forcePasswordReset de alumno de otro profesor | `ProfesorService.forcePasswordReset()` | Debe rechazar reset de alumno ajeno | No |

### 26. Infraestructura: `common/`

| # | Caso de uso | Componente | Motivo | Existe similar |
|---|-------------|------------|--------|----------------|
| U-COM-01 | GlobalExceptionFilter mapea FK violation a 409 | `GlobalExceptionFilter` | Verificar PostgreSQL 23503 → ENTITY_HAS_RELATIONS | No |
| U-COM-02 | GlobalExceptionFilter mapea unique violation a 409 | `GlobalExceptionFilter` | Verificar PostgreSQL 23505 → DUPLICATE_ENTRY | No |
| U-COM-03 | GlobalExceptionFilter captura en Sentry | `GlobalExceptionFilter` | Verificar llamada a Sentry capture | No |
| U-COM-04 | TransformInterceptor formatea respuesta ApiResponse | `TransformInterceptor` | Verificar estructura: success, message, data, meta | No |
| U-COM-05 | CookieInterceptor establece access_token httpOnly | `CookieInterceptor` | Verificar cookie con flags correctos (httpOnly, secure, SameSite) | No |
| U-COM-06 | BaseService.findOne lanza NotFoundException | `BaseService` | Verificar mensaje de error i18n | No |
| U-COM-07 | BaseService.findAll paginación por defecto 20/100 | `BaseService` | Verificar límites de paginación | No |
| U-COM-08 | BaseService.transactional rollback en error | `BaseService` | Verificar atomicidad transaccional | No |
| U-COM-09 | MovimientoHelper.trackInventarioMovimiento | `MovimientoHelper` | Verificar creación correcta de registro de movimiento | No |
| U-COM-10 | IsUnique validator consulta BD | `IsUnique decorator` | Verificar validación async de unicidad | No |
| U-COM-11 | NormalizeDataPipe aplica transformaciones | `NormalizeDataPipe` | Verificar plainToInstance con validation | No |
| U-COM-12 | ColumnNumericTransformer precision handler | `ColumnNumericTransformer` | Verificar conversión DB numeric → JS number | No |

---

## Tests de integración faltantes

> Tests que verifican la interacción correcta entre múltiples servicios/módulos con base de datos real o mockeada.

### 1. Auth + Roles + Permisos (Resolución de permisos)

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-RBAC-01 | Resolución completa de permisos: rol base + plantilla + adicionales − excluidos | Auth, Roles, Permisos, Plantillas | Verificar la fórmula completa de resolución con datos reales | Parcial (rbac.e2e cubre solo adicionales/excluidos, no plantillas) |
| I-RBAC-02 | Invalidación de caché en cascada: cambiar permisos de rol → afecta todos los usuarios con ese rol | Roles, Auth | Verificar que N usuarios pierden caché cuando se modifica un rol | No |
| I-RBAC-03 | Herencia de plantilla de 3 niveles | Plantillas, Permisos | Abuelo→Padre→Hijo hereda permisos sin duplicados | No |
| I-RBAC-04 | Crear rol desde plantilla y asignar a usuario | Plantillas, Roles, Auth | Flujo completo: plantilla → rol → usuario → permisos activos | No |

### 2. Producto + Proveedor + Inventario

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-PROD-01 | Crear producto con múltiples proveedores y verificar en inventario | Producto, Proveedor, Inventario | Verificar que las relaciones ProductoProveedor se reflejan al crear inventario | No |
| I-PROD-02 | Actualizar precio de ProductoProveedor y verificar historial | Producto, Historial | Verificar creación automática de HistorialPrecio tras cambio | No |
| I-PROD-03 | Eliminar proveedor con productos y pedidos vinculados | Proveedor, Producto, Pedido | Verificar restricciones FK y mensaje de error | No |

### 3. Pedido → Recepción → Inventario → Movimiento

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-FLUJO-01 | Flujo completo: Crear pedido → Recibir → Verificar inventario → Verificar movimientos | Pedido, Recepción, Inventario, Movimiento | Flujo de negocio principal del sistema sin testear end-to-end con datos reales | No |
| I-FLUJO-02 | Recepción parcial actualiza estado pedido a PARCIAL | Pedido, Recepción | Verificar transición de estado del pedido | No |
| I-FLUJO-03 | Recepción completa actualiza estado pedido a RECEPCIONADO | Pedido, Recepción | Verificar transición de estado del pedido | No |
| I-FLUJO-04 | Recepción con discrepancia crea incidencia y actualiza estado pedido a INCIDENCIA | Pedido, Recepción, Incidencia | Verificar auto-generación y transición | No |

### 4. Recepción → Incidencia → Resolución

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-INC-01 | Recepción con faltante → Incidencia auto → Resolución DEVOLUCION → Movimiento SALIDA_AJUSTE | Recepción, Incidencia, Movimiento | Flujo completo de resolución con impacto en stock | Parcial (incidencias-recepcion.e2e cubre reportar→resolver pero no flujo automático desde recepción) |
| I-INC-02 | Revertir resolución de incidencia restaura estado | Incidencia | Verificar que remove de IncidenciaResuelta revierte correctamente | No |
| I-INC-03 | Múltiples incidencias por recepción | Recepción, Incidencia | Verificar manejo de varias incidencias simultáneas | No |

### 5. Receta → Inventario → Movimiento (Producción)

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-RECETA-01 | Cocinar receta depleta inventario FIFO y crea movimientos | Receta, Inventario, Movimiento | Verificar consumo por caducidad y registro de movimientos | No |
| I-RECETA-02 | Producción con merma aplica factor correctamente | Receta, Inventario | Verificar que la mermaAplicada incrementa el consumo de ingredientes | No |
| I-RECETA-03 | Producción crea lote con coste real basado en precios de consumo | Receta, Inventario, Producto | Verificar cálculo de costeTotalReal vs escandallo teórico | No |
| I-RECETA-04 | Producción almacena productoResultado en inventario | Receta, Inventario | Verificar creación de inventario para producto final | No |

### 6. Alumno + Profesor + Auth

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-EDU-01 | Registro alumno → Activación profesor → Login alumno → Permisos ALUMNO | Alumno, Profesor, Auth | Flujo educativo completo con verificación de permisos | Parcial (master-requirements, password-recovery) |
| I-EDU-02 | Profesor crea slot → Alumno se registra en slot → Verificar asignación | Profesor, Alumno | Flujo de asignación de aula | No |
| I-EDU-03 | changeProfesor reasigna alumno y libera slot anterior | Alumno, Profesor | Verificar que el slot original queda disponible | No |

### 7. Dashboard con datos reales

| # | Caso de uso | Módulos involucrados | Motivo | Existe similar |
|---|-------------|---------------------|--------|----------------|
| I-DASH-01 | Dashboard stats con inventario, pedidos y movimientos creados | Dashboard, Inventario, Pedido, Movimiento | Verificar que los KPIs reflejan datos reales del sistema | No |
| I-DASH-02 | Dashboard cuenta correctamente alertas de stock bajo | Dashboard, Inventario | Con datos controlados verificar umbral | No |
| I-DASH-03 | Dashboard cuenta correctamente alertas de caducidad | Dashboard, Inventario | Con fechas controladas verificar ventana de 7 días | No |

---

## Tests e2e faltantes

> Tests que ejecutan requests HTTP reales contra la API y verifican respuestas completas incluyendo autenticación, permisos y efectos secundarios.

### 1. Módulo: `auth`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-AUTH-01 | Login con cuenta BLOCKED retorna error específico | `POST /auth/login` | Verificar mensaje diferenciado para cuentas bloqueadas vs inactivas | No (solo testa login correcto/incorrecto) |
| E2E-AUTH-02 | Login exitoso retorna requirePasswordChange=true tras force-reset | `POST /auth/login` | Verificar flag en respuesta de login | Parcial (password-recovery.e2e lo cubre indirectamente) |
| E2E-AUTH-03 | Forgot password con email inexistente retorna 200 (no revela) | `POST /auth/forgot-password` | Patrón de seguridad crítico | No |
| E2E-AUTH-04 | Reset password con token expirado retorna error | `POST /auth/reset-password` | Verificar manejo de expiración después de 15 minutos | No |
| E2E-AUTH-05 | Registro con password débil retorna errores de validación detallados | `POST /auth/register` | Verificar mensajes i18n de validación | Parcial (auth.e2e tiene test básico) |

### 2. Módulo: `admin`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-ADM-01 | Force-reset a usuario inexistente retorna 404 | `POST /admin/users/:id/force-reset` | Verificar manejo de UUID válido pero inexistente | No |
| E2E-ADM-02 | Activar usuario BLOCKED no debería permitirse | `PATCH /admin/users/:id/activate` | Verificar que solo INACTIVE puede activarse | No |
| E2E-ADM-03 | Crear profesor con email duplicado de otro usuario | `POST /admin/profesores` | Verificar unicidad cross-entity | No |

### 3. Módulo: `usuario`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-USR-01 | Eliminar usuario con pedidos/recepciones vinculados | `DELETE /usuarios/:id` | Verificar SET NULL en FK o rechazo | No |
| E2E-USR-02 | Actualizar perfil propio con campos inválidos | `PATCH /usuarios/perfil` | Verificar validación DTO con forbidNonWhitelisted | No |
| E2E-USR-03 | Listar usuarios con paginación page > totalPages | `GET /usuarios?page=999` | Verificar respuesta vacía paginada | No |
| E2E-USR-04 | Agregar permiso adicional inexistente lanza error | `POST /usuarios/:id/permisos-adicionales/:permisoId` | Verificar NotFoundException para permisoId inválido | No |
| E2E-USR-05 | Agregar permiso excluido y verificar que se niega acceso | `POST /usuarios/:id/permisos-excluidos/:permisoId` | Verificar efecto real en acceso al endpoint | Parcial (rbac.e2e cubre caso básico con productos:listar) |

### 4. Módulo: `roles` (sin controller propio — acceso vía admin)

| # | Caso de uso | Endpoint propuesto | Motivo | Existe similar |
|---|-------------|-------------------|--------|----------------|
| E2E-ROL-01 | CRUD completo de roles | `POST/GET/PATCH/DELETE /roles` | No existe ningún test e2e para roles | No |
| E2E-ROL-02 | Asignar permisos a rol y verificar acceso de usuario | `POST /roles/:id/permisos` | Verificar propagación de permisos | No |
| E2E-ROL-03 | Asignar rol a usuario y verificar nuevo acceso | `POST /roles/assign` | Verificar que el usuario hereda los permisos del rol | No |
| E2E-ROL-04 | Eliminar rol de sistema retorna error | `DELETE /roles/:id` | Verificar protección de roles esSistema | No |
| E2E-ROL-05 | Eliminar rol con usuarios asignados retorna error | `DELETE /roles/:id` | Verificar validación de relaciones | No |

### 5. Módulo: `permisos` (sin controller propio)

| # | Caso de uso | Endpoint propuesto | Motivo | Existe similar |
|---|-------------|-------------------|--------|----------------|
| E2E-PERM-01 | CRUD completo de permisos | `POST/GET/PATCH/DELETE /permisos` | No existe ningún test e2e para permisos | No |
| E2E-PERM-02 | Eliminar permiso usado por roles retorna error | `DELETE /permisos/:id` | Verificar protección contra eliminación | No |
| E2E-PERM-03 | Listar permisos agrupados por módulo | `GET /permisos/grouped` | Verificar estructura de agrupación | No |

### 6. Módulo: `plantillas-roles` (sin controller propio)

| # | Caso de uso | Endpoint propuesto | Motivo | Existe similar |
|---|-------------|-------------------|--------|----------------|
| E2E-PLANT-01 | Crear plantilla y generar rol desde ella | `POST /plantillas → POST /plantillas/:id/crear-rol` | No existe ningún test e2e para plantillas | No |
| E2E-PLANT-02 | Verificar herencia de permisos en plantillas encadenadas | Varios | Verificar que la cadena padre→hijo funciona | No |

### 7. Módulo: `producto`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-PROD-01 | Crear producto con proveedores asociados | `POST /productos` | Verificar creación simultánea de relaciones ProductoProveedor | No (test actual no incluye proveedores) |
| E2E-PROD-02 | Crear producto con alergenos | `POST /productos` | Verificar asociación de alergenos en creación | No |
| E2E-PROD-03 | Listar con filtro por categoría (tipo) | `GET /productos?tipo=verdura` | Verificar filtrado por TipoProducto | No |
| E2E-PROD-04 | Listar con filtro por marca | `GET /productos?marca=X` | Verificar filtrado por marca | No |
| E2E-PROD-05 | Listar con filtro por alergeno | `GET /productos?alergenos=GLUTEN` | Verificar filtrado por alergenos | No |
| E2E-PROD-06 | Listar con filtro por stock mínimo | `GET /productos?minStock=true` | Verificar join con inventario | No |
| E2E-PROD-07 | Actualizar producto cambiando proveedores | `PATCH /productos/:id` | Verificar sync de relaciones ProductoProveedor | No |
| E2E-PROD-08 | Obtener detalle con proveedores y alergenos cargados | `GET /productos/:id` | Verificar carga de relaciones en respuesta | No |

### 8. Módulo: `producto-proveedor`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-PP-01 | Actualizar precio exitoso y verificar historial creado | `PATCH /producto-proveedor/:id/precio` | Verificar flujo completo precio→historial | No (solo testa 404) |
| E2E-PP-02 | Actualizar precio con mismo valor retorna error | `PATCH /producto-proveedor/:id/precio` | Verificar ConflictException para no-op | No |
| E2E-PP-03 | Search con resultados correctos | `GET /producto-proveedor/search?q=X` | Verificar autocomplete funcional | No |
| E2E-PP-04 | Historial paginado con orden DESC | `GET /producto-proveedor/:id/historial` | Verificar paginación y orden | No |

### 9. Módulo: `producto-alergeno`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-PALERG-01 | CRUD completo de alergenos de producto | `/producto-alergenos` | No existe ningún test e2e para alergenos | No |
| E2E-PALERG-02 | Reemplazar todos los alergenos de un producto | `PATCH /producto-alergenos/:id` | Verificar delete-then-create | No |
| E2E-PALERG-03 | Crear asociación duplicada retorna error | `POST /producto-alergenos` | Verificar PK compuesta | No |

### 10. Módulo: `historial-precio`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-HIST-01 | CRUD completo de historial de precios | `/historial-precio` | No existe ningún test e2e para historial | No |
| E2E-HIST-02 | Crear con precio negativo retorna error | `POST /historial-precio` | Verificar validación de precio >= 0 | No |

### 11. Módulo: `pedido`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-PED-01 | Crear pedido con líneas de otro proveedor retorna error | `POST /pedidos` | Verificar validación de pertenencia al proveedor | No |
| E2E-PED-02 | Crear pedido con producto sin precio retorna error | `POST /pedidos` | Verificar ConflictException por precioUnitario=null | No |
| E2E-PED-03 | Obtener detalle de pedido con todas las relaciones | `GET /pedidos/:id` | Verificar carga de usuario, proveedor, líneas con productos | No |
| E2E-PED-04 | Actualizar líneas del pedido recalcula costeTotal | `PATCH /pedidos/:id` | Verificar recálculo automático | No |
| E2E-PED-05 | Cancelar pedido en estado POR_RECEPCIONAR retorna error | `PATCH /pedidos/:id/cancelar` | Verificar restricción de transición de estado | No |
| E2E-PED-06 | Eliminar pedido en estado RECEPCIONADO retorna error | `DELETE /pedidos/:id` | Verificar restricción de estado | No |
| E2E-PED-07 | Crear pedido con 0 líneas retorna error | `POST /pedidos` | Verificar validación mínima de líneas | No |

### 12. Módulo: `recepcion`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-REC-01 | Recepción masiva exitosa crea inventario y movimientos | `POST /recepcion` | **CASO CRÍTICO**: el flujo principal del sistema solo testa errores | No |
| E2E-REC-02 | Recepción masiva con faltante genera incidencia automática | `POST /recepcion` | Verificar auto-detección de discrepancia y creación de incidencia | No |
| E2E-REC-03 | Recepción masiva con exceso genera incidencia automática | `POST /recepcion` | Verificar auto-detección de exceso | No |
| E2E-REC-04 | Recepción masiva con defectuoso genera incidencia | `POST /recepcion` | Verificar estadoVisual ROTO/DEFECTUOSO | No |
| E2E-REC-05 | Recepción determina estado COMPLETADA | `POST /recepcion` | Cuando todo coincide → estado correcto | No |
| E2E-REC-06 | Recepción determina estado PARCIAL | `POST /recepcion` | Cuando faltan cantidades | No |
| E2E-REC-07 | Recepción crea albarán automáticamente | `POST /recepcion` | Cuando se proporciona nAlbaran | No |
| E2E-REC-08 | Recepción actualiza estado del pedido | `POST /recepcion` | Verificar transición POR_RECEPCIONAR → PARCIAL / RECEPCIONADO | No |
| E2E-REC-09 | Listar recepciones paginadas | `GET /recepcion` | Solo testa errores actualmente | No |
| E2E-REC-10 | Obtener detalle de recepción con productos | `GET /recepcion/:id` | Verificar carga de relaciones | No |
| E2E-REC-11 | CRUD de recepcion-productos | `/recepcion-productos` | No existe test para el sub-controlador | No |

### 13. Módulo: `albaran`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-ALB-01 | Crear albarán con nAlbaran duplicado retorna error | `POST /albaranes` | Verificar unique constraint | No |
| E2E-ALB-02 | Actualizar campo concordancia | `PATCH /albaranes/:id` | Verificar update del boolean de concordancia | No |

### 14. Módulo: `incidencia`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-INC-01 | Modificar incidencia resuelta retorna error | `PATCH /incidencias/:id` | Verificar protección de incidencias resueltas | No |
| E2E-INC-02 | Eliminar incidencia resuelta retorna error | `DELETE /incidencias/:id` | Verificar protección de incidencias resueltas | No |
| E2E-INC-03 | Resolución transaccional con ABONO no genera movimiento | `POST /incidencias/:id/resolver` | Verificar que solo DEVOLUCION genera SALIDA_AJUSTE | No |
| E2E-INC-04 | CRUD completo de incidencias-resueltas | `/incidencias-resueltas` | No existe ningún test e2e para incidencias resueltas | No |
| E2E-INC-05 | Eliminar incidencia-resuelta revierte estado de incidencia | `DELETE /incidencias-resueltas/:id` | Verificar reversión de resolución | No |
| E2E-INC-06 | Reportar incidencia manual establece flag en recepción | `POST /incidencias/reportar` | Verificar actualización del flag incidencia en recepción | Parcial (incidencias-recepcion.e2e lo cubre mínimamente) |
| E2E-INC-07 | Verificar IncidenciaLinea con estadoReclamacion tracking | `/incidencias` | Verificar estados PENDIENTE→RECLAMADO→ABONADO/REENVIADO | No |

### 15. Módulo: `inventario`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-INV-01 | Crear inventario con ProductoProveedor inexistente retorna error | `POST /inventario` | Verificar validación de FK | No |
| E2E-INV-02 | Crear inventario verifica generación de movimiento ENTRADA | `POST /inventario` | Verificar efecto secundario en movimientos | No |
| E2E-INV-03 | Actualizar cantidad verifica generación de movimiento AJUSTE | `PATCH /inventario/:id` | Verificar movimiento automático | No |
| E2E-INV-04 | Alertas de caducidad con fecha exacta a 7 días | `GET /alertas/caducidad` | Verificar edge case del umbral | No |
| E2E-INV-05 | Alertas de stock con cantidadActual = cantidadMinima | `GET /alertas/stock` | Verificar edge case (igual al mínimo ¿es bajo stock?) | No |
| E2E-INV-06 | Eliminar inventario con cantidad > 0 genera movimiento SALIDA | `DELETE /inventario/:id` | Verificar tracking de salida | No |

### 16. Módulo: `ubicacion`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-UBI-01 | Crear ubicación con nombre duplicado retorna error | `POST /ubicacion` | Verificar unique constraint | No |
| E2E-UBI-02 | Eliminar ubicación con inventario asignado retorna error | `DELETE /ubicacion/:id` | Verificar FK RESTRICT | No |
| E2E-UBI-03 | Restaurar ubicación no eliminada | `POST /ubicacion/:id/restore` | Verificar comportamiento con entidad activa | No |

### 17. Módulo: `receta`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-RECETA-01 | Calcular escandallo con precios reales | `GET /recetas/:id/escandallo` | **CASO CRÍTICO**: funcionalidad de negocio clave sin test | No |
| E2E-RECETA-02 | Cocinar receta exitosamente | `POST /recetas/:id/cocinar` | **CASO CRÍTICO**: operación principal sin test | No |
| E2E-RECETA-03 | Cocinar receta sin stock suficiente | `POST /recetas/:id/cocinar` | Verificar error por stock insuficiente | No |
| E2E-RECETA-04 | Ejecutar producción completa | `POST /produccion/ejecutar` | **CASO CRÍTICO**: producción nunca testeada | No |
| E2E-RECETA-05 | Obtener detalle con niveles de stock | `GET /recetas/:id/detalle` | Verificar información de stock por ingrediente | No |
| E2E-RECETA-06 | Recalcular costes actualiza costeUnitarioEstimado | `POST /recetas/:id/recalcular-costes` | Verificar actualización del campo | No |
| E2E-RECETA-07 | Listar lotes de producción | `GET /produccion` | Sub-módulo sin tests | No |
| E2E-RECETA-08 | Obtener detalle de lote de producción | `GET /produccion/:id` | Sub-módulo sin tests | No |

### 18. Módulo: `dashboard`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-DASH-01 | Stats con datos controlados verifica valores numéricos exactos | `GET /dashboard/stats` | Test actual solo verifica estructura, no exactitud numérica | No |
| E2E-DASH-02 | Stats sin datos retorna ceros | `GET /dashboard/stats` | Verificar resiliencia con BD vacía | No |
| E2E-DASH-03 | Stats verifica últimos 5 movimientos en orden correcto | `GET /dashboard/stats` | Verificar ordenamiento DESC y límite | No |
| E2E-DASH-04 | Stats con permisos insuficientes retorna 403 | `GET /dashboard/stats` | Verificar RBAC del endpoint con rol sin permiso | No |

### 19. Módulo: `archivo`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-ARCH-01 | Upload con procesamiento de imagen | `POST /archivos/upload` | Verificar resize y conversión de formato | No |
| E2E-ARCH-02 | Servir contenido de archivo existente | `GET /archivos/content/:filename` | Verificar descarga/streaming del archivo | No |
| E2E-ARCH-03 | Servir contenido con path traversal retorna error | `GET /archivos/content/../../../etc/passwd` | **SEGURIDAD**: verificar prevención de directory traversal | No |
| E2E-ARCH-04 | Eliminar archivo de otro usuario sin ser admin retorna error | `DELETE /archivos/:id` | Verificar control de acceso por propietario | No |
| E2E-ARCH-05 | Listar archivos filtrados por mimeType | `GET /archivos?mimeType=image/png` | Verificar filtrado | No |
| E2E-ARCH-06 | Listar archivos filtrados por usuarioId | `GET /archivos?usuarioId=X` | Verificar filtrado por propietario | No |

### 20. Módulo: `alumno`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-ALUM-01 | Registrar alumno con slot ya ocupado retorna error | `POST /alumnos/register` | Verificar conflicto de slot | No |
| E2E-ALUM-02 | Registrar alumno con username duplicado retorna error | `POST /alumnos/register` | Verificar unicidad de usuario | No |
| E2E-ALUM-03 | Cambiar profesor del alumno exitosamente | `PATCH /alumnos/change-profesor` | **Endpoint sin test alguno** | No |
| E2E-ALUM-04 | Cambiar profesor: profesor no puede cambiar alumno ajeno | `PATCH /alumnos/change-profesor` | Verificar autorización | No |
| E2E-ALUM-05 | Cambiar profesor: admin puede cambiar cualquier alumno | `PATCH /alumnos/change-profesor` | Verificar bypass admin | No |
| E2E-ALUM-06 | Cambiar profesor con slot destino ocupado retorna error | `PATCH /alumnos/change-profesor` | Verificar disponibilidad del nuevo slot | No |

### 21. Módulo: `profesor`

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-PROF-01 | Registrar profesor con CIAL duplicado retorna error | `POST /profesores/register` | Verificar unicidad de CIAL | No |
| E2E-PROF-02 | Registrar profesor con email duplicado retorna error | `POST /profesores/register` | Verificar unicidad cross-entity | No |
| E2E-PROF-03 | Crear slot duplicado (misma aula + numeroClase) retorna error | `POST /profesores/slots` | Verificar unique constraint | No |
| E2E-PROF-04 | Activar alumno de otro profesor retorna error | `PATCH /profesores/alumnos/:id/activate` | Verificar aislamiento entre profesores | Parcial (password-recovery.e2e tiene caso similar) |
| E2E-PROF-05 | Force-reset de alumno de otro profesor retorna error | `POST /profesores/alumnos/:id/force-reset` | Verificar aislamiento entre profesores | Parcial (password-recovery.e2e tiene caso similar) |

### 22. Seguridad y Transversales

| # | Caso de uso | Endpoint | Motivo | Existe similar |
|---|-------------|----------|--------|----------------|
| E2E-SEC-01 | Acceso sin token a todos los endpoints protegidos → 401 | Todos | Verificar que ningún endpoint protegido permite acceso anónimo | Parcial (dashboard, movimientos tienen caso individual) |
| E2E-SEC-02 | Password hash nunca aparece en respuestas GET | `GET /usuarios/*` | **SEGURIDAD**: prevenir filtración de hashes | Parcial (master-requirements SEC-02) |
| E2E-SEC-03 | Token JWT expirado retorna 401 | Cualquiera protegido | Verificar expiración de tokens | No |
| E2E-SEC-04 | Token JWT malformado retorna 401 | Cualquiera protegido | Verificar manejo de tokens inválidos | No |
| E2E-SEC-05 | Rate limiting en endpoints de auth | `POST /auth/login, /auth/forgot-password` | Si existe rate limiting, verificar que funciona | No |
| E2E-SEC-06 | Optimistic locking con @Version previene actualizaciones concurrentes | Cualquier PATCH | Verificar manejo de conflictos de versión | No |
| E2E-SEC-07 | Respuestas incluyen x-request-id header | Cualquier endpoint | Verificar trazabilidad de requests | No |
| E2E-SEC-08 | Cookie access_token con httpOnly y secure flags | `POST /auth/login` | **SEGURIDAD**: verificar flags de cookie | No |
| E2E-SEC-09 | Validación global rechaza campos no permitidos (forbidNonWhitelisted) | Cualquier POST/PATCH | Verificar que campos extras son rechazados | No |

---

## Resumen estadístico

| Categoría | Total identificado |
|-----------|-------------------|
| **Tests unitarios faltantes** | 165 |
| **Tests de integración faltantes** | 25 |
| **Tests e2e faltantes** | 97 |
| **TOTAL tests faltantes** | **287** |

### Prioridades recomendadas

**Prioridad CRÍTICA** (sin cobertura alguna en funcionalidad core):
1. `RecepcionStockService.procesarRecepcionMasiva()` — Flujo principal del sistema sin tests de éxito
2. `RecetaService.cocinar()` — Operación de producción sin ningún test
3. `ProduccionService.ejecutarProduccion()` — Producción con merma sin ningún test
4. `RecetaService.calcularEscandallo()` — Cálculo de costes sin ningún test
5. Módulos `roles`, `permisos`, `plantillas-roles` — 0 tests unitarios y 0 tests e2e

**Prioridad ALTA** (lógica de negocio compleja sin tests unitarios):
1. `AuthPermissionsService` — Resolución de permisos con caché, herencia y exclusiones
2. `PedidoService` — Validaciones de estado, cálculo de costes, transacciones
3. `IncidenciaService` — Resolución transaccional con movimientos
4. `InventarioService` — Movimientos automáticos en CRUD
5. `ArchivoService` — Procesamiento de imágenes y seguridad de paths

**Prioridad MEDIA** (CRUD con validaciones de negocio):
1. `ProductoService` — Filtros combinados, sincronización de proveedores
2. `ProveedorService` — Validaciones de unicidad y relaciones
3. `AlumnoService` / `ProfesorService` — Flujos educativos y autorización
4. `DashboardService` — Exactitud de KPIs con datos reales
5. Guards y decoradores de autenticación/autorización

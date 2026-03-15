# RBAC - Role-Based Access Control

Este documento es la documentación exhaustiva y canónica del sistema RBAC del backend.
Contiene la lista completa de permisos, definición de plantillas de roles, la relación rol ↔ permisos, y el flujo de autorización — TODO basado estrictamente en el código fuente.

**Referencias de código**
- `require-permissions` / metadatos: [backend/smart-economat-backend/src/common/decorators/require-permissions.decorator.ts](backend/smart-economat-backend/src/common/decorators/require-permissions.decorator.ts)
- `require-any-permission` / OR mode: [backend/smart-economat-backend/src/common/decorators/require-any-permission.decorator.ts](backend/smart-economat-backend/src/common/decorators/require-any-permission.decorator.ts)
- `controller-permissions` (permisos por controlador): [backend/smart-economat-backend/src/common/decorators/controller-permissions.decorator.ts](backend/smart-economat-backend/src/common/decorators/controller-permissions.decorator.ts)
- Guard de permisos (PermisosGuard / AuthPermissionsGuard): [backend/smart-economat-backend/src/modules/auth/guards/auth-permissions.guard.ts](backend/smart-economat-backend/src/modules/auth/guards/auth-permissions.guard.ts)
- Servicio de permisos (cache + carga desde BD): [backend/smart-economat-backend/src/modules/auth/service/auth-permissions.service.ts](backend/smart-economat-backend/src/modules/auth/service/auth-permissions.service.ts)
- Seeder que define los permisos base y crea plantillas de roles: [backend/smart-economat-backend/src/seeders/roles-permisos.seeder.ts](backend/smart-economat-backend/src/seeders/roles-permisos.seeder.ts)
- Entidad `Permiso`: [backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity.ts](backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity.ts)
- Entidad `PlantillaRol`: [backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity.ts](backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity.ts)
- Entidad `Rol` (roles custom): [backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity.ts](backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity.ts)
- Entidad `Usuario` (campo `rol`, `permisosAdicionales`, `permisosExcluidos`, `roles`): [backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity.ts](backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity.ts)
- Decorador `Roles` y guard `RolesGuard`: [backend/smart-economat-backend/src/modules/auth/decorators/roles.decorator.ts](backend/smart-economat-backend/src/modules/auth/decorators/roles.decorator.ts) y [backend/smart-economat-backend/src/modules/auth/guards/role.guard.ts](backend/smart-economat-backend/src/modules/auth/guards/role.guard.ts)

**Resumen ejecutivo (estricto al código)**
- Fuente única de verdad de los permisos base: la constante `PERMISOS_BASE` en el seeder: [roles-permisos.seeder.ts](backend/smart-economat-backend/src/seeders/roles-permisos.seeder.ts).
- Plantillas de roles (creadas por el seeder): `SUPER_ADMIN`, y plantillas derivadas de los valores del enum `rolUsuario` (`ADMIN`, `PROFESOR`, `ALUMNO`).
- La validación en runtime se realiza mediante el guard `AuthPermissionsGuard` (alias `PermisosGuard`) que lee metadata de permisos (metadato `permissions`) y consulta `AuthPermissionsService` que combina: permisos de roles asignados, permisos desde plantilla ligada al campo `usuario.rol`, permisos adicionales del usuario y exclusiones.

**Cómo usar esta documentación**
- Para ver la definición canonical de cada permiso, consulte la sección "Lista completa de permisos" abajo (copia literal de `PERMISOS_BASE`).
- Para entender qué roles incluyen qué permisos, consulte la sección "Plantillas de roles y reglas de inclusión".

**Lista completa de permisos (definición en el código)**

La lista siguiente es la copia literal de `PERMISOS_BASE` encontrada en el seeder `roles-permisos.seeder.ts`. Cada entrada incluye `codigo`, `nombre`, `modulo`, `accion`, `descripcion`.

```ts
/* PERMISOS_BASE (extracto literal) */
[
  { codigo: 'usuarios:listar', nombre: 'Listar usuarios', modulo: 'usuarios', accion: 'listar', descripcion: 'Ver listado de usuarios del sistema' },
  { codigo: 'usuarios:ver', nombre: 'Ver usuario', modulo: 'usuarios', accion: 'ver', descripcion: 'Ver detalles de un usuario' },
  { codigo: 'usuarios:crear', nombre: 'Crear usuario', modulo: 'usuarios', accion: 'crear', descripcion: 'Crear nuevos usuarios' },
  { codigo: 'usuarios:editar', nombre: 'Editar usuario', modulo: 'usuarios', accion: 'editar', descripcion: 'Modificar datos de usuarios' },
  { codigo: 'usuarios:eliminar', nombre: 'Eliminar usuario', modulo: 'usuarios', accion: 'eliminar', descripcion: 'Eliminar usuarios del sistema' },
  { codigo: 'usuarios:cambiar_rol', nombre: 'Cambiar rol', modulo: 'usuarios', accion: 'cambiar_rol', descripcion: 'Modificar roles de usuarios' },
  { codigo: 'usuarios:resetear_password', nombre: 'Resetear contraseña', modulo: 'usuarios', accion: 'resetear_password', descripcion: 'Resetear contraseñas de usuarios' },
  { codigo: 'usuarios:activar_desactivar', nombre: 'Activar/Desactivar', modulo: 'usuarios', accion: 'activar_desactivar', descripcion: 'Activar o desactivar usuarios' },

  { codigo: 'productos:listar', nombre: 'Listar productos', modulo: 'productos', accion: 'listar', descripcion: 'Ver listado de productos' },
  { codigo: 'productos:ver', nombre: 'Ver producto', modulo: 'productos', accion: 'ver', descripcion: 'Ver detalles de un producto' },
  { codigo: 'productos:crear', nombre: 'Crear producto', modulo: 'productos', accion: 'crear', descripcion: 'Añadir nuevos productos' },
  { codigo: 'productos:editar', nombre: 'Editar producto', modulo: 'productos', accion: 'editar', descripcion: 'Modificar productos existentes' },
  { codigo: 'productos:eliminar', nombre: 'Eliminar producto', modulo: 'productos', accion: 'eliminar', descripcion: 'Eliminar productos' },
  { codigo: 'productos:generar_ean13', nombre: 'Generar EAN-13', modulo: 'productos', accion: 'generar_ean13', descripcion: 'Generar códigos de barras EAN-13' },
  { codigo: 'productos:gestionar_alergenos', nombre: 'Gestionar alérgenos', modulo: 'productos', accion: 'gestionar_alergenos', descripcion: 'Añadir/modificar alérgenos de productos' },
  { codigo: 'productos:gestionar_proveedores', nombre: 'Gestionar proveedores', modulo: 'productos', accion: 'gestionar_proveedores', descripcion: 'Vincular productos con proveedores' },

  { codigo: 'pedidos:listar', nombre: 'Listar pedidos', modulo: 'pedidos', accion: 'listar', descripcion: 'Ver listado de pedidos' },
  { codigo: 'pedidos:ver', nombre: 'Ver pedido', modulo: 'pedidos', accion: 'ver', descripcion: 'Ver detalles de un pedido' },
  { codigo: 'pedidos:crear', nombre: 'Crear pedido', modulo: 'pedidos', accion: 'crear', descripcion: 'Crear nuevos pedidos' },
  { codigo: 'pedidos:editar', nombre: 'Editar pedido', modulo: 'pedidos', accion: 'editar', descripcion: 'Modificar pedidos existentes' },
  { codigo: 'pedidos:eliminar', nombre: 'Eliminar pedido', modulo: 'pedidos', accion: 'eliminar', descripcion: 'Eliminar pedidos' },
  { codigo: 'pedidos:cancelar', nombre: 'Cancelar pedido', modulo: 'pedidos', accion: 'cancelar', descripcion: 'Cancelar pedidos realizados' },
  { codigo: 'pedidos:actualizar_fecha_entrega', nombre: 'Actualizar fecha entrega', modulo: 'pedidos', accion: 'actualizar_fecha_entrega', descripcion: 'Modificar fechas de entrega' },

  { codigo: 'inventario:listar', nombre: 'Listar inventario', modulo: 'inventario', accion: 'listar', descripcion: 'Ver inventario completo' },
  { codigo: 'inventario:ver', nombre: 'Ver detalle inventario', modulo: 'inventario', accion: 'ver', descripcion: 'Ver detalles de inventario' },
  { codigo: 'inventario:ajustar_stock', nombre: 'Ajustar stock', modulo: 'inventario', accion: 'ajustar_stock', descripcion: 'Realizar ajustes de stock' },
  { codigo: 'inventario:ver_alertas', nombre: 'Ver alertas', modulo: 'inventario', accion: 'ver_alertas', descripcion: 'Ver alertas de stock bajo' },
  { codigo: 'inventario:gestionar_ubicaciones', nombre: 'Gestionar ubicaciones', modulo: 'inventario', accion: 'gestionar_ubicaciones', descripcion: 'Gestionar ubicaciones de almacén' },
  { codigo: 'inventario:crear', nombre: 'Crear item inventario', modulo: 'inventario', accion: 'crear', descripcion: 'Añadir items al inventario' },
  { codigo: 'inventario:editar', nombre: 'Editar item inventario', modulo: 'inventario', accion: 'editar', descripcion: 'Modificar items del inventario' },
  { codigo: 'inventario:eliminar', nombre: 'Eliminar item inventario', modulo: 'inventario', accion: 'eliminar', descripcion: 'Eliminar items del inventario' },

  { codigo: 'movimientos:listar', nombre: 'Listar movimientos', modulo: 'movimientos', accion: 'listar', descripcion: 'Ver historial de movimientos' },
  { codigo: 'movimientos:ver', nombre: 'Ver movimiento', modulo: 'movimientos', accion: 'ver', descripcion: 'Ver detalles de un movimiento' },
  { codigo: 'movimientos:crear', nombre: 'Crear movimiento', modulo: 'movimientos', accion: 'crear', descripcion: 'Registrar movimientos de stock' },
  { codigo: 'movimientos:editar', nombre: 'Editar movimiento', modulo: 'movimientos', accion: 'editar', descripcion: 'Ajustar movimientos registrados' },
  { codigo: 'movimientos:eliminar', nombre: 'Eliminar movimiento', modulo: 'movimientos', accion: 'eliminar', descripcion: 'Eliminar movimientos' },

  { codigo: 'recepciones:listar', nombre: 'Listar recepciones', modulo: 'recepciones', accion: 'listar', descripcion: 'Ver recepciones realizadas' },
  { codigo: 'recepciones:ver', nombre: 'Ver recepción', modulo: 'recepciones', accion: 'ver', descripcion: 'Ver detalles de una recepción' },
  { codigo: 'recepciones:crear', nombre: 'Crear recepción', modulo: 'recepciones', accion: 'crear', descripcion: 'Registrar nuevas recepciones' },
  { codigo: 'recepciones:editar', nombre: 'Editar recepción', modulo: 'recepciones', accion: 'editar', descripcion: 'Modificar recepciones' },
  { codigo: 'recepciones:confirmar', nombre: 'Confirmar recepción', modulo: 'recepciones', accion: 'confirmar', descripcion: 'Confirmar recepciones de pedidos' },
  { codigo: 'recepciones:eliminar', nombre: 'Eliminar recepción', modulo: 'recepciones', accion: 'eliminar', descripcion: 'Eliminar recepciones' },

  { codigo: 'proveedores:listar', nombre: 'Listar proveedores', modulo: 'proveedores', accion: 'listar', descripcion: 'Ver listado de proveedores' },
  { codigo: 'proveedores:ver', nombre: 'Ver proveedor', modulo: 'proveedores', accion: 'ver', descripcion: 'Ver detalles de un proveedor' },
  { codigo: 'proveedores:crear', nombre: 'Crear proveedor', modulo: 'proveedores', accion: 'crear', descripcion: 'Añadir nuevos proveedores' },
  { codigo: 'proveedores:editar', nombre: 'Editar proveedor', modulo: 'proveedores', accion: 'editar', descripcion: 'Modificar datos de proveedores' },
  { codigo: 'proveedores:eliminar', nombre: 'Eliminar proveedor', modulo: 'proveedores', accion: 'eliminar', descripcion: 'Eliminar proveedores' },

  { codigo: 'incidencias:listar', nombre: 'Listar incidencias', modulo: 'incidencias', accion: 'listar', descripcion: 'Ver listado de incidencias' },
  { codigo: 'incidencias:ver', nombre: 'Ver incidencia', modulo: 'incidencias', accion: 'ver', descripcion: 'Ver detalles de una incidencia' },
  { codigo: 'incidencias:crear', nombre: 'Crear incidencia', modulo: 'incidencias', accion: 'crear', descripcion: 'Registrar nuevas incidencias' },
  { codigo: 'incidencias:resolver', nombre: 'Resolver incidencia', modulo: 'incidencias', accion: 'resolver', descripcion: 'Marcar incidencias como resueltas' },
  { codigo: 'incidencias:eliminar', nombre: 'Eliminar incidencia', modulo: 'incidencias', accion: 'eliminar', descripcion: 'Eliminar incidencias' },
  { codigo: 'incidencias:editar', nombre: 'Editar incidencia', modulo: 'incidencias', accion: 'editar', descripcion: 'Modificar datos de una incidencia' },

  { codigo: 'merma:listar', nombre: 'Listar mermas', modulo: 'merma', accion: 'listar', descripcion: 'Ver listado de mermas registradas' },
  { codigo: 'merma:ver', nombre: 'Ver merma', modulo: 'merma', accion: 'ver', descripcion: 'Ver detalles de una merma' },
  { codigo: 'merma:crear', nombre: 'Crear merma', modulo: 'merma', accion: 'crear', descripcion: 'Registrar una merma y descontar stock' },
  { codigo: 'merma:stats', nombre: 'Ver estadísticas de merma', modulo: 'merma', accion: 'stats', descripcion: 'Consultar estadísticas agregadas de mermas' },

  { codigo: 'recetas:listar', nombre: 'Listar recetas', modulo: 'recetas', accion: 'listar', descripcion: 'Ver recetas disponibles' },
  { codigo: 'recetas:ver', nombre: 'Ver receta', modulo: 'recetas', accion: 'ver', descripcion: 'Ver detalles de una receta' },
  { codigo: 'recetas:crear', nombre: 'Crear receta', modulo: 'recetas', accion: 'crear', descripcion: 'Crear nuevas recetas' },
  { codigo: 'recetas:editar', nombre: 'Editar receta', modulo: 'recetas', accion: 'editar', descripcion: 'Modificar recetas existentes' },
  { codigo: 'recetas:eliminar', nombre: 'Eliminar receta', modulo: 'recetas', accion: 'eliminar', descripcion: 'Eliminar recetas' },
  { codigo: 'recetas:producir', nombre: 'Producir receta', modulo: 'recetas', accion: 'producir', descripcion: 'Ejecutar producción de recetas' },

  { codigo: 'albaranes:listar', nombre: 'Listar albaranes', modulo: 'albaranes', accion: 'listar', descripcion: 'Ver listado de albaranes' },
  { codigo: 'albaranes:ver', nombre: 'Ver albarán', modulo: 'albaranes', accion: 'ver', descripcion: 'Ver detalles de un albarán' },
  { codigo: 'albaranes:crear', nombre: 'Crear albarán', modulo: 'albaranes', accion: 'crear', descripcion: 'Crear nuevos albaranes' },
  { codigo: 'albaranes:eliminar', nombre: 'Eliminar albarán', modulo: 'albaranes', accion: 'eliminar', descripcion: 'Eliminar albaranes' },
  { codigo: 'albaranes:editar', nombre: 'Editar albarán', modulo: 'albaranes', accion: 'editar', descripcion: 'Modificar datos de albaranes' },

  { codigo: 'archivos:subir', nombre: 'Subir archivos', modulo: 'archivos', accion: 'subir', descripcion: 'Subir archivos al sistema' },
  { codigo: 'archivos:listar', nombre: 'Listar archivos', modulo: 'archivos', accion: 'listar', descripcion: 'Ver archivos subidos' },
  { codigo: 'archivos:descargar', nombre: 'Descargar archivos', modulo: 'archivos', accion: 'descargar', descripcion: 'Descargar archivos del sistema' },
  { codigo: 'archivos:eliminar', nombre: 'Eliminar archivos', modulo: 'archivos', accion: 'eliminar', descripcion: 'Eliminar archivos' },

  { codigo: 'dashboard:ver_estadisticas', nombre: 'Ver estadísticas', modulo: 'dashboard', accion: 'ver_estadisticas', descripcion: 'Acceder al dashboard de estadísticas' },
  { codigo: 'dashboard:exportar_reportes', nombre: 'Exportar reportes', modulo: 'dashboard', accion: 'exportar_reportes', descripcion: 'Exportar reportes y estadísticas' },

  { codigo: 'roles:listar', nombre: 'Listar roles', modulo: 'roles', accion: 'listar', descripcion: 'Ver roles del sistema' },
  { codigo: 'roles:ver', nombre: 'Ver rol', modulo: 'roles', accion: 'ver', descripcion: 'Ver detalles de un rol' },
  { codigo: 'roles:crear', nombre: 'Crear rol', modulo: 'roles', accion: 'crear', descripcion: 'Crear nuevos roles' },
  { codigo: 'roles:editar', nombre: 'Editar rol', modulo: 'roles', accion: 'editar', descripcion: 'Modificar roles existentes' },
  { codigo: 'roles:eliminar', nombre: 'Eliminar rol', modulo: 'roles', accion: 'eliminar', descripcion: 'Eliminar roles' },
  { codigo: 'roles:asignar', nombre: 'Asignar roles', modulo: 'roles', accion: 'asignar', descripcion: 'Asignar roles a usuarios' },

  { codigo: 'permisos:listar', nombre: 'Listar permisos', modulo: 'permisos', accion: 'listar', descripcion: 'Ver permisos disponibles' },
  { codigo: 'permisos:ver', nombre: 'Ver permiso', modulo: 'permisos', accion: 'ver', descripcion: 'Ver detalles de permisos' },
  { codigo: 'permisos:gestionar', nombre: 'Gestionar permisos', modulo: 'permisos', accion: 'gestionar', descripcion: 'Crear/editar permisos del sistema' },

  { codigo: 'profesor:gestionar_slots', nombre: 'Gestionar slots', modulo: 'profesor', accion: 'gestionar_slots', descripcion: 'Crear y gestionar slots de alumnos' },
  { codigo: 'profesor:gestionar_alumnos', nombre: 'Gestionar alumnos', modulo: 'profesor', accion: 'gestionar_alumnos', descripcion: 'Activar alumnos y resetear contraseñas' },
  { codigo: 'profesor:ver_alumnos', nombre: 'Ver alumnos', modulo: 'profesor', accion: 'ver_alumnos', descripcion: 'Ver listado de alumnos asignados' },

  { codigo: 'recetas:duplicar', nombre: 'Duplicar receta', modulo: 'recetas', accion: 'duplicar', descripcion: 'Duplicar una receta existente' },
  { codigo: 'recetas:cocinar', nombre: 'Cocinar receta', modulo: 'recetas', accion: 'cocinar', descripcion: 'Registrar la producción/cocinado de una receta' },

  { codigo: 'incidencias:resolver', nombre: 'Resolver incidencia', modulo: 'incidencias', accion: 'resolver', descripcion: 'Marcar una incidencia como resuelta' },
  { codigo: 'movimientos:historial', nombre: 'Ver historial de movimientos', modulo: 'movimientos', accion: 'historial', descripcion: 'Ver trazabilidad detallada de movimientos' },

  { codigo: 'archivos:ver', nombre: 'Ver archivo', modulo: 'archivos', accion: 'ver', descripcion: 'Ver detalle o descargar contenido de un archivo' },

  { codigo: 'ubicaciones:listar', nombre: 'Listar ubicaciones', modulo: 'ubicaciones', accion: 'listar', descripcion: 'Ver listado de ubicaciones' },
  { codigo: 'ubicaciones:ver', nombre: 'Ver ubicación', modulo: 'ubicaciones', accion: 'ver', descripcion: 'Ver detalles de una ubicación' },
  { codigo: 'ubicaciones:crear', nombre: 'Crear ubicación', modulo: 'ubicaciones', accion: 'crear', descripcion: 'Añadir nuevas ubicaciones' },
  { codigo: 'ubicaciones:editar', nombre: 'Editar ubicación', modulo: 'ubicaciones', accion: 'editar', descripcion: 'Modificar ubicaciones existentes' },
  { codigo: 'ubicaciones:eliminar', nombre: 'Eliminar ubicación', modulo: 'ubicaciones', accion: 'eliminar', descripcion: 'Eliminar ubicaciones (soft delete)' },
  { codigo: 'ubicaciones:restaurar', nombre: 'Restaurar ubicación', modulo: 'ubicaciones', accion: 'restaurar', descripcion: 'Restaurar ubicaciones eliminadas' },

  { codigo: 'alumno:cambiar_profesor', nombre: 'Cambiar profesor', modulo: 'alumno', accion: 'cambiar_profesor', descripcion: 'Cambiar el profesor asignado al alumno' },
]
```

**Nota:** El bloque anterior fue copiado literalmente desde `PERMISOS_BASE` del seeder; por tanto representa el conjunto canon de permisos base existentes en el sistema.

---

**Plantillas de roles y reglas de inclusión (cómo se crean en el seeder)**

- `SUPER_ADMIN`:
  - Creada como plantilla no editable (`esEditable: false`) y se le asignan *todos* los permisos activos en la BD (`todosPermisos`).
  - Archivo: [roles-permisos.seeder.ts](backend/smart-economat-backend/src/seeders/roles-permisos.seeder.ts).

- `ADMIN` (valor del enum `rolUsuario.ADMINISTRADOR` → `'ADMIN'`):
  - Regla aplicada en el seeder: toma `todosPermisos` y filtra para excluir permisos cuyo código empieza por `roles:` o `permisos:`, excepto que se mantiene `permisos:gestionar`.
  - En resumen: Admin tiene (casi) todos los permisos operativos del sistema excepto las operaciones de CRUD sobre roles/permisos del sistema (salvo `permisos:gestionar`).

- `PROFESOR` (valor del enum `rolUsuario.PROFESOR` → `'PROFESOR'`):
  - Regla aplicada: incluye permisos cuyos `modulo` está en la lista
    `['productos','pedidos','recepciones','inventario','movimientos','merma','incidencias','recetas','dashboard','profesor','albaranes','ubicaciones']`
    y además excluye acciones que contengan `eliminar`.
  - Resultado: perfil operativo con la mayoría de permisos de gestión excepto borrados.

- `ALUMNO` (valor del enum `rolUsuario.ALUMNO` → `'ALUMNO'`):
  - Regla aplicada: incluye permisos de módulos `['productos','inventario','dashboard','albaranes','ubicaciones','alumno']` y sólo las acciones `['listar','ver','ver_estadisticas','cambiar_profesor']`.
  - Resultado: perfil de sólo lectura / consumo con pocas operaciones de cambio.

**Roles persistentes (entidad `Rol`)**
- Además de las plantillas (plantilla_rol), existe la entidad `Rol` que permite crear roles personalizados en BD (`rol` table). Estos roles almacenan permisos explícitos via relación `rol.permisos`.
- Cuando un usuario tiene roles en `usuario.roles` (tabla `usuario_rol`), `AuthPermissionsService` incluye esos permisos en el conjunto final del usuario.

**Cómo se combinan las fuentes de permisos para un usuario (implementación real)**
1. `AuthPermissionsService.loadUserPermissionsFromDB(userId)` hace lo siguiente:
   - Carga `usuario` (y su `rol` string).
   - Consulta permisos asociados a roles persistentes (join `permiso.roles` → `rol` → `rol.usuarios` con `userId`).
   - Consulta permisos asociados a la `PlantillaRol` cuyo `nombre` coincide con `usuario.rol` (p. ej. `'ADMIN'`, `'PROFESOR'`, `'ALUMNO'`).
   - Añade `permisosAdicionales` asignados directamente al usuario.
   - Elimina `permisosExcluidos` explícitamente revocados para el usuario.
   - Devuelve el conjunto final (unique set) y lo cachea (cache key `user:permissions:<userId>`).

2. `AuthPermissionsGuard` (PermisosGuard) en `canActivate`:
   - Lee metadata `permissions` tanto del controlador como del método (combina ambos conjuntos).
   - Lee metadata `permissions_mode` para decidir `all` (AND) o `any` (OR). Por defecto `all`.
   - Si no hay permisos requeridos, permite la petición.
   - Si hay permisos requeridos, pide a `AuthPermissionsService` validar: `userHasAllPermissions` o `userHasAnyPermission`.
   - Si la validación falla, lanza `ForbiddenException` con mensaje que incluye los permisos requeridos.

3. `RolesGuard`:
   - Verifica metadata `roles` (decorador `Roles`) y compara contra `request.user.rol` (valor del enum `rolUsuario`). Si no hay roles requeridos devuelve true.

**Dónde se aplican los guards / decoradores (ejemplos)**
- Uso estándar en controladores: `@UseGuards(JwtAuthGuard, PermisosGuard)` o `@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)`.
- Decoradores disponibles para rutas/controladores:
  - `@RequirePermissions(...codes)` — requiere TODOS por defecto (AND).
  - `@RequireAnyPermission(...codes)` — requiere AL MENOS UNO (OR).
  - `@ControllerPermissions(...codes)` — aplica una base de permisos a todo el controlador.

**Relación rol ↔ permisos (resumen operativo)**
- `SUPER_ADMIN` → Todos los permisos activos.
- `ADMIN` → Todos los permisos excepto los que empiezan por `roles:` y `permisos:` (salvo `permisos:gestionar`).
- `PROFESOR` → Permisos cuyos `modulo` está en la lista definida en el seeder y sin acciones `eliminar`.
- `ALUMNO` → Permisos con módulos limitados y acciones sólo de lectura (`listar`, `ver`, `ver_estadisticas`) y `cambiar_profesor` en el módulo `alumno`.
- `Roles` persistentes (`Rol` entity) → permisos exactamente listados en `rol.permisos`.

**Observaciones e inconsistencias detectadas (documentadas en el código)**
- Seeder: hay entradas similares/duplicadas relacionadas con `archivos` (por ejemplo, `archivos:subir`/`archivos:listar` aparecen repetidas en el bloque). Recomiendo deduplicar en el seeder si se desea evitar entradas duplicadas en BD.
- Plantilla `ADMIN` en el seeder usa la constante `rolUsuario.ADMINISTRADOR` cuyo valor es `'ADMIN'` — tenga en cuenta que el nombre de la plantilla coincide con el valor del enum (no con la clave textual `ADMINISTRADOR`). Esto es correcto según el código, pero importante de documentar.

**Checklist de validación (implementado en este documento)**
- [x] Lista completa de permisos: incluida (copia de `PERMISOS_BASE`).
- [x] Plantillas de roles: explicadas y reglas de inclusión documentadas (copia de la lógica del seeder).
- [x] Flujo de autorización: descrito a partir de `AuthPermissionsGuard` y `AuthPermissionsService`.
- [x] Entidades y decoradores relevantes referenciados con enlaces al código.

---

**Siguientes pasos recomendados (opcionales)**
- Generar `wiki/security/permissions.md` con una tabla fila-por-fila: `codigo | nombre | modulo | accion | descripcion | endpoints donde se utiliza` (puede automatizarse por búsqueda de `@RequirePermissions` en controladores).
- Generar `wiki/security/roles.md` con listas explícitas de permisos por plantilla enumerando cada `codigo` para facilitar auditoría.

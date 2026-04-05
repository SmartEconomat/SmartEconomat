# API de Usuarios, Administración y Seguridad

Este bloque cubre la entrada al sistema, el perfil autenticado, la gestión de usuarios, los permisos y las operaciones administrativas que afectan a roles y plantillas.

## Entidades relacionadas

- `Usuario`
- `Rol`
- `Permiso`
- `PlantillaRol`

Detalle del modelo: [../entidades.md](../entidades.md).

## Auth (`/auth`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /auth/register` | Alta general de usuario fuera del flujo de sesión web | `RegisterUserDto` con `username`, `password` y opcionales `email`, `rol` | Usuario y token en body |
| `POST /auth/login` | Iniciar sesión | `LoginUserDto` con `{ email, password }`; `email` admite email o username | Token en body, flags de sesión y cookie `access_token` |
| `POST /auth/logout` | Cerrar sesión | No lleva body | Mensaje de logout y limpieza de cookie |
| `GET /auth/profile` | Leer el payload básico autenticado | Solo autenticación | Identidad básica del JWT (`id`, `username`, `rol`) |
| `PATCH /auth/change-password` | Cambiar contraseña del usuario autenticado | `ChangePasswordDto` con `currentPassword` y `newPassword` | Mensaje de confirmación |
| `POST /auth/forgot-password` | Iniciar recuperación por email | `ForgotPasswordDto` con `email` | Mensaje de envío o registro del intento |
| `POST /auth/reset-password` | Completar recuperación con token | `ResetPasswordDto` con `token` y `newPassword` | Mensaje de cambio aplicado |

### Qué endpoint usar en cada caso

- Usa `GET /usuarios/perfil` y no `GET /auth/profile` para hidratar sesión de frontend.
- Usa `auth/change-password` cuando el flujo es puramente de autenticación.
- Usa `usuarios/perfil/password` cuando la UI esté anclada al perfil del usuario.

## Usuarios (`/usuarios`)

Campos clave del agregado `usuario`: `username`, `password`, `rol`, `status`, `activo`, y opcionales `nombre`, `email`, `mustChangePassword` y campos OTP o de recuperación.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /usuarios` | Crear usuario estándar | `CreateUsuarioDto` | Usuario creado |
| `POST /usuarios/admin` | Crear usuario con capacidades administrativas ampliadas | `AdminCreateUsuarioDto` | Usuario creado |
| `GET /usuarios/perfil` | Obtener perfil completo y permisos resueltos del usuario autenticado | No lleva body | Usuario enriquecido con `permisos` |
| `PATCH /usuarios/perfil` | Editar el propio perfil | `UpdateUsuarioDto` | Usuario actualizado |
| `PATCH /usuarios/perfil/password` | Cambiar contraseña desde perfil | `ChangePasswordDto` | Resultado del cambio |
| `GET /usuarios` | Listar usuarios | Query de paginación y orden | Página de usuarios |
| `GET /usuarios/minimos` | Obtener listado reducido para selectores | No lleva body | Lista mínima de usuarios |
| `GET /usuarios/:id` | Ver usuario concreto | UUID v7 por path | Un usuario |
| `PATCH /usuarios/:id` | Editar usuario | UUID v7 + `UpdateUsuarioDto` | Usuario actualizado |
| `PATCH /usuarios/:id/admin` | Editar usuario con DTO administrativo | UUID v7 + `AdminUpdateUsuarioDto` | Usuario actualizado |
| `PATCH /usuarios/:id/activar` | Activar o desactivar usuario | UUID v7 + `UpdateUsuarioStatusDto` | Usuario con nuevo estado |
| `PATCH /usuarios/:id/rol` | Cambiar rol principal | UUID v7 + `UpdateUsuarioRolDto` | Usuario actualizado |
| `PATCH /usuarios/:id/password` | Resetear contraseña de un tercero | UUID v7 + `ResetPasswordDto` | Usuario actualizado |
| `DELETE /usuarios/:id` | Eliminar usuario | UUID v7 por path | Resultado de eliminación |
| `POST /usuarios/:id/permisos-adicionales/:permisoId` | Añadir permiso adicional | IDs de usuario y permiso por path | Usuario o asignación actualizada |
| `DELETE /usuarios/:id/permisos-adicionales/:permisoId` | Quitar permiso adicional | IDs por path | Usuario o asignación actualizada |
| `POST /usuarios/:id/permisos-excluidos/:permisoId` | Excluir permiso a un usuario | IDs por path | Usuario o asignación actualizada |
| `DELETE /usuarios/:id/permisos-excluidos/:permisoId` | Quitar exclusión de permiso | IDs por path | Usuario o asignación actualizada |

## Administración (`/admin`)

Estas rutas exigen rol `ADMIN` además del permiso funcional correspondiente.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /admin/roles` | Obtener roles disponibles | No lleva body | Lista de roles |
| `GET /admin/permissions` | Obtener catálogo de permisos | No lleva body | Lista de permisos |
| `POST /admin/profesores` | Alta administrativa de profesor | `CreateProfesorDto` | Profesor/usuario creado |
| `PATCH /admin/users/:id/role` | Cambiar rol y sets de permisos de un usuario | UUID de usuario + `UpdateAdminUserRoleDto` con `roleId`, `permisosAdicionalesIds`, `permisosExcluidosIds` | Usuario actualizado |
| `PATCH /admin/users/:id/activate` | Activar o desactivar una cuenta | UUID de usuario + `UpdateAdminUserActivationDto` con `active` | Usuario actualizado |
| `POST /admin/users/:id/force-reset` | Forzar reset de contraseña | UUID de usuario por path | Confirmación de reset |

## Plantillas de roles (`/plantillas-roles`)

Estas rutas sirven para reutilizar conjuntos de permisos.

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /plantillas-roles` | Listar plantillas | No lleva body | Lista de plantillas |
| `GET /plantillas-roles/:id` | Ver plantilla concreta | UUID v7 por path | Detalle de plantilla |
| `POST /plantillas-roles` | Crear plantilla | `CreatePlantillaDto` | Plantilla creada |
| `POST /plantillas-roles/:id/duplicar` | Duplicar plantilla existente | UUID v7 + `DuplicatePlantillaDto` con nombre opcional nuevo | Nueva plantilla |
| `PATCH /plantillas-roles/:id` | Editar plantilla | UUID v7 + `UpdatePlantillaDto` | Plantilla actualizada |
| `PATCH /plantillas-roles/:id/activo` | Activar o desactivar plantilla | UUID v7 + `UpdatePlantillaActivoDto` | Plantilla actualizada |
| `DELETE /plantillas-roles/:id` | Eliminar plantilla | UUID v7 por path | Mensaje de eliminación |

## Dashboard (`/dashboard`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /dashboard/stats` | Obtener KPIs agregados para panel principal | No lleva body; solo autenticación y permiso `dashboard:ver_estadisticas` | `DashboardStatsDto` |

## Reglas prácticas para integrar este bloque

- Considera `GET /usuarios/perfil` como fuente de verdad de sesión y permisos.
- Si cambias roles o permisos del usuario actual, vuelve a cargar el perfil para resincronizar el cliente.
- Las rutas de `admin` no sustituyen el CRUD normal de `usuarios`; están pensadas para acciones de gobierno y seguridad.
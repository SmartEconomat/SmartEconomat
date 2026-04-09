# RBAC técnico

Este documento describe cómo se aplica la autorización en el código actual del proyecto.

## Piezas principales

La autorización se compone de dos capas complementarias:

- control por rol mediante `@Roles(...)` y `RolesGuard`
- control por permisos mediante decorators Sherlock y `PermisosGuard`

La autenticación previa sigue dependiendo de `JwtAuthGuard`.

## Decoradores de permisos

El sistema Sherlock expone tres decoradores principales:

- `RequirePermissions(...permissions)` aplica modo `all`
- `RequireAnyPermission(...permissions)` aplica modo `any`
- `ControllerPermissions(...permissions)` fija permisos base a nivel de controlador

El guard combina los permisos definidos a nivel de clase y método antes de evaluar la petición.

## `PermisosGuard`

`PermisosGuard` es actualmente un alias de `SherlockPermissionsGuard`.

Su comportamiento real es:

1. si la ruta es pública, permite acceso
2. si no hay permisos requeridos, permite acceso
3. si el usuario no está autenticado, devuelve `403`
4. si el usuario tiene rol elevado, permite acceso
5. en el resto de casos valida en modo `all` o `any` usando `AuthPermissionsService`

Cuando falla, devuelve un `403` con el conjunto de permisos requeridos y el modo aplicado.

## `AuthPermissionsService`

La resolución de permisos efectivos sucede en backend y usa caché. El servicio:

- carga el usuario activo
- reúne permisos por plantilla asociada al rol principal
- añade permisos de roles persistentes
- suma permisos directos
- resta permisos excluidos
- cachea el resultado

Además, si el usuario es `SUPER_ADMIN`, el servicio devuelve todos los permisos activos.

## Roles elevados

En la capa Sherlock actual, estos roles son elevados:

- `ADMIN`
- `SUPER_ADMIN`

Eso significa que pasan automáticamente la comprobación de permisos granulares. Este bypass existe también en el frontend para mantener consistencia visual.

## Relación con `RolesGuard`

El bypass de permisos no elimina la capa de roles. Si un endpoint declara, por ejemplo, `@Roles(rolUsuario.ADMIN)`, un `PROFESOR` con permisos granulares suficientes seguirá siendo rechazado por `RolesGuard`.

En resumen:

- `RolesGuard` restringe por familia de rol
- `PermisosGuard` restringe por capacidad concreta

## Frontend

El cliente replica la experiencia RBAC de esta forma:

- `GET /api/v1/usuarios/perfil` hidrata el usuario y sus permisos
- `usePermission` usa modo AND cuando recibe array
- `useAnyPermission` usa modo OR
- `ADMIN` y `SUPER_ADMIN` pasan automáticamente la comprobación en hooks

La UI solo mejora UX. La autorización efectiva siempre ocurre en backend.

## Recomendaciones de uso

- Usar `@Roles(...)` cuando el rol importa por definición de negocio.
- Usar permisos granulares para capacidades específicas dentro de un mismo rol.
- Evitar documentar permisos por copia manual larga; la fuente operativa es el seeding/catálogo de permisos y los controladores que los requieren.
- Tras cambios de permisos del usuario actual, refrescar la sesión en frontend.

## Relacionado

- [Roles y permisos](roles-y-permisos.md)
- [Permisos dinámicos](permisos-dinamicos.md)
- [Hooks de permisos en frontend](../frontend/hooks-permisos.md)
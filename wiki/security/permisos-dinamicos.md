# Permisos dinámicos

SmartEconomat no depende de enums rígidos en frontend para decidir accesos. El sistema resuelve permisos efectivos en backend y los proyecta al cliente tras verificar la sesión.

## Resolución de permisos en backend

`AuthPermissionsService` calcula los permisos efectivos a partir de cuatro fuentes:

1. permisos heredados de la plantilla asociada a `usuario.rol`
2. permisos asociados a roles persistentes del usuario
3. permisos adicionales asignados directamente al usuario
4. permisos excluidos explícitamente

La resolución final sigue la fórmula:

`(base por rol y plantilla + adicionales) - excluidos`

## Caché e invalidación

- TTL actual del caché: 300 segundos
- Prefijo: `user:permissions:`
- El servicio expone invalidación por usuario, por lote y global

Esto permite que el backend evite recalcular permisos en cada request sin perder la capacidad de refrescar tras cambios administrativos.

## Guard y decoradores

La capa técnica de autorización usa el stack Sherlock:

- `RequirePermissions(...codes)` para modo AND
- `RequireAnyPermission(...codes)` para modo OR
- `ControllerPermissions(...codes)` para permisos base a nivel de controlador
- `PermisosGuard` como alias de `SherlockPermissionsGuard`

El guard combina permisos de controlador y método, respeta `@Public()` y lanza `403` cuando el usuario no cumple el requisito.

## Roles elevados

Hay un matiz importante en la implementación actual:

- `ADMIN`
- `SUPER_ADMIN`

Estos dos roles se tratan como roles elevados tanto en backend como en frontend. En la práctica:

- el `SherlockPermissionsGuard` permite el acceso sin comprobar permisos granulares cuando detecta uno de esos roles;
- los hooks `usePermission` y `useAnyPermission` devuelven `true` directamente para esos mismos roles.

Esto no sustituye a `RolesGuard`. Si un endpoint exige `@Roles(...)`, el rol sigue importando aunque el usuario sea elevado.

## Frontend

La sesión se hidrata con `GET /api/v1/usuarios/perfil`. A partir de ahí:

- `AuthContext` expone el usuario autenticado
- la store mantiene un mapa de permisos efectivos
- `usePermission` y `useAnyPermission` leen ese mapa sin disparar fetches por render

El cliente sigue siendo un espejo de conveniencia. La autorización real y definitiva está en el backend.

## Implicaciones prácticas

- Cambiar permisos o rol de un usuario no debería depender de datos persistidos en navegador.
- Tras editar roles o permisos del usuario actual, conviene ejecutar `refreshUser()`.
- Ocultar botones mejora UX, pero nunca reemplaza la validación del backend.

## Relacionado

- [Roles y permisos](roles-y-permisos.md)
- [RBAC técnico](rbac.md)
- [Hooks de permisos en frontend](../frontend/hooks-permisos.md)
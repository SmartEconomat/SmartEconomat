# Página Usuarios

## Ubicación real

Vista principal: `src/pages/Usuarios/UsuariosView.tsx`

Modal asociado: `src/pages/Usuarios/UserModal.tsx`

## Propósito

Es la interfaz de administración de usuarios, roles efectivos, activación y reseteo de credenciales. Sustituye a enfoques anteriores más fragmentados y organiza los usuarios por rol visible.

## Estructura actual

- encabezado con buscador, refresco y alta de usuario
- banner informativo cuando la vista llega desde notificaciones con filtros activos
- tres acordeones: administradores, profesores y alumnos
- `UserModal` para alta y edición
- diálogos de confirmación para borrado y reset de contraseña

La página ya no usa `DynamicFormModal`.

## Comportamiento funcional

## Búsqueda y agrupación

- el buscador usa debounce
- la data se consulta por rol con paginaciones independientes
- la pantalla admite filtros por query string como `estado` y `focus`

## Acciones por fila

- activar o suspender
- resetear contraseña temporal
- editar
- eliminar

La activación usa el endpoint administrativo; el reset genera una contraseña fuerte temporal y la muestra una sola vez al operador.

## Edición avanzada

`UserModal` no solo modifica datos básicos. También permite:

- seleccionar el rol principal desde roles cargados por backend
- revisar permisos por grupo
- persistir permisos adicionales y excluidos

Cuando el usuario editado es el actual, la pantalla intenta refrescar la sesión para mantener la UI consistente con sus permisos reales.

## Reglas de seguridad visibles

- la visibilidad de acciones depende de permisos (`usuarios:crear`, `usuarios:editar`, `usuarios:eliminar`)
- el flujo protege el caso del último administrador activo
- un profesor solo puede resetear alumnos cuando su contexto actual lo permite

## Servicios implicados

- `usuarioService.getUsuarios()`
- `usuarioService.getRoles()`
- `usuarioService.getPermissions()`
- `usuarioService.updateUserRole()`
- `usuarioService.setUserActivation()`
- `usuarioService.resetPassword()`

## Relacionado

- [Gestión de usuarios](../gestion-usuarios.md)
- [Servicio `usuarioService`](../servicios/usuarioService.md)
- [Roles y permisos](../../security/roles-y-permisos.md)
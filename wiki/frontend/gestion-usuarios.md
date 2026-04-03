# Gestión de usuarios en frontend

La administración de usuarios se concentra en una única vista: `UsuariosView`. Este documento resume su comportamiento funcional y la relación con los servicios de backend.

## Arquitectura actual

- Vista principal: `src/pages/Usuarios/UsuariosView.tsx`
- Modal de edición y alta: `src/pages/Usuarios/UserModal.tsx`
- Servicio de datos: `src/services/usuarioService.ts`

La vista sustituye a implementaciones anteriores separadas y organiza el contenido por rol usando acordeones independientes.

## Cómo se presenta la información

- Tres grupos principales: administradores, profesores y alumnos.
- Cada grupo mantiene paginación propia.
- El buscador usa debounce y filtra todos los grupos.
- La página puede abrirse con filtros de notificación usando query params como `estado` y `focus`.

## Operaciones disponibles

- alta de usuario
- edición de username y email
- cambio de rol principal y overrides de permisos
- activación o suspensión
- borrado
- reset de contraseña temporal

## Qué ocurre al guardar

La edición puede desencadenar varias llamadas coordinadas:

- `PATCH /usuarios/:id` para perfil básico
- `PATCH /admin/users/:id/role` para rol y permisos adicionales/excluidos
- `PATCH /admin/users/:id/activate` para activación

Si el usuario editado es el propio usuario autenticado, la vista intenta refrescar la sesión para evitar inconsistencias de permisos.

## Reglas de seguridad visibles en UI

- Las acciones dependen de `usePermission`.
- No se puede resetear la contraseña de uno mismo desde la acción rápida.
- El modal protege el caso del último administrador activo para evitar dejar el sistema sin administración operativa.

## Contraseña temporal

El reset desde la vista genera una contraseña fuerte temporal y la muestra una única vez en un diálogo de confirmación. El backend recibe esa contraseña ya generada desde cliente.

## Relacionado

- [Página Usuarios](paginas/Usuarios.md)
- [Servicio `usuarioService`](servicios/usuarioService.md)
- [Hooks de permisos](hooks-permisos.md)
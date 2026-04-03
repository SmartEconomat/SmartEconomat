# Servicio `usuarioService`

`usuarioService` centraliza las llamadas del frontend al módulo de usuarios y a la parte administrativa de roles y permisos.

## Ubicación real

- Servicio: `src/services/usuarioService.ts`
- Tipos: `src/types/usuario.ts`
- Transporte HTTP: `src/services/api.service.ts`

## Modelo de transporte actual

- Usa `baseFetch`, que trabaja en modo cookie-first con `credentials: 'include'`
- No inyecta `Authorization: Bearer` manualmente
- Espera respuestas en el envelope estándar del frontend: `{ success, message, data }`

## Responsabilidades del servicio

## Adaptación de modelos

El servicio traduce entre el shape del frontend y el del backend:

- normaliza `rol` a mayúsculas
- convierte `estado` a `status`
- elimina campos de UI que no pertenecen a los DTOs backend
- recompone un `Usuario` de frontend a partir del payload backend

## Paginación y filtros

`getUsuarios()` encapsula el contrato del listado de usuarios:

- `page`
- `limit`
- `searchTerm`
- `rol`
- `sortBy`
- `order`
- `estado`

Además fuerza un límite seguro entre `1` y `50` para evitar divergencias con el backend.

## Endpoints consumidos

| Método del servicio | Endpoint backend | Uso |
| --- | --- | --- |
| `getRoles()` | `GET /admin/roles` | Carga plantillas de rol disponibles |
| `getPermissions()` | `GET /admin/permissions` | Carga permisos disponibles |
| `getUsuarioById()` | `GET /usuarios/:id` | Obtiene detalle completo |
| `getUsuarios()` | `GET /usuarios` | Listado paginado y filtrado |
| `crearUsuario()` | `POST /usuarios` | Alta de usuario |
| `actualizarUsuario()` | `PATCH /usuarios/:id` | Edición de perfil básico |
| `updateUserRole()` | `PATCH /admin/users/:id/role` | Cambio de rol y overrides |
| `setUserActivation()` | `PATCH /admin/users/:id/activate` | Activación o suspensión |
| `eliminarUsuario()` | `DELETE /usuarios/:id` | Eliminación |
| `resetPassword()` | `PATCH /usuarios/:id/password` | Genera y aplica contraseña temporal |

## Detalle relevante: reset de contraseña

`resetPassword()` genera una contraseña fuerte en cliente y la envía al backend. El valor generado se devuelve a la UI para mostrarlo una sola vez al operador.

## Qué no hace

- no mantiene mocks de respaldo
- no decide permisos finales
- no almacena la sesión del usuario como fuente de verdad

## Relacionado

- [Gestión de usuarios](../gestion-usuarios.md)
- [Página Usuarios](../paginas/Usuarios.md)
- [RBAC técnico](../../security/rbac.md)
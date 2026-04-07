# Login y registro

Esta guía describe el comportamiento vigente de autenticación, sesión y alta de usuarios. Debe leerse como referencia funcional; el detalle de rutas y payloads vive en [reference/api/README.md](../reference/api/README.md).

## Resumen operativo

- Login real: `POST /api/v1/auth/login`
- Sesión canónica para frontend: `GET /api/v1/usuarios/perfil`
- Logout: `POST /api/v1/auth/logout`
- Transporte recomendado: cookie `access_token` con `credentials: 'include'`
- Compatibilidad heredada: el backend sigue aceptando `Authorization: Bearer <token>`

## Modelo de sesión actual

El flujo recomendado es cookie-first:

1. El usuario envía credenciales a `POST /auth/login`.
2. El backend responde con `access_token` en el body y, además, establece la cookie `access_token` mediante el interceptor de cookies.
3. El frontend rehidrata la sesión consultando `GET /usuarios/perfil`.
4. La UI calcula permisos, navegación y visibilidad a partir de la respuesta del backend, no del JWT local.

> [!NOTE]
> El frontend todavía conserva el `access_token` en `tokenManager` y `localStorage` dentro de `auth.service.ts`, pero eso ya no es la fuente de verdad de la sesión. El estado efectivo y los permisos reales se recuperan desde backend.

## Inicio de sesión

### Request

- Endpoint: `POST /api/v1/auth/login`
- Body: `{ email, password }`
- El campo `email` admite tanto email como username.

### Respuesta y efectos

- Devuelve un payload con `access_token` y, cuando aplica, `requirePasswordChange`.
- Limpia cualquier cookie anterior antes de emitir la nueva sesión.
- La cookie `access_token` es `httpOnly`, `sameSite: 'strict'` y `secure` solo en producción.

### Estados de cuenta relevantes

- Solo los usuarios activos pueden iniciar sesión.
- Las cuentas inactivas siguen existiendo, pero no acceden hasta ser activadas.
- Un reset administrativo puede forzar `mustChangePassword`, lo que activa el flujo de cambio obligatorio tras login.

## Cambio y recuperación de contraseña

### Cambio de contraseña autenticado

- `PATCH /api/v1/auth/change-password`
- `PATCH /api/v1/usuarios/perfil/password`

Ambos flujos existen y se usan en contextos distintos. El primero está más cerca del dominio auth; el segundo cuelga del módulo de usuario autenticado.

### Recuperación por email

- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Este flujo depende de que la cuenta tenga email operativo y SMTP configurado. Si no hay SMTP, el backend registra el intento en logs.

### Reset administrativo o docente

- Administradores y personal con permisos adecuados pueden resetear usuarios desde administración.
- Los profesores pueden forzar el reset de sus alumnos con `POST /api/v1/profesores/alumnos/:id/force-reset`.

## Registro de usuarios

## Registro general

- Endpoint: `POST /api/v1/auth/register`
- DTO público: `username`, `password`, `email?`, `rol?`
- Devuelve token en el body, pero no establece cookie.

Es una ruta disponible en el backend, pero no sustituye al login web normal. Si se necesita sesión de navegador, después hay que pasar por `POST /auth/login`.

## Registro de alumno

- Endpoint: `POST /api/v1/alumnos/register`
- Requiere `username` y `password`.
- La vinculación educativa puede hacerse de dos formas:
  - por `codigoClase`, o
  - por `aula + numeroClase + cialProfesor`

El alumno queda en estado inactivo hasta que su profesor lo activa.

## Registro de profesor

- Endpoint: `POST /api/v1/profesores/register`
- Requiere `username`, `password`, `email` y `cial`

La cuenta se crea inactiva y necesita activación administrativa antes del acceso.

## Política de contraseñas

Los DTOs públicos de auth, alumno y profesor exigen contraseña fuerte:

- mínimo 8 caracteres
- al menos una minúscula
- al menos una mayúscula
- al menos un número
- al menos un símbolo

## Reglas prácticas para frontend

- Usar `GET /usuarios/perfil` como fuente de verdad para sesión y permisos.
- No derivar permisos finales desde el token guardado localmente.
- No usar `GET /auth/profile` como sustituto del perfil completo; devuelve solo el payload autenticado básico.
- Tras cambios de rol o permisos del usuario actual, forzar un `refreshUser()` para resincronizar el cliente.

## Relacionado

- [Auth del sistema educativo](auth-sistema-educativo.md)
- [Roles y permisos](roles-y-permisos.md)
- [RBAC técnico](rbac.md)
- [Gestión de usuarios en frontend](../frontend/gestion-usuarios.md)
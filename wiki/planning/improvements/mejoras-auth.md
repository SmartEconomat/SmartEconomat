# Mejoras Sugeridas - Módulo de Autenticación y Perfil

Para permitir que el frontend gestione correctamente el perfil de usuario y los ajustes de seguridad, se sugiere la implementación de los siguientes endpoints y lógica en el backend.

## 1. Endpoints Sugeridos

### GET `/auth/me`

Permite al usuario autenticado recuperar sus datos básicos.

- **Guard**: `JwtAuthGuard`
- **Output**: Información del usuario extraída del token o base de datos.

### PATCH `/auth/profile`

Permite al usuario actualizar datos no sensibles (ej. nombre completo).

- **Body**: `{ nombre: string }`
- **Guard**: `JwtAuthGuard`

### PATCH `/auth/change-password`

Permite al usuario actualizar su contraseña validando la anterior.

- **Body**: `{ oldPassword: string, newPassword: string }`
- **Guard**: `JwtAuthGuard`
- **Lógica**: Verificar hash de `oldPassword`, Hashear `newPassword` (vía hooks de entidad o manualmente).

## 2. Consideraciones Técnicas

- **Tipado de IDs**: La entidad `Usuario` extiende de `BaseEntity` y utiliza **UUID v7** (string) para la Primary Key. Asegurar que los servicios usen `string` en lugar de `number`.
- **DTOs**: Utilizar `ChangePasswordDto` (ya existente en `usuario/dto`) el cual usa el campo `oldPassword`.
- **Seguridad**: Usar `@GetUser()` decorator para obtener el ID del usuario del token JWT de forma segura.

---

## Prompt Sugerido para Antigravity

> "Necesito implementar funciones de gestión de perfil en el backend de SmartEconomat. Por favor, realiza los siguientes cambios:
>
> 1. En **AuthService**, añade métodos `findById(id: string)`, `updateProfile(id: string, data: { nombre: string })` y `changePassword(id: string, current: string, next: string)`. Ten en cuenta que los IDs son UUID (strings).
> 2. En **AuthController**, añade los endpoints:
>    - `GET /me`: protegido por `JwtAuthGuard`, debe retornar el usuario actual.
>    - `PATCH /profile`: protegido por `JwtAuthGuard`, recibe `{ nombre: string }`.
>    - `PATCH /change-password`: protegido por `JwtAuthGuard`, usa `ChangePasswordDto` para recibir `oldPassword` y `newPassword`.
>
> Asegúrate de usar los decoradores `@UseGuards(JwtAuthGuard)` y `@GetUser()` donde corresponda."

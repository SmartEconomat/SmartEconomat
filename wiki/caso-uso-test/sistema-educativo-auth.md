# Documentación Técnica: Sistema Educativo y Autenticación

Este documento describe la arquitectura y el funcionamiento del sistema de autenticación y el modelo educativo de SmartEconomat.

## 1. Arquitectura de Usuarios y Perfiles

El sistema utiliza una arquitectura de **Usuario Centralizado** con perfiles específicos vinculados mediante relaciones `OneToOne`.

- **Usuario (UsuarioEntity)**: Almacena las credenciales globales (`username`, `email`, `password`), el rol (`rolUsuario`) y el estado de la cuenta (`status`).
- **Profesor (ProfesorEntity)**: Extensión del perfil para usuarios con rol `PROFESOR`. Almacena el código `CIAL`.
- **Alumno (AlumnoEntity)**: Extensión del perfil para usuarios con rol `ALUMNO`. Vinculado a un slot específico de clase.

### Relaciones

- `Usuario` ↔ `Profesor` (1:1)
- `Usuario` ↔ `Alumno` (1:1)
- `Alumno` → `AlumnoSlot` (1:1 través de `slot_id`)
- `AlumnoSlot` → `Profesor` (N:1)

## 2. Sistema de Slots (Horarios/Sesiones)

Para gestionar la organización de los alumnos en el economato, se utiliza la entidad **AlumnoSlot**.

- **Responsable**: Un Profesor es dueño de múltiples slots.
- **Identificadores**: Cada slot se define por `aula` y `numeroClase` (únicos por profesor).
- **Ocupación**: Un slot puede estar vacío o asignado a un único `Alumno`.

## 3. Flujos de Registro

### Registro de Profesores

1. El profesor se registra mediante `/api/v1/auth/register` (o un endpoint específico si existe).
2. El estado inicial es `INACTIVE`.
3. Debe ser activado manualmente por un **ADMINISTRADOR**.

### Registro de Alumnos

1. Los alumnos se registran mediante `/api/v1/alumnos/register`.
2. Proporcionan: `username`, `password`, `aula`, `numeroClase` y el `cialProfesor`.
3. El sistema busca al profesor por CIAL y asigna (o crea) un `AlumnoSlot`.
4. El alumno queda vinculado al perfil de usuario y al slot.
5. El estado inicial es `INACTIVE`.

## 4. Gestión de Sesiones y Seguridad

### Activación de Alumnos

Los profesores pueden activar a sus alumnos mediante:
`PATCH /api/v1/profesores/alumnos/:id/activate`
Esto cambia el estado del `Usuario` vinculado a `ACTIVE`.

### Restablecimiento de Contraseñas

- **General**: Sistema de `forgot-password` vía email para Admin y Profesores.
- **Alumno (Sin Email)**: Los alumnos suelen no tener email. El Profesor puede forzar un reset:
  `POST /api/v1/profesores/alumnos/:id/force-reset`
  - Genera una contraseña provisional de 8 caracteres.
  - Marca `mustChangePassword: true` en el usuario.
  - El alumno debe cambiarla obligatoriamente en su siguiente inicio de sesión.

## 5. Implementación Técnica

- **Identificadores**: Uso estándar de **UUID v7** para todos los IDs y llaves foráneas.
- **Seguridad**:
  - Hash de contraseñas con **bcrypt**.
  - Sesiones vía **JWT** con Guardias de Rol (`RolesGuard`).
  - Validación fuerte de contraseñas (8+ car, Mayús, Núm, Símbolo).

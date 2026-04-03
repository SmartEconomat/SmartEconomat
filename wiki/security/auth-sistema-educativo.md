# Auth del sistema educativo

Este documento cubre los flujos específicos del dominio educativo: registro de profesores y alumnos, gestión de slots, activación y recuperación de credenciales en contexto de aula.

## Modelo funcional

El sistema combina un usuario base con perfiles de profesor o alumno:

- `usuario` concentra credenciales, estado y rol principal.
- `profesor` añade el identificador `cial`.
- `alumno` se vincula a un `alumno_slot`.
- `alumno_slot` representa la clase o grupo gestionado por un profesor.

## Registro público

## Alta de alumnos

- Endpoint: `POST /api/v1/alumnos/register`
- Requisitos mínimos: `username`, `password` y un mecanismo válido de vinculación.

La vinculación puede resolverse por:

- `codigoClase`, o
- `aula + numeroClase + cialProfesor`

Endpoints públicos de apoyo:

- `GET /api/v1/alumnos/slots/:codigoClase`
- `GET /api/v1/alumnos/aulas`
- `GET /api/v1/alumnos/aulas/:aula/clases`
- `GET /api/v1/alumnos/aulas/:aula/clases/:clase/profesores`

El alumno queda inactivo hasta ser activado por su profesor.

## Alta de profesores

- Endpoint: `POST /api/v1/profesores/register`
- Requiere `username`, `password`, `email` y `cial`

El profesor también nace inactivo y necesita activación desde administración.

## Activación de cuentas

## Activación de alumnos

- Endpoint: `PATCH /api/v1/profesores/alumnos/:id/activate`
- Requiere permiso `profesor:gestionar_alumnos`

El profesor solo puede activar alumnos bajo su ámbito docente.

## Activación de profesores

La activación de profesores se realiza desde los flujos de administración de usuarios, por ejemplo mediante:

- `PATCH /api/v1/admin/users/:id/activate`

## Gestión de slots

Endpoints principales del profesor:

- `POST /api/v1/profesores/slots`
- `GET /api/v1/profesores/slots`
- `PATCH /api/v1/profesores/slots/:id`
- `DELETE /api/v1/profesores/slots/:id`
- `GET /api/v1/profesores/alumnos`
- `POST /api/v1/profesores/alumnos/:id/force-reset`

Endpoints administrativos complementarios:

- `POST /api/v1/profesores/admin-slots`
- `PATCH /api/v1/profesores/admin-slots/:id`
- `DELETE /api/v1/profesores/admin-slots/:id`
- `GET /api/v1/profesores/all-slots`
- `GET /api/v1/profesores/all-profesores`

## Recuperación de credenciales en aula

El flujo estándar de `forgot-password` no siempre sirve a alumnos, porque no necesariamente disponen de email operativo. Por eso existe el reset docente:

- `POST /api/v1/profesores/alumnos/:id/force-reset`

Este flujo permite entregar una contraseña provisional y forzar su cambio posterior.

## Cambio de profesor

- Endpoint: `PATCH /api/v1/alumnos/change-profesor`
- Permiso requerido: `alumno:cambiar_profesor`

Es un flujo específico del alumno autenticado para cambiar su asignación docente bajo las reglas del backend.

## Reglas que conviene recordar

- Todas las cuentas educativas nacen inactivas.
- La activación del alumno pertenece al profesor; la del profesor pertenece a administración.
- El `codigoClase` es la vía más directa para el alta de alumno, pero no la única soportada por el DTO.
- El login posterior de profesores y alumnos sigue el flujo general descrito en [login-registro.md](login-registro.md).

## Relacionado

- [Login y registro](login-registro.md)
- [Roles y permisos](roles-y-permisos.md)
- [Servicio `profesorService`](../frontend/servicios/profesor.service.md)
REGISTRO DE USUARIOS

- El cial de profesor solo recibe campos en mayúsculas

---

### REQUERIMIENTOS BACKEND (PARA REGISTRO Y GESTIÓN)

Necesitamos endpoints para que el sistema de registro y la gestión de aulas/clases funcione:

#### 1. Endpoints Públicos (Registro de Alumnos)
*Nota: Estos endpoints deben ser `@Public()`.*

- **GET `/alumnos/aulas`**: Lista de aulas con slots libres.
- **GET `/alumnos/aulas/:aula/clases`**: Números de clase libres para esa aula.
- **GET `/alumnos/aulas/:aula/clases/:clase/profesores`**: CIAL y nombre de profesores para esos slots.

#### 2. Endpoints para Profesores (Gestión de Perfil)
*Nota: Requieren autenticación y rol PROFESOR.*

- **GET `/profesores/slots`**: Devuelve todos los slots (aula y numeroClase) creados por el profesor actual.
- **POST `/profesores/slots`**: (Ya existente) Crea un nuevo slot.
    - **IMPORTANTE**: Ahora debe recibir y guardar el campo `capacidad` (number).
    - **NUEVO**: El backend debe generar y devolver un **Código de Slot único** (ej: `ABC-123`) para cada registro. Esto es vital para que el alumno pueda registrarse usando ese código.
    - Actualizar `CreateSlotDto` y la entidad `AlumnoSlot` para incluir `capacidad` y `codigoSlot`.
- **DELETE `/profesores/slots/:id`**: Elimina un slot (si no tiene alumno asignado).

---

MENSAJES DE ERROR

- CAMBIAR "El Slot ya está siendo usuado por otro alumno" 


## ENDPOINTS FALTANTES (PROFESOR)
- **GET `/profesores/slots`**: Falta implementar este endpoint para que el profesor pueda listar sus aulas/clases creadas. Es crítico para agrupar alumnos por clase en el frontend.


## INVENTARIO
En el frontend se debería poder cambiar los productos del inventario de ubicación.
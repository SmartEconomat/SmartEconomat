# Profesor Service

Capa de abstracción para la comunicación con los endpoints de gestión educativa destinados a usuarios con el rol `PROFESOR`.

## Ubicación
`frontend/smart-economat-frontend/src/services/profesor.service.ts`

## Métodos de Gestión de Clases

### `getSlots()`
Recupera la lista de aulas y clases creadas por el profesor.
- **Endpoint**: `GET /profesores/slots`
- **Retorno**: `AlumnoSlot[]`

### `createSlot(data)`
Crea una nueva clase configurando aula y capacidad.
- **Endpoint**: `POST /profesores/slots`
- **Body**: `{ aula: string, numeroClase: number, capacidad: number }`

### `deleteSlot(slotId)`
Elimina una clase existente.
- **Endpoint**: `DELETE /profesores/slots/:id`

## Métodos de Gestión de Alumnos

### `getAlumnos()`
Obtiene todos los alumnos vinculados a las clases del profesor.
- **Endpoint**: `GET /profesores/alumnos`
- **Retorno**: `Alumno[]`

### `activateAlumno(alumnoId)`
Activa un alumno que está en estado `INACTIVE`.
- **Endpoint**: `PATCH /profesores/alumnos/:id/activate`

### `forcePasswordReset(alumnoId)`
Resetea la contraseña de un alumno y genera una clave provisional.
- **Endpoint**: `POST /profesores/alumnos/:id/force-reset`
- **Retorno**: `{ message: string, provisionalPassword: string }`

### `removeStudent(alumnoId)`
Desvincula a un alumno del sistema del profesor.
- **Endpoint**: `DELETE /profesores/alumnos/:id`

## Interfaces de Datos

### `AlumnoSlot`
```typescript
interface AlumnoSlot {
  id: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot?: string; // Código de invitación generado por el backend
}
```

### `Alumno`
```typescript
interface Alumno {
  id: string;
  username: string;
  status: string;
  aula: string;
  numeroClase: number;
}
```

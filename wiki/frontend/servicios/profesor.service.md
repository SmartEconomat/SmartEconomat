# Servicio `profesorService`

`profesorService` agrupa las operaciones del frontend para slots, alumnos y administración educativa.

## Ubicación real

- Servicio: `src/services/profesor.service.ts`
- Transporte HTTP: `src/services/api.service.ts`

## Modelo de transporte

- Todas las llamadas usan `baseFetch`
- La autenticación se apoya en cookie de sesión
- El servicio devuelve el envelope recibido junto con `status`

## Operaciones soportadas por el backend actual

| Método del servicio | Endpoint backend | Uso |
| --- | --- | --- |
| `getSlots()` | `GET /profesores/slots` | Slots del profesor actual |
| `createSlot()` | `POST /profesores/slots` | Alta de slot propio |
| `updateSlot()` | `PATCH /profesores/slots/:id` | Edición de slot propio |
| `deleteSlot()` | `DELETE /profesores/slots/:id` | Eliminación de slot propio |
| `getAlumnos()` | `GET /profesores/alumnos` | Alumnos vinculados al profesor |
| `activateAlumno()` | `PATCH /profesores/alumnos/:id/activate` | Activación de alumno |
| `forcePasswordReset()` | `POST /profesores/alumnos/:id/force-reset` | Reset docente de credenciales |
| `getAllSlots()` | `GET /profesores/all-slots` | Vista administrativa de slots |
| `getAllProfesores()` | `GET /profesores/all-profesores` | Selector administrativo de profesorado |
| `adminUpdateSlot()` | `PATCH /profesores/admin-slots/:id` | Reasignación o edición administrativa |
| `adminDeleteSlot()` | `DELETE /profesores/admin-slots/:id` | Borrado administrativo |
| `adminCreateSlot()` | `POST /profesores/admin-slots` | Alta administrativa de slot |

## Inconsistencias detectadas en el servicio

El archivo de frontend todavía expone dos métodos sin respaldo en el controlador backend actual:

- `removeStudent()` apunta a `DELETE /profesores/alumnos/:id`
- `updateStudentPermissions()` apunta a `PATCH /profesores/alumnos/:id/permissions`

Esas rutas no aparecen en el `ProfesorController` actual, así que no deben documentarse ni usarse como contrato soportado hasta que exista soporte backend real.

## Relacionado

- [Auth del sistema educativo](../../security/auth-sistema-educativo.md)
- [Referencia de endpoints](../../reference/endpoints.md)
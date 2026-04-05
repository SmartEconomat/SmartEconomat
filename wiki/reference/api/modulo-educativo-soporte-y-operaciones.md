# API de Módulo Educativo, Soporte y Operaciones

Este bloque reúne el dominio educativo y los endpoints auxiliares que exponen archivos, exportaciones y la ruta raíz del backend.

## Entidades relacionadas

- `Profesor`
- `Alumno`
- `AlumnoSlot`
- `Archivo`

Referencia de modelo: [../entidades.md](../entidades.md).

## Profesores (`/profesores`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /profesores/register` | Registro público de profesor | `CreateProfesorDto` con `username`, `password`, `email`, `cial` y datos asociados | Profesor/usuario creado, normalmente pendiente de activación |
| `POST /profesores/slots` | Crear slot propio de clase | `CreateSlotDto` | Slot creado |
| `POST /profesores/admin-slots` | Crear slot en modo administrativo | `AdminCreateSlotDto` | Slot creado |
| `GET /profesores/slots` | Listar slots del profesor autenticado | No lleva body | Lista de slots propios |
| `GET /profesores/all-slots` | Listar todos los slots | No lleva body | Lista completa de slots |
| `GET /profesores/all-profesores` | Listar profesores disponibles | No lleva body | Lista de profesores |
| `PATCH /profesores/admin-slots/:id` | Editar slot en contexto administrativo | UUID del slot + `AdminUpdateSlotDto` | Slot actualizado |
| `PATCH /profesores/slots/:id` | Editar slot propio | UUID del slot + `UpdateSlotDto` | Slot actualizado |
| `DELETE /profesores/slots/:id` | Eliminar slot propio | UUID del slot por path | Resultado de eliminación |
| `DELETE /profesores/admin-slots/:id` | Eliminar slot en contexto administrativo | UUID del slot por path | Resultado de eliminación |
| `PATCH /profesores/alumnos/:id/activate` | Activar alumno vinculado al profesor | UUID del alumno por path | Alumno activado |
| `GET /profesores/alumnos` | Listar alumnos del profesor | No lleva body | Lista de alumnos bajo su ámbito docente |
| `POST /profesores/alumnos/:id/force-reset` | Forzar reset de contraseña de alumno | UUID del alumno por path | Confirmación de reset |

## Alumnos (`/alumnos`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /alumnos/register` | Registro público de alumno | `RegisterAlumnoDto` con `username`, `password` y mecanismo de vinculación (`codigoClase` o `aula + numeroClase + cialProfesor`) | Alumno/usuario creado |
| `GET /alumnos/slots/:codigoClase` | Resolver un slot por código | Código de clase por path | Slot asociado o ausencia |
| `GET /alumnos/aulas` | Listar aulas disponibles | No lleva body | Lista de aulas |
| `GET /alumnos/aulas/:aula/clases` | Listar clases por aula | Aula por path | Lista de clases |
| `GET /alumnos/aulas/:aula/clases/:clase/profesores` | Listar profesores asignables a un aula/clase | Aula y clase por path | Lista de profesores |
| `PATCH /alumnos/change-profesor` | Cambiar el profesor del alumno autenticado | `ChangeProfesorDto` | Alumno actualizado con nueva vinculación |

## Archivos (`/archivos`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `POST /archivos/upload` | Subir archivo general al sistema | `multipart/form-data` con campo `file` | Mensaje + `FileResponseDto` |
| `GET /archivos` | Listar archivos | `FileListFilterDto` en query | Listado paginado con metadata |
| `GET /archivos/:id` | Obtener metadata de un archivo | UUID del archivo por path | `FileResponseDto` |
| `GET /archivos/content/:filename` | Servir contenido binario del archivo | Nombre de fichero por path | Archivo binario |
| `DELETE /archivos/:id` | Eliminar archivo lógicamente | UUID del archivo por path | `204 No Content` |

### Qué esperar al subir un archivo

- La respuesta devuelve la metadata normalizada del archivo, no solo un booleano.
- Si el archivo tiene versión optimizada o transformada, esa información aparece en el DTO de respuesta.

## Exportaciones (`/export`)

Todas las rutas de este bloque son `GET`, consumen filtros por query y devuelven un binario. No usan el envelope JSON normal porque transmiten `xlsx` o `pdf`.

### Exportaciones XLSX

| Endpoint | Qué enviar | Qué devuelve |
| --- | --- | --- |
| `GET /export/productos/xlsx` | `ExportProductoFilterDto` en query | `productos.xlsx` |
| `GET /export/pedidos/xlsx` | `ExportPedidoFilterDto` | `pedidos.xlsx` |
| `GET /export/proveedores/xlsx` | `ExportProveedorFilterDto` | `proveedores.xlsx` |
| `GET /export/albaranes/xlsx` | `ExportAlbaranFilterDto` | `albaranes.xlsx` |
| `GET /export/incidencias/xlsx` | `ExportIncidenciaFilterDto` | `incidencias.xlsx` |
| `GET /export/inventario/xlsx` | `ExportInventarioFilterDto` | `inventario.xlsx` |
| `GET /export/movimientos/xlsx` | `ExportMovimientoFilterDto` | `movimientos.xlsx` |
| `GET /export/recepciones/xlsx` | `ExportRecepcionFilterDto` | `recepciones.xlsx` |
| `GET /export/recetas/xlsx` | `ExportRecetaFilterDto` | `recetas.xlsx` |
| `GET /export/ubicaciones/xlsx` | `ExportUbicacionFilterDto` | `ubicaciones.xlsx` |
| `GET /export/usuarios/xlsx` | `ExportUsuarioFilterDto` | `usuarios.xlsx` |

### Exportaciones PDF

| Endpoint | Qué enviar | Qué devuelve |
| --- | --- | --- |
| `GET /export/productos/pdf` | `ExportProductoFilterDto` en query | `productos.pdf` |
| `GET /export/proveedores/pdf` | `ExportProveedorFilterDto` | `proveedores.pdf` |
| `GET /export/inventario/pdf` | `ExportInventarioFilterDto` | `inventario.pdf` |
| `GET /export/pedidos/pdf` | `ExportPedidoFilterDto` | `pedidos.pdf` |
| `GET /export/albaranes/pdf` | `ExportAlbaranFilterDto` | `albaranes.pdf` |
| `GET /export/incidencias/pdf` | `ExportIncidenciaFilterDto` | `incidencias.pdf` |
| `GET /export/recetas/pdf` | `ExportRecetaFilterDto` | `recetas.pdf` |

## Endpoint raíz (`GET /api/v1`)

| Endpoint | Para qué sirve | Qué enviar | Qué devuelve |
| --- | --- | --- | --- |
| `GET /api/v1` | Respuesta básica del backend | No lleva body | Mensaje simple de la aplicación |

## Reglas prácticas para integrar este bloque

- Usa las rutas públicas de `alumnos` para resolver contexto de clase antes del registro.
- Trata las exportaciones como descargas directas, no como respuestas JSON.
- Usa `archivos` para contenido genérico y `albaranes/upload-documento` cuando el binario forme parte del flujo documental de recepción.
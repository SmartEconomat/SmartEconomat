# Plan de Pruebas: Módulo de Archivos

Este documento detalla los escenarios de prueba para la gestión de documentos y archivos multimedia dentro del sistema, garantizando la seguridad en la subida, el control de acceso y la integridad física de los ficheros.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Subida de Archivos (POST /api/v1/archivos/upload)

1. **E2E-ARC-01-UPL**: Subida exitosa de una imagen (JPG/PNG). Verificar que devuelve la URL pública y se guarda el registro en la base de datos con el `usuario_id` del autor.
2. **E2E-ARC-02-UPL-ERR**: Error 400 al intentar subir un archivo vacío o sin el campo `file` en el multipart.
3. **E2E-ARC-03-UPL-LIM**: (Opcional) Error 400 si el archivo excede el tamaño máximo permitido (Ej: 5MB).
4. **E2E-ARC-04-UPL-MIME**: (Opcional) Validar restricciones de tipo de archivo (solo imágenes/PDFs según config).

### B. Consulta y Visualización (GET /api/v1/archivos)

5. **E2E-ARC-05-LST**: Listado paginado de archivos. Verificar filtros por `mimeType` y `usuarioId`.
6. **E2E-ARC-06-GET-ID**: Obtener metadatos de un archivo específico por ID.
7. **E2E-ARC-07-CONT**: Visualizar/Descargar el contenido físico (`GET /archivo/content/:filename`). Verificar que el servidor sirve el flujo de datos correctamente.
8. **E2E-ARC-08-CONT-ERR**: Error 404 al intentar acceder a un fichero que existe en BD pero ha sido borrado físicamente del disco.

### C. Seguridad y Protección de Rutas

9. **E2E-ARC-09-TRAV-ERR**: **Test de Path Traversal**: Intentar acceder a un archivo fuera del directorio de uploads usando `../../etc/passwd` en el nombre de archivo. Verificar que el sistema lanza un `BadRequestException` ("Ruta de archivo inválida").
10. **E2E-ARC-10-DEL-OWN**: Usuario normal intenta borrar un archivo que subió él mismo (Debe permitirse).
11. **E2E-ARC-11-DEL-FORB**: Usuario normal intenta borrar un archivo que subió OTRO usuario (Error 403 Forbidden).
12. **E2E-ARC-12-DEL-ADM**: Administrador intenta borrar un archivo de otro usuario (Debe permitirse).

### D. Gestión de Borrado

13. **E2E-ARC-13-DEL-SOFT**: Verificar que el borrado es lógico (`isDeleted = true`). El registro permanece en BD pero deja de aparecer en listados.
14. **E2E-ARC-14-DEL-PHYS**: (Opcional según implementación) Verificar si tras el borrado lógico se elimina el archivo físico para liberar espacio.

---

## 2. Reglas de Negocio Críticas

- **Aislamiento de Almacenamiento**: El sistema soporta almacenamiento local y externo (S3/Cloud). Los tests deben validar que la URL generada es coherente con el `STORAGE_TYPE` configurado.
- **Protección de Ruta**: El servidor debe validar que cualquier petición de contenido físico se encuentra estrictamente dentro del subdirectorio `LOCAL_STORAGE_PATH`.
- **Propiedad de Archivos**: Los archivos están "anonimizados" para el público general, pero vinculados a un usuario para control de borrado.

---

## 3. Stress y Edge Cases

- **Nombres con Espacios/Símbolos**: Subir un archivo llamado "Mi Imagen @ 2024.jpg". Verificar que se sanitiza o maneja correctamente en la URL.
- **Subida Simultánea**: Dos usuarios subiendo archivos pesados al mismo tiempo (Validar estabilidad de Multer).
- **Extensiones Duplicadas**: Subir "foto.jpg" y luego otra vez "foto.jpg" (El sistema debería renombrar automáticamente a "foto-171xxx.jpg" para evitar colisión).

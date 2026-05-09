# Memoria: Fix Exportación Excel Recetas (400 Bad Request)

## Contexto
Se detectó un error `400 Bad Request` al intentar exportar recetas a Excel desde el frontend.

## Causa Raíz
El frontend enviaba el parámetro `ids` en la query string, pero el DTO del backend (`ExportRecetaFilterDto`) no definía este campo. Debido a la configuración `forbidNonWhitelisted: true` en el `I18nValidationPipe` global, NestJS rechazaba la petición.

## Solución Aplicada
1. **Backend**:
   - Se añadió el campo `ids` (string array con transformador de CSV) a `ExportRecetaFilterDto`.
   - Se añadió el campo `minTiempoMinutos` al DTO para alinear con los filtros de la UI.
   - Se actualizó `ExportService.buildRecetaQueryBuilder` para filtrar por `ids` (usando `WHERE id IN (...)`) y por `minTiempoMinutos`.
2. **Frontend**:
   - Se actualizó `handleExportExcel` en `Recetas.tsx` para enviar correctamente `searchTerm`, `ids` (si hay selección) y los rangos de tiempo (`minTiempoMinutos`, `maxTiempoMinutos`) basados en el filtro actual cuando no hay selección manual de IDs.

## Aprendizajes
- Siempre verificar que los parámetros enviados desde el frontend coincidan exactamente con las propiedades definidas en el DTO del backend, especialmente cuando `forbidNonWhitelisted` está activo.
- La exportación debe ser consistente con los filtros aplicados en la tabla para evitar confusión al usuario.

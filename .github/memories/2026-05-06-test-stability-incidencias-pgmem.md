# 2026-05-06 - Estabilización tests (incidencias + pg-mem)

## Cambios relevantes
- Los tests de incidencias E2E deben enviar `proveedorId` en `CreateIncidenciaDto`.
- Las líneas de incidencias deben usar `cantidadPedida` (no `cantidadEsperada`).
- Varias suites unitarias quedaron alineadas con `MovimientoHelper.log/trackAction` en lugar de mocks legacy.

## pg-mem en e2e
- Se registró `floor(float)` en `test/setup/pg-mem.ts` para checks SQL de `receta/preparacion/produccion_lote`.
- Se añadieron intercepts para consultas de introspección no soportadas por pg-mem:
  - `information_schema.columns` con alias `columns.table_name`
  - consultas sobre `pg_am`

## Comportamientos observados
- `RecepcionStockService` ahora puede generar incidencias automáticas por faltantes de líneas no recibidas en escenarios multipedido.
- Algunos tests E2E antiguos asumían `incidencias: []` y quedaron desalineados con este comportamiento actual.

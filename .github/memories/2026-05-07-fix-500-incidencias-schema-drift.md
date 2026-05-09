# Fix 500 incidencias por schema drift (2026-05-07)

- Se corrigió un `500` en `GET /api/v1/incidencias` causado por desalineación entre entidades TypeORM y columnas reales de PostgreSQL.
- Errores observados en logs:
  - `column incidencia.estado does not exist`
  - `column incidencia.proveedor_id does not exist`
  - `column lineas.cantidad_pedida does not exist` en query paginada por `leftJoinAndSelect` de líneas.
- Cambios aplicados:
  - Nueva migración `1775400000000-AddEstadoToIncidencia.ts`:
    - crea enum `incidencia_estado_enum`,
    - agrega columna `incidencia.estado` con default `ABIERTA`,
    - backfill a `RESUELTA` cuando `fecha_resolucion IS NOT NULL`.
  - Nueva migración `1775400001000-AddProveedorIdToIncidencia.ts`:
    - agrega columna `incidencia.proveedor_id` (uuid),
    - backfill desde `pedido.proveedor_id`,
    - agrega índice y FK a `proveedor` con `ON DELETE SET NULL`.
  - Ajuste en `incidencia.entity.ts`: `proveedorId` pasa a nullable.
  - Ajuste en `incidencia.service.ts`: al agrupar incidencias automáticas no se fuerza `''` como UUID de proveedor.
  - Ajuste en `incidencia.repository.ts`: en paginado se cambió a `leftJoin` (sin `select`) para relaciones de líneas/producto en listado, manteniendo filtros por `searchTerm` sin depender de columnas legacy de `incidencia_linea`.
- Verificación:
  - `npm run build` ✅
  - `npm run test -- test/modules/incidencia/incidencia.service.spec.ts` ✅
  - `npm run test:e2e:file -- test/e2e/incidencias.e2e-spec.ts` ✅
  - `npm run test:e2e:file -- test/e2e/incidencias-recepcion.e2e-spec.ts` ✅
  - `npm run test:e2e:file -- test/e2e/frontend-integration-contracts.e2e-spec.ts` ✅
  - Smoke test real: `GET /api/v1/incidencias?page=1&limit=10&resuelta=false` responde `200` (antes `500`).

## Actualización 17:19 (UTC+1)

- Se detectó un segundo `500` transversal (incluyendo `usuarios/perfil`) con error SQL:
  - `relation "usuario_ubicacion" does not exist`
- Causa: la migración `1775450000000-AddUsuarioUbicacionesM2M.ts` existía pero no había corrido en este entorno; al estar desordenado el historial de timestamps, quedaba fuera del flujo esperado en algunos arranques.
- Fix aplicado:
  - nueva migración de aseguramiento `1775700000000-EnsureUsuarioUbicacionJoinTable.ts` (idempotente),
  - ejecutada junto con la migración original pendiente.
- Resultado validado por API proxied (`localhost:5173`):
  - `GET /api/v1/incidencias?...` -> `200`
  - `GET /api/v1/usuarios/perfil` -> `200`
  - `GET /api/v1/inventario?...` -> `200`

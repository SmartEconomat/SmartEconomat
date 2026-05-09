# Enum `movimiento_tipo_enum`: valor `auditoria`

El código usa `TipoMovimiento.AUDITORIA` (`'auditoria'`) como tipo por defecto en trazas de `MovimientoHelper` / `MovimientoService` cuando no hay stock. El enum PostgreSQL inicial no lo incluía.

- Migración: `1776000000000-AddMovimientoTipoAuditoria.ts` (idempotente).
- También integrado en `ConsolidatedBaseSchema` y `scripts/prod-bootstrap-runner.js`.

Tras desplegar código, ejecutar migraciones en el servicio backend (p. ej. `docker compose … exec backend npm run migration:run`).

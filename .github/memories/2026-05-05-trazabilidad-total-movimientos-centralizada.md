# 2026-05-05 - Trazabilidad total movimientos centralizada

## Objetivo
Garantizar registro consistente de acciones críticas en `movimiento` evitando inserciones manuales dispersas.

## Cambios clave
- `MovimientoHelper` ampliado con API central `log(...)` y soporte de `userId` opcional.
- `trackAction(...)` y `trackInventarioMovimiento(...)` reutilizan el flujo central y soportan transacciones (`EntityManager`).
- `RecepcionStockService` migrado: se eliminaron `manager.save(Movimiento, ...)` directos y se sustituyeron por `movimientoHelper.trackInventarioMovimiento(...)`.
- Cobertura de trazabilidad añadida a servicios críticos:
  - `PedidoUsuarioService`: create/update/accept/cancel/restore/remove + sync de estado.
  - `PurchaseBatchService`: create/update/approve/consolidate/cancel/restore.
  - `IncidenciaService`: create/update/remove/resolve/reportar automática.
  - `UsuarioService` y `AdminService`: cambios administrativos, permisos, activación y contraseñas.
- `AuditEvent` alineado con el uso real del interceptor.

## Estabilización técnica detectada
- Se reparó `movimiento.repository.ts` (archivo corrupto/incompleto en estado previo) para restaurar compilación.
- Se añadió import faltante `Transform` en `PaginationQueryDto`.
- Se ajustó test `audit.listener.spec.ts` por firma actual de `createMovimiento`.

## Verificación ejecutada
- `npm run build`: ✅ compila sin errores.
- Tests unitarios de cadena de auditoría (`test/common/interceptors/audit.interceptor.spec.ts`, `test/modules/movimiento/listeners/audit.listener.spec.ts`): ✅ pasan.
- `npm run lint`: ⚠️ existen errores/warnings previos en otros módulos no tocados por esta tarea.

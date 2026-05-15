# 2026-05-13 - Cierre auditoría técnica módulo Productos

## Hallazgos cerrados (PROD-AUD)
- 001: Se eliminó la falsa promesa de filtrado por rol no implementado entre controlador/servicio.
- 002: En sincronización de proveedores se evita colisión de unicidad restaurando relaciones soft-delete (withDeleted + restore/update en lugar de reinsertar ciego).
- 003: `proveedorId` en historial de precios validado por DTO de query (`ProductPriceHistoryQueryDto`) con UUID opcional.
- 004: Se alineó semántica frontend para evitar confusión entre `activo=false` e `eliminado` (soft-delete).
- 005: En `Productos.tsx` se añadió control de concurrencia por `requestId` para ignorar respuestas stale.
- 006: Se añadió `stopPropagation` en acciones de fila/tarjeta (editar/eliminar/restaurar) para no abrir detalle por propagación.
- 007: `ProductoFormModal` carga proveedores paginando hasta agotar catálogo (sin límite duro fijo de 100).
- 008: Frontend consume endpoint de comparativa de proveedores (`/producto-proveedor/comparar/:productoId`) y renderiza datos reales.
- 009: Normalización de enums en frontend endurecida con validación runtime (sin cast inseguro).
- 010: Contrato de alérgenos alineado a `productoId` en frontend.
- 011: `requestProductoById` retorna `null` solo en 404; otros estados lanzan `ApiError`.
- 012: Se ampliaron tests de backend/frontend para cubrir casos de riesgo del módulo productos.
- 013: Se eliminaron logs de depuración en flujo de guardado/restauración de Productos.
- 014: Reducción de `any` en helper TypeORM y servicio de producto-proveedor en rutas críticas corregidas.

## Validación ejecutada
- Backend tests (productos): 4 suites, 23 tests en verde.
- Frontend tests (productos): 6 archivos, 14 tests en verde.
- Backend lint (archivos tocados): OK.
- Frontend lint (src+tests tocados): OK.
- Backend build: OK.
- Frontend build: OK.

## Nota operativa
- Worktree estaba sucio con cambios previos no relacionados (Electron, inventario, scanner, reportes Playwright). No se revirtieron por norma de no tocar cambios ajenos.

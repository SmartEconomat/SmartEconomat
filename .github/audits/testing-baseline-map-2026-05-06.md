# Baseline de Testing Real (Frontend + Backend)

## Objetivo
Establecer un mapa operativo único para ejecutar cobertura basada en lógica real de negocio sobre SmartEconomat.

## Comandos canónicos por paquete

### Frontend (`frontend/smart-economat-frontend`)
- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run qa:gate`

### Backend (`backend/smart-economat-backend`)
- `npm run test`
- `npm run test:cov`
- `npm run test:e2e`
- `npm run qa:gate`

## Inventario actual de suites

### Frontend E2E Playwright (12)
- `test/e2e/auth-flow.spec.ts`
- `test/e2e/navigation-routes.spec.ts`
- `test/e2e/negocio-critico-playwright.spec.ts`
- `test/e2e/pedidos-consolidacion.spec.ts`
- `test/e2e/pedidos-mejoras.spec.ts`
- `test/e2e/productos-quick-proveedor.spec.ts`
- `test/e2e/barcode-inheritance.spec.ts`
- `test/e2e/dashboard-quick-order.spec.ts`
- `test/e2e/dashboard-product-summary-order.spec.ts`
- `test/e2e/receta-auditoria.spec.ts`
- `test/e2e/recetas-tiempo.spec.ts`
- `test/e2e/recetas-modal-ingredientes-layout.spec.ts`

### Backend E2E Jest (38)
- Cobertura transversal ya existente en auth/rbac/pedidos/recepción/incidencias/inventario/recetas/export/dashboard/admin.
- Orquestador principal: `test/e2e/all.e2e-spec.ts`.

## Patrones de negocio priorizados para cierre de cobertura
1. Pedido + consolidación por lote + sincronización de estado.
2. Recepción + discrepancias + incidencias + transición final de pedido.
3. Autenticación cookie-first + 401 global + ruta protegida por permisos.
4. Validaciones contractuales backend (DTO/enums/filtros) visibles en UI.

## Gaps de alta prioridad detectados
- Faltan pruebas unitarias dedicadas para:
  - `src/modules/pedido/state/pedido-usuario.state-machine.ts`
  - `src/modules/sherlock-auth/guards/permissions.guard.ts`
- Frontend tiene selectores potencialmente frágiles en flujos críticos (dependencia de texto o clases MUI).

## Reglas de estabilidad para próximas fases
- Prohibido `nth-child` y selectores por clases MUI dinámicas.
- Preferir `data-testid` para acciones de negocio.
- Evitar `waitForTimeout`; usar esperas por respuesta/estado verificable.
- Mantener separación entre pruebas de contrato real y pruebas con mocking controlado.

# Testing obligatorio: inventario y logística

Extiende [.github/ai/TESTING_RULES.md](TESTING_RULES.md) con el mapa de cobertura y huecos para el dominio **inventario / recepción / movimientos / distribución**.

## Mapa rápido (herramientas)

| Capa | Stack | Rutas en repo |
|------|--------|----------------|
| Unitarios backend | Jest | `backend/smart-economat-backend/test/modules/**` |
| Unitarios frontend | Vitest + RTL | `frontend/smart-economat-frontend/test/**` |
| E2E API Nest | Jest | `backend/smart-economat-backend/test/e2e/**`, `npm run test:e2e` (backend) |
| E2E UI | Playwright | `frontend/smart-economat-frontend/test/e2e/**`, `npm run test:e2e` |

## Cobertura esperada por dominio

### Inventario (stock, lotes, ubicaciones, agregación por producto)

| Área | Estado | Evidencia |
|------|--------|-----------|
| Agregación por producto, bajo stock, soft-delete | Cubierto | [`inventario.service.test.ts`](../../frontend/smart-economat-frontend/test/services/inventario.service.test.ts) |
| Filtros / firma de ubicaciones | Cubierto | [`merge-ubicaciones-filtro.test.ts`](../../frontend/smart-economat-frontend/test/features/inventario/merge-ubicaciones-filtro.test.ts) |
| Servicio backend create/update + movimientos | Cubierto | [`inventario.service.spec.ts`](../../backend/smart-economat-backend/test/modules/inventario/inventario.service.spec.ts) |
| E2E UI filtros, modal auditoría, i18n modal | Cubierto | [`inventario.spec.ts`](../../frontend/smart-economat-frontend/test/e2e/inventario.spec.ts) |
| E2E flujo ampliado + regresión visual | Cubierto | [`inventario-logistica.spec.ts`](../../frontend/smart-economat-frontend/test/e2e/inventario-logistica.spec.ts) |
| E2E API inventario | Parcial | [`inventario.e2e-spec.ts`](../../backend/smart-economat-backend/test/e2e/inventario.e2e-spec.ts) — ampliar cuando cambien contratos listado |

### Movimientos / trazabilidad (historial)

| Área | Estado | Evidencia |
|------|--------|-----------|
| Helpers de usuario en tabla | Cubierto | [`movimiento-formatters.test.ts`](../../frontend/smart-economat-frontend/test/features/movimientos/movimiento-formatters.test.ts) |
| Servicio backend movimientos | Cubierto | [`movimiento.service.spec.ts`](../../backend/smart-economat-backend/test/modules/movimiento/movimiento.service.spec.ts) |
| E2E listado + snapshot | Cubierto | [`inventario-logistica.spec.ts`](../../frontend/smart-economat-frontend/test/e2e/inventario-logistica.spec.ts) (bloque Movimientos) |

### Recepción y stock

| Área | Estado | Evidencia |
|------|--------|-----------|
| Stock recepción, PMP, estados | Cubierto | `backend/.../test/modules/recepcion/*.spec.ts` |
| E2E recepción API | Parcial | `recepcion.e2e-spec.ts` — mantener alineado con DTOs |

### Distribución / reservas (docente)

| Área | Estado | Notas |
|------|--------|--------|
| E2E dedicado reservas profesor | Hueco funcional | Añadir `test/e2e` cuando la ruta y permisos estén fijados en producto; usar mismo patrón session + `page.route`. |

## Huecos conocidos (seguimiento)

1. **Distribución / reserva docente**: falta spec E2E dedicado (depende de flujo y datos de negocio estables).
2. **Recepción UI completa en Playwright**: priorizar si el flujo wizard recibe cambios frecuentes; hoy el peso está en tests de servicio backend y mocks en otros módulos.

Actualizar esta tabla cuando se fusionen PRs que añadan o muevan cobertura.

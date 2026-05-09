# Suite de testing inventario / logística

- Mapa de cobertura y huecos: [.github/ai/TESTING_INVENTARIO_LOGISTICA.md](../ai/TESTING_INVENTARIO_LOGISTICA.md).
- Reglas Playwright y snapshots: [.github/ai/TESTING_RULES.md](../ai/TESTING_RULES.md) (sección Playwright).
- E2E ampliados: `frontend/smart-economat-frontend/test/e2e/inventario-logistica.spec.ts` (flujos + `toHaveScreenshot`); snapshots en `inventario-logistica.spec.ts-snapshots/`.
- Baseline visual: regenerar con `npx playwright test test/e2e/inventario-logistica.spec.ts --update-snapshots` tras cambios UI intencionales en inventario o movimientos.

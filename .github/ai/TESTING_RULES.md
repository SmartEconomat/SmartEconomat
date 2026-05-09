# Reglas de Testing

## Validaciones obligatorias

- validar requests reales contra los DTOs, enums y filtros del backend;
- no permitir regresiones que provoquen `400 Bad Request` en flujos soportados;
- validar tipos serializados por el frontend y conversiones de datos antes de enviar payloads;
- validar schemas, envelopes y shapes de respuesta esperados por el cliente.

## Prioridades

- priorizar pruebas de contratos frontend-backend cuando se tocan servicios, formularios o payloads;
- reutilizar la suite E2E de contratos existente cuando el cambio afecte integración;
- acompañar cualquier cambio de contrato con pruebas y documentación actualizadas.

## Cierre técnico

- ejecutar build, lint y tests relevantes al alcance del cambio;
- revisar que los fallos de validación esperados sigan siendo explícitos y no oculten bugs de integración.

## Playwright, E2E UI y regresión visual

- Los flujos de UI críticos usan **Playwright** bajo `frontend/smart-economat-frontend/test/e2e/`. El gate local del frontend es `npm run qa:gate` (build, lint, Vitest, Playwright).
- Las capturas `expect(locator).toHaveScreenshot(...)` guardan baseline junto al spec (`*-snapshots/`). Tras un **cambio visual intencional**, regenerar en el entorno del proyecto:
  - `cd frontend/smart-economat-frontend && npx playwright test --update-snapshots` (o solo el fichero afectado).
- Revisar en PR el diff de imágenes; subir `maxDiffPixels` solo si hay inestabilidad legítima (fuentes del SO, etc.), no para ocultar roturas.
- Inventario y logística: mapa de cobertura y huecos en [.github/ai/TESTING_INVENTARIO_LOGISTICA.md](TESTING_INVENTARIO_LOGISTICA.md).
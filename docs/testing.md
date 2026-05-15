# Testing

## Objetivo

Asegurar que contratos, logica de negocio y flujos criticos no regresen.

## Backend

Ubicacion: `backend/smart-economat-backend`.

Comandos:

- `npm run test` - unitarios.
- `npm run test:e2e` - integracion e2e.
- `npm run test:cov` - cobertura.
- `npm run qa:gate` - build + lint + e2e (sin suite Jest unitaria en este script; ver `package.json`).
## Frontend

Ubicacion: `frontend/smart-economat-frontend`.

Comandos:

- `npm run test` - Vitest.
- `npm run test:watch` - modo watch.
- `npm run test:coverage` - cobertura.
- `npm run test:e2e` - Playwright.
- `npm run qa:gate` - build + lint (eslint con `--fix`) + Vitest + Playwright (ver script en `package.json`).
## ElectronInstaller

Ubicacion: `ElectronInstaller`.

Comandos:

- `npm run test` - unitarios (Vitest).
- `npm run test:e2e` - e2e del instalador (Playwright).
- `npm run capture:screenshots` - capturas funcionales.
- `npm run lint` y `npm run type-check` - calidad estática (no existe un script `qa:gate` unificado en este paquete; ejecutar los anteriores según el cambio).

## Estrategia recomendada por cambio

- Cambio en DTO/API: correr backend e2e + frontend tests relevantes.
- Cambio UI: frontend unit + e2e afectado.
- Cambio de instalador: test + e2e en `ElectronInstaller`.
- Cambio infra/despliegue: validacion compose + pipeline.

## CI existente

- `deploy.yml`: valida backend/frontend antes de desplegar.
- `electron-installer-screenshots.yml`: valida build/capturas del instalador.

## Lo que no existe hoy

- No hay un unico comando de tests en la raiz (no existe `package.json` raiz).

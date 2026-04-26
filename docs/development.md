# Desarrollo

## Principios de trabajo

- Backend define contratos (DTO, enums, validaciones).
- Frontend consume contratos via servicios centralizados.
- Sin duplicar logica API en componentes.
- TypeScript estricto, sin `any`.

## Workspaces activos

- `backend/smart-economat-backend`
- `frontend/smart-economat-frontend`
- `ElectronInstaller`

## Scripts clave por workspace

### Backend

- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run migration:run`
- `npm run db:reset`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

### ElectronInstaller

- `npm run dev`
- `npm run build:app`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

## Flujo recomendado de cambio

1. Ajustar backend (contrato/negocio) si aplica.
2. Alinear frontend a contrato real.
3. Ejecutar lint + tests del scope.
4. Ejecutar build antes de cerrar.
5. Actualizar documentacion canonica cuando cambie una regla operativa.

## Convenciones relevantes

- Carpetas/archivos TS en `kebab-case`.
- Clases `PascalCase`, variables `camelCase`.
- Rutas REST en plural bajo `/api/v1`.
- Relaciones TypeORM tipadas.

## Calidad minima de entrega

- Build sin errores.
- Lint sin errores criticos.
- Tests relevantes en verde.
- Sin conflictos de merge ni markers git.

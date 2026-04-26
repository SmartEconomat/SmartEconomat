# Troubleshooting

## El backend no arranca

Checklist:

- Revisar `JWT_SECRET`, variables DB y Redis.
- Confirmar que `db` y `redis` esten saludables.
- Ver logs:

```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

## Frontend no conecta con API

- Verificar que backend expone `/api/v1`.
- Revisar proxy de Vite (`vite.config.ts`) en dev.
- Confirmar CORS/domain y puertos (`BACKEND_PORT`, `FRONTEND_PORT`).

## Error de migraciones/DB

- Ejecutar migraciones en backend:

```bash
cd backend/smart-economat-backend
npm run migration:run
```

- Si entorno local esta roto: `npm run db:reset` (destructivo para datos locales).

## Problemas de puertos

Puertos frecuentes:

- `3000` backend
- `5173` frontend dev
- `5432` postgres
- `80/443` frontend prod

Liberar o remapear en archivos `.env`.

## Installer no genera build en Windows

- Ejecutar en `ElectronInstaller`:
  - `npm run build:app`
  - `npm run build:win:fast`
- Verificar iconos y scripts de build/signing en `ElectronInstaller/scripts`.

## Certificados/TLS en produccion

- Confirmar `TLS_PROVIDER`, `CERTS_DIR` y `CERTS_WEBROOT_DIR`.
- Ver logs de frontend (Nginx) en compose prod.

## Comandos diagnostico utiles

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
```

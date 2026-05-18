# How-to: Configurar entorno de producción con Docker

## Objetivo

Desplegar el backend con imagen **production** (multi-stage, sin Swagger ni devDependencies), variables seguras y ejecución no-root.

## Arquitectura

El backend de producción se construye con:

```bash
docker build -f backend/Dockerfile --target production \
  -t smarteconomat-backend:prod \
  backend/smart-economat-backend
```

`docker-compose.prod.yml` ya apunta a ese target. Documentación completa: [Arquitectura Docker backend](../operations/docker-backend-architecture.md).

## Pasos

1. Preparar `.env.prod` desde `.env.example` (secretos reales fuera de git).
2. Construir y levantar:

   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
   ```

3. Verificar salud:

   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml ps
   docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
   ```

4. Confirmar que Swagger **no** está activo en prod (opcional):

   ```bash
   docker exec smarteconomat-prod-backend-1 \
     wget -q --spider http://127.0.0.1:3000/api/v1/docs && echo FAIL || echo OK
   ```

## Variables críticas

- `NODE_ENV=production`
- `ENABLE_SWAGGER=false` (fijado en compose; no activar en prod)
- `LOG_LEVEL=info` (opcional)
- `JWT_SECRET` robusto
- `DB_HOST`, `POSTGRES_*`
- `REDIS_PASSWORD`
- `DOMAIN` / `URL_FRONTEND_DERIVADA`
- `SENTRY_DSN`

Inventario: [environment-variables.md](../environment-variables.md).

## Checklist de hardening

- Usuario no-root (`appuser`) en contenedor backend
- Imagen `production` sin jest/eslint/Swagger UI
- TLS en reverse proxy (frontend nginx)
- CORS restringido al frontend real
- Rotación de secretos
- Backups de PostgreSQL
- Para diagnóstico con Swagger: usar [perfil debug](../how-to/docker-backend-imagenes.md#debug-swagger--inspector-node), no producción

## Ver también

- [How-to: imágenes Docker backend](./docker-backend-imagenes.md)
- [Despliegue](../deployment.md)

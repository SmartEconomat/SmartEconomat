# How-to: Configurar entorno de producción con Docker

## Objetivo
Desplegar backend con imagen optimizada, variables seguras y ejecución no-root.

## Pasos
1. Construir imagen con `backend/Dockerfile.prod`.
2. Definir variables de entorno en entorno seguro (no en imagen).
3. Levantar servicio con `docker-compose.prod.yml`.
4. Verificar salud de API y conexión a BD.

## Variables críticas
- `NODE_ENV=production`
- `JWT_SECRET` robusto
- `DB_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `URL_FRONTEND_DERIVADA`
- `SENTRY_DSN`

## Checklist de hardening
- Usuario no-root en contenedor
- TLS en reverse proxy
- CORS restringido a frontend real
- Rotación de secretos
- Backups de PostgreSQL

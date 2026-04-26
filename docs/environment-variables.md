# Variables de Entorno

Inventario consolidado y operativo. Fuente principal: `.env.example` y `docker-compose*.yml`.

## Entorno general

- `NODE_ENV`
- `DOMAIN`

## Backend y API

- `BACKEND_PORT`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `SENTRY_DSN`
- `DB_HOST`
- `DB_SYNC`
- `STARTUP_RUN_MIGRATIONS`

## Frontend

- `FRONTEND_PORT` (dev)
- `FRONTEND_HTTP_PORT` (prod)
- `FRONTEND_HTTPS_PORT` (prod)
- `VITE_SENTRY_DSN`

## PostgreSQL

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

## Redis

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

## Mail/SMTP

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_SECURE`

## Seeders y bootstrap

- `RUN_BOOTSTRAP_SEEDER`
- `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`
- `SEED_BOOTSTRAP_ADMIN_EMAIL`
- `SEED_BOOTSTRAP_ADMIN_USERNAME`
- `SEED_BOOTSTRAP_ADMIN_PASSWORD`
- `SEED_API_BASE_URL`

## TLS/Certificados

- `TLS_PROVIDER`
- `TLS_SELF_SIGNED_DAYS`
- `LETSENCRYPT_EMAIL`
- `LETSENCRYPT_DIRECTORY_URL`
- `CERTS_DIR`
- `CERTS_WEBROOT_DIR`

## ElectronInstaller

- `SMART_HTTP_PORT`
- `SMART_HTTPS_PORT`
- `ELECTRON_RENDERER_URL`
- `FORCE_NATIVE_REBUILD`
- `WIN_CSC_PFX_PATH`
- `WIN_CSC_PFX_PASSWORD`
- `WIN_CSC_THUMBPRINT`
- `WIN_TIMESTAMP_URL`

## Variables criticas para produccion

Minimo requerido:

- `JWT_SECRET`
- `POSTGRES_*` (credenciales y DB)
- `REDIS_PASSWORD`
- `DOMAIN`
- `SEED_DEFAULT_ADMIN_TEMP_PASSWORD` (si se usa bootstrap)

## Buenas practicas

- No commitear secretos reales.
- Mantener `.env.example` actualizado como contrato.
- Rotar credenciales de JWT/DB/Redis en cada entorno sensible.

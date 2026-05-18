# Deployment

## Panorama real de despliegue

El despliegue actual combina:

- Docker Compose produccion (`docker-compose.prod.yml`).
- Script remoto `scripts/deploy.sh`.
- Pipeline GitHub Actions (`.github/workflows/deploy.yml`).

## Flujo de despliegue CI/CD (actual)

1. Push a rama `production` o ejecucion manual.
2. Job `build-and-test`: lint, tests y build de backend/frontend.
3. Empaquetado zip y subida por SCP.
4. Ejecucion remota por SSH del script de despliegue.
5. Notificacion a Slack.

## Variables de entorno en despliegue

El workflow inyecta variables/secretos criticos:

- Dominio y puertos.
- Credenciales DB.
- JWT secret.
- Sentry DSN.
- Configuracion TLS.
- Password temporal admin seed.

## Imágenes Docker del backend

El backend de producción usa build multi-stage (`backend/Dockerfile`, target `production`):

- Sin Swagger UI en runtime (`ENABLE_SWAGGER=false`).
- Sin devDependencies (`npm ci --omit=dev`).
- Node `22.13.1-bookworm-slim`.

Referencia: [operations/docker-backend-architecture.md](./operations/docker-backend-architecture.md).

Para staging/diagnóstico con Swagger: `docker-compose.debug.yml` y perfil `debug` (ver [how-to/docker-backend-imagenes.md](./how-to/docker-backend-imagenes.md)).

## Despliegue manual (fallback)

En servidor con repo preparado:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

Comandos utiles:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## Perfiles opcionales

- `db-seeding`: ejecuta contenedor `seeder`.
- `tools`: utilidades operativas puntuales.
- `debug` (en `docker-compose.debug.yml`): backend con Swagger e inspector Node; **no** usar en producción expuesta a Internet.

## TLS

- `TLS_PROVIDER` controla el modo TLS.
- Certificados montados en el servicio frontend (Nginx).

## Riesgos operativos observados

- Variables faltantes en produccion rompen arranque (especialmente JWT/REDIS/DB).
- Cambios de infra sin actualizar `.env.prod` degradan despliegue.
- Si no hay artefactos compilados esperados (`dist` backend, `build` frontend), el pipeline debe fallar.

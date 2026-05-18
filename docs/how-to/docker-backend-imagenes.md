# How-to: Construir y desplegar imágenes Docker del backend

Guía práctica para generar y usar las imágenes `production`, `debug` y `development` del backend.

## Prerrequisitos

- Docker Engine + Compose v2
- Node `>=22.13.0` en host (solo si compilas fuera de Docker)
- Fichero `.env.prod` o `.env.dev` según el entorno

## Producción (imagen mínima)

### Build manual

```bash
docker build -f backend/Dockerfile \
  --target production \
  -t smarteconomat-backend:prod \
  backend/smart-economat-backend
```

### Stack completo

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

### Verificar

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
```

Comprobaciones:

- Healthcheck `healthy` en `backend`
- API: `http://localhost:${BACKEND_PORT:-3000}/api/v1`
- Swagger **no** debe responder en `/api/v1/docs`

```bash
docker exec smarteconomat-prod-backend-1 \
  wget -q --spider http://127.0.0.1:3000/api/v1/docs && echo "ERROR: Swagger activo" || echo "OK: sin Swagger"
```

## Debug (Swagger + inspector Node)

Usar cuando necesites OpenAPI o depurar el backend en un entorno similar a producción **sin** contaminar la imagen prod.

```bash
docker compose --env-file .env.prod \
  -f docker-compose.prod.yml \
  -f docker-compose.debug.yml \
  --profile debug up --build \
  db redis backend-debug frontend
```

> No levantes `backend` (prod) y `backend-debug` a la vez en el mismo `BACKEND_PORT`.

| Recurso | URL / puerto |
|---------|----------------|
| API | `http://localhost:${BACKEND_PORT:-3000}/api/v1` |
| Swagger | `http://localhost:${BACKEND_PORT:-3000}/api/v1/docs` |
| Inspector Node | `localhost:${BACKEND_DEBUG_PORT:-9229}` |

## Desarrollo (hot-reload)

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

- Código montado desde `backend/smart-economat-backend/`
- `node_modules` aislado en volumen del contenedor
- Swagger disponible en desarrollo

## Publicar imágenes (equipo / CI)

```bash
docker compose -f docker-compose.build.yml build
# opcional: docker compose -f docker-compose.build.yml push
```

El servicio `backend` usa `target: production` en `backend/Dockerfile`.

## Variables obligatorias en producción

Mínimo en `.env.prod`:

- `JWT_SECRET`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_PASSWORD`
- `DOMAIN`

Opcionales de esta arquitectura:

- `ENABLE_SWAGGER=false` (ya fijado en compose prod)
- `LOG_LEVEL=info`

## Errores frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Build falla en `npm ci` con `glob` | Lockfile/registry en Docker | Verificar `overrides.glob` en `package.json`; `npm ci` en host y commitear lock |
| `TAR_BAD_ARCHIVE` / `ENOENT` en `/_cacache/` | Caché BuildKit npm corrupta | `docker builder prune -f` y rebuild; ver [docker_npm_cache_build.md](../operations/troubleshooting/docker_npm_cache_build.md) |
| `ENOENT dist/i18n` | i18n no copiado | Ya resuelto en Dockerfile `production` |
| Swagger visible en prod | `ENABLE_SWAGGER=true` | Dejar `false` o no definir en prod |
| Puerto 3000 ocupado | Otro backend | Parar compose dev o cambiar `BACKEND_PORT` |

Más: [operations/troubleshooting](../operations/troubleshooting/README.md)

## Ver también

- [Arquitectura Docker backend (referencia)](../operations/docker-backend-architecture.md)
- [Estrategia y trade-offs](../explanation/estrategia-imagenes-docker-backend.md)

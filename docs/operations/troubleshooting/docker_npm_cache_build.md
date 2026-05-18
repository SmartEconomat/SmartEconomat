# Docker build: npm ENOENT / TAR_BAD_ARCHIVE en `npm ci`

## Síntomas

Durante `docker compose build` del backend:

```text
npm warn tar TAR_BAD_ARCHIVE: Unrecognized archive format
npm error enoent ENOENT: no such file or directory, stat '/root/.npm/_cacache/content-v2/sha512/...'
```

Suele aparecer en el stage `deps-prod` o `deps-dev`.

## Causa

1. **Caché BuildKit compartida:** `deps-prod` y `deps-dev` ejecutaban `npm ci` en paralelo sobre el mismo mount `/root/.npm`, corrompiendo entradas.
2. **`npm cache clean --force`** tras `npm ci` con cache mount podía dejar la caché persistente inconsistente.
3. **`prefer-offline=true`** intentaba reutilizar blobs corruptos.

## Solución en el repositorio

El `backend/Dockerfile` usa:

- `id=smarteconomat-backend-npm-prod` y `id=smarteconomat-backend-npm-dev` (caches separadas).
- `sharing=locked` en cada mount.
- Sin `npm cache clean` en esas capas.
- `NPM_CONFIG_PREFER_OFFLINE=false` en build.

Actualiza el repo y vuelve a construir.

## Si el error persiste (caché local corrupta)

Limpiar caché de build de Docker y reintentar:

```bash
docker builder prune -f
docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache backend
```

En Windows (Docker Desktop): *Settings → Builder → Clear build cache* también sirve.

## Verificación

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build backend
docker images smarteconomat-backend:prod
```

# Explicación: Estrategia de imágenes Docker del backend

Por qué SmartEconomat separa imágenes de **producción**, **debug** y **desarrollo**, y qué trade-offs implica.

## Problema que resolvíamos

Antes, una sola imagen o un solo Dockerfile mezclaba:

- Dependencias de desarrollo (Jest, ESLint, herramientas de build) con runtime de producción.
- Swagger UI expuesto por defecto en todos los entornos.
- Capas Docker poco cacheables (`npm ci` repetido sin separar manifiestos).
- Confusión entre el peso del disco local (~600 MB de `node_modules` en dev) y el runtime real en contenedor.

Eso aumentaba superficie de ataque, tamaño de imagen y tiempo de despliegue sin aportar valor en producción.

## Decisión: tres targets, un Dockerfile

Un único `backend/Dockerfile` con stages intermedios (`deps-prod`, `deps-dev`, `builder`) evita duplicar lógica y maximiza caché de BuildKit:

1. Si solo cambia código TypeScript, se reutiliza la capa `npm ci`.
2. La imagen `production` nunca copia el `node_modules` del builder (que incluye devDeps).
3. La imagen `debug` reutiliza el mismo `dist/` compilado pero monta dependencias completas para Swagger UI y diagnóstico.

## Por qué `bookworm-slim` y no Alpine en producción

| Criterio | Alpine (musl) | bookworm-slim (glibc) |
|----------|---------------|------------------------|
| Tamaño base | Muy pequeño | Pequeño |
| `bcrypt`, Sentry profiling | A veces frágil | Estable en nuestro stack |
| Toolchain en builder | `apk add g++` | `apt-get install g++` |

Elegimos **Node 22 LTS sobre Debian bookworm-slim** para producción y debug; desarrollo puede usar el mismo base con herramientas adicionales (`git`, `su-exec`).

## Por qué Swagger fuera de producción

Swagger UI:

- Expone documentación interna de la API.
- Arrastra `swagger-ui-dist` (~11 MB) y dependencias de UI.
- No es necesario para usuarios finales del economato.

La API sigue usando decoradores `@ApiProperty` en compilación; en runtime prod simplemente **no se monta** la ruta `/docs` (`setupSwagger` no-op cuando `ENABLE_SWAGGER=false`).

Para soporte o integradores se usa la imagen **`debug`** o el entorno **development**.

## Por qué no eliminar `@nestjs/swagger` de production deps

Los decoradores Swagger en DTOs y controladores forman parte del código compilado. Quitar el paquete del runtime podría romper reflexión o imports en `dist/`. Lo que sí eliminamos de prod es **`swagger-ui-express`** (solo UI).

## Trade-offs aceptados

| Beneficio | Coste |
|-----------|-------|
| Imagen prod más pequeña y segura | Dos imágenes que mantener (`prod` + `debug`) |
| Builds reproducibles con `npm ci` | Build inicial más lento que `npm install` |
| Shims `Dockerfile.prod` / `.dev` | Duplicación mínima para ElectronInstaller |
| Debug con inspector 9229 | No debe exponerse a Internet |

## Qué no intenta esta arquitectura

- No reduce el tamaño del **repositorio en git** (eso es `node_modules` local).
- No sustituye hardening de red (TLS, firewall, secrets).
- No optimiza la imagen de PostgreSQL (`smarteconomat-db:prod` sigue siendo independiente).

## Relación con el frontend

El frontend en producción es **nginx + estáticos** (`frontend/Dockerfile.prod`, ~100 MB). No comparte `node_modules` con el backend. Esta estrategia es específica del API NestJS.

## Referencias

- [Arquitectura Docker (referencia)](../operations/docker-backend-architecture.md)
- [How-to: build y deploy](../how-to/docker-backend-imagenes.md)

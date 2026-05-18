# syntax=docker/dockerfile:1.4
# =============================================================================
# SmartEconomat Backend — multi-stage Docker architecture
# =============================================================================
# Targets:
#   production  — runtime mínimo (sin Swagger UI, sin devDeps, sin TypeScript)
#   debug       — staging/diagnóstico (Swagger, inspector Node, devDeps)
#   development — hot-reload con bind-mount (docker-compose.dev.yml)
#
# Build examples (context = smart-economat-backend):
#   docker build -f ../Dockerfile --target production .
#   docker build -f ../Dockerfile --target debug .
#   docker build -f ../Dockerfile --target development .
# =============================================================================

ARG NODE_VERSION=22.13.1

# -----------------------------------------------------------------------------
# base — Node LTS en Debian bookworm-slim (glibc, compatibilidad nativa bcrypt/Sentry)
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_MAXSOCKETS=1 \
    NPM_CONFIG_PREFER_OFFLINE=false \
    NPM_CONFIG_PROGRESS=false

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# -----------------------------------------------------------------------------
# deps — dependencias de producción (capa cacheable)
# -----------------------------------------------------------------------------
FROM base AS deps-prod

COPY package.json package-lock.json ./

# Cache id distinto a deps-dev: evita corrupción por npm ci en paralelo en el mismo mount.
RUN --mount=type=cache,target=/root/.npm,id=smarteconomat-backend-npm-prod,sharing=locked \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# -----------------------------------------------------------------------------
# deps-dev — todas las dependencias para compilar y debug
# -----------------------------------------------------------------------------
FROM base AS deps-dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm,id=smarteconomat-backend-npm-dev,sharing=locked \
    npm ci --ignore-scripts --no-audit --no-fund

# -----------------------------------------------------------------------------
# builder — compila TypeScript → dist (no va a la imagen final de production)
# -----------------------------------------------------------------------------
FROM deps-dev AS builder

COPY . .

RUN npm run build

# -----------------------------------------------------------------------------
# production — imagen mínima de runtime
# -----------------------------------------------------------------------------
FROM base AS production

ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG VERSION=1.0.0

ENV NODE_ENV=production \
    ENABLE_SWAGGER=false \
    LOG_LEVEL=info

LABEL org.opencontainers.image.title="SmartEconomat Backend" \
    org.opencontainers.image.description="NestJS backend production runtime" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.created="${BUILD_DATE}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json ./

COPY --from=builder /app/src/i18n ./dist/i18n
COPY --from=builder /app/src/seeders/datos-base-economato ./dist/seeders/datos-base-economato

COPY scripts/prod-bootstrap-runner.js ./scripts/prod-bootstrap-runner.js
COPY scripts/prod-bootstrap-guards.js ./scripts/prod-bootstrap-guards.js
COPY scripts/ensure-entity-columns-from-metadata.js ./scripts/ensure-entity-columns-from-metadata.js
COPY scripts/db-reset-runner.js ./scripts/db-reset-runner.js
COPY scripts/seed-runner.js ./scripts/seed-runner.js
COPY scripts/bootstrap-admin-users-runner.js ./scripts/bootstrap-admin-users-runner.js

RUN groupadd --system appgroup \
    && useradd --system --gid appgroup --home-dir /app --no-create-home appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appgroup /app/uploads /app/dist

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=60s \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/v1 || exit 1

ENTRYPOINT ["dumb-init", "--", "node", "scripts/prod-bootstrap-runner.js"]
CMD ["--", "node", "dist/main.js"]

# -----------------------------------------------------------------------------
# debug — Swagger + inspector + devDeps (NO desplegar en producción)
# -----------------------------------------------------------------------------
FROM base AS debug

ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG VERSION=1.0.0-debug

ENV NODE_ENV=development \
    ENABLE_SWAGGER=true \
    LOG_LEVEL=debug

LABEL org.opencontainers.image.title="SmartEconomat Backend (debug)" \
    org.opencontainers.image.description="NestJS backend with Swagger and Node inspector" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.created="${BUILD_DATE}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps-dev /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json ./

COPY --from=builder /app/src/i18n ./dist/i18n
COPY --from=builder /app/src/seeders/datos-base-economato ./dist/seeders/datos-base-economato

COPY scripts/prod-bootstrap-runner.js ./scripts/prod-bootstrap-runner.js
COPY scripts/prod-bootstrap-guards.js ./scripts/prod-bootstrap-guards.js
COPY scripts/ensure-entity-columns-from-metadata.js ./scripts/ensure-entity-columns-from-metadata.js
COPY scripts/db-reset-runner.js ./scripts/db-reset-runner.js
COPY scripts/seed-runner.js ./scripts/seed-runner.js
COPY scripts/bootstrap-admin-users-runner.js ./scripts/bootstrap-admin-users-runner.js

RUN groupadd --system appgroup \
    && useradd --system --gid appgroup --home-dir /app --no-create-home appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appgroup /app/uploads /app/dist

USER appuser

EXPOSE 3000 9229

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=60s \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/v1 || exit 1

ENTRYPOINT ["dumb-init", "--", "node", "scripts/prod-bootstrap-runner.js"]
CMD ["--", "node", "--inspect=0.0.0.0:9229", "dist/main.js"]

# -----------------------------------------------------------------------------
# development — base para docker-compose dev (código montado por volumen)
# -----------------------------------------------------------------------------
FROM base AS development

ENV NODE_ENV=development \
    ENABLE_SWAGGER=true \
    LOG_LEVEL=debug

RUN apt-get update \
    && apt-get install -y --no-install-recommends git python3 make g++ su-exec \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

COPY scripts/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Código fuente se monta por volumen en compose; solo copiamos manifiestos + entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["sh", "-c", "sh scripts/ensure-deps.sh && npm run start:dev"]

# Etapa 1: Builder
# Mirror configurable para entornos con bloqueos/timeout en Docker Hub Cloudflare R2.
# Se puede sobrescribir con --build-arg POSTGRES_BASE_IMAGE=postgres:16-bookworm
ARG POSTGRES_BASE_IMAGE=public.ecr.aws/docker/library/postgres:16-bookworm
FROM ${POSTGRES_BASE_IMAGE} AS builder

RUN apt-get -o Acquire::Check-Date=false -o Acquire::Check-Valid-Until=false update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-server-dev-16 \
    && rm -rf /var/lib/apt/lists/*

# Copiar y compilar
COPY pg_uuidv7 /tmp/pg_uuidv7
RUN cd /tmp/pg_uuidv7 \
    && make \
    && make install

# Etapa 2: Imagen Final (ligera)
ARG POSTGRES_BASE_IMAGE=public.ecr.aws/docker/library/postgres:16-bookworm
FROM ${POSTGRES_BASE_IMAGE}

ARG BUILD_DATE=unknown
ARG VCS_REF=unknown
ARG VERSION=1.0.0

# Copiar SÓLO los binarios/files generados de la extensión
COPY --from=builder /usr/lib/postgresql/16/lib/pg_uuidv7.so /usr/lib/postgresql/16/lib/
COPY --from=builder /usr/share/postgresql/16/extension/pg_uuidv7* /usr/share/postgresql/16/extension/

# Script de inicialización
RUN echo "CREATE EXTENSION IF NOT EXISTS pg_uuidv7;" > /docker-entrypoint-initdb.d/01-create-uuid-v7-extension.sql

LABEL maintainer="SmartEconomat Team"
LABEL description="PostgreSQL 16 with pg_uuidv7 extension for UUID v7 support (local build)"
LABEL version="1.0"
LABEL org.opencontainers.image.title="SmartEconomat Database"
LABEL org.opencontainers.image.description="PostgreSQL runtime with pg_uuidv7 extension"
LABEL org.opencontainers.image.version="$VERSION"
LABEL org.opencontainers.image.revision="$VCS_REF"
LABEL org.opencontainers.image.created="$BUILD_DATE"
# Etapa 1: Builder
# Fijamos Bookworm para evitar la cadena de dependencias más pesada de Debian 13
# (llvm-19-dev), que estaba agotando el almacenamiento del builder.
FROM postgres:16-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-server-dev-16 \
    && rm -rf /var/lib/apt/lists/*

# Copiar y compilar
COPY pg_uuidv7 /tmp/pg_uuidv7
RUN cd /tmp/pg_uuidv7 \
    && make \
    && make install

# Etapa 2: Imagen Final (ligera)
FROM postgres:16-bookworm

# Copiar SÓLO los binarios/files generados de la extensión
COPY --from=builder /usr/lib/postgresql/16/lib/pg_uuidv7.so /usr/lib/postgresql/16/lib/
COPY --from=builder /usr/share/postgresql/16/extension/pg_uuidv7* /usr/share/postgresql/16/extension/

# Script de inicialización
RUN echo "CREATE EXTENSION IF NOT EXISTS pg_uuidv7;" > /docker-entrypoint-initdb.d/01-create-uuid-v7-extension.sql

LABEL maintainer="SmartEconomat Team"
LABEL description="PostgreSQL 16 with pg_uuidv7 extension for UUID v7 support (local build)"
LABEL version="1.0"
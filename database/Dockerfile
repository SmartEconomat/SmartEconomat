FROM postgres:16

# Instalar dependencias para compilar extensiones
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-server-dev-16 \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de pg_uuidv7 desde el proyecto local
COPY pg_uuidv7 /tmp/pg_uuidv7

# Compilar e instalar pg_uuidv7
RUN cd /tmp/pg_uuidv7 \
    && make \
    && make install \
    && rm -rf /tmp/pg_uuidv7

# Script de inicialización para crear la extensión automáticamente
RUN echo "CREATE EXTENSION IF NOT EXISTS pg_uuidv7;" > /docker-entrypoint-initdb.d/01-create-uuid-v7-extension.sql

# Información de la imagen
LABEL maintainer="SmartEconomat Team"
LABEL description="PostgreSQL 16 with pg_uuidv7 extension for UUID v7 support (local build)"
LABEL version="1.0"
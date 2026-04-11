#!/bin/sh
set -e

# Asegurar permisos de escritura en rutas usadas por runtime y volúmenes bind.
echo "🔧 Ajustando permisos de runtime (/app/node_modules, /app/dist, /app/uploads)..."
mkdir -p /app/node_modules /app/dist /app/uploads /app/uploads_test /app/logs

# Si chown falla por restricciones del host/fs, seguimos con chmod para no bloquear el arranque.
chown -R node:node /app/node_modules /app/dist /app/uploads /app/uploads_test /app/logs 2>/dev/null || true
chmod -R u+rwX,g+rwX /app/node_modules /app/dist /app/uploads /app/uploads_test /app/logs 2>/dev/null || true

# Ejecutar el comando original como el usuario node
exec su-exec node "$@"

#!/bin/sh
set -e

echo "🔧 Ajustando permisos de /app/node_modules y /tmp/.vite..."
mkdir -p /app/node_modules /tmp/.vite
chown -R node:node /app/node_modules /tmp/.vite

exec su-exec node "$@"

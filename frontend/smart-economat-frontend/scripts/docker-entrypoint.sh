#!/bin/sh
set -e

echo "🔧 Ajustando permisos de /app/node_modules y /tmp/.vite-smarteconomat..."
mkdir -p /app/node_modules /tmp/.vite-smarteconomat
chown -R node:node /app/node_modules /tmp/.vite-smarteconomat

exec su-exec node "$@"

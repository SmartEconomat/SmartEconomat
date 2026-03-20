#!/bin/sh
set -e

# Asegurar que el usuario node es dueño de node_modules y dist al arrancar
echo "🔧 Ajustando permisos de /app/node_modules y /app/dist..."
mkdir -p /app/node_modules /app/dist
chown -R node:node /app/node_modules /app/dist

# Ejecutar el comando original como el usuario node
exec su-exec node "$@"

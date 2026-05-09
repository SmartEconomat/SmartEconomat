#!/bin/sh
set -e

# Asegurar permisos de escritura en rutas usadas por runtime y volúmenes bind.
echo "🔧 Ajustando permisos de runtime (/app/node_modules, /app/dist, /app/uploads)..."
mkdir -p /app/node_modules /app/dist /app/uploads /app/uploads_test /app/logs

# dist/ suele estar bind-montado; si quedó con dueño root en el host, tsc (--watch) falla con EACCES al escribir .map.
for path in /app/node_modules /app/uploads /app/uploads_test /app/logs; do
  chown -R node:node "$path" 2>/dev/null || true
  chmod -R u+rwX,g+rwX "$path" 2>/dev/null || true
done

if ! chown -R node:node /app/dist 2>/dev/null; then
  echo "[entrypoint] WARN: no se pudo chown /app/dist a node (bind mount?). Si ves EACCES en tsc/nest, en el host ejecuta:"
  echo '  sudo chown -R "$(id -u):$(id -g)" backend/smart-economat-backend/dist'
else
  chmod -R u+rwX,g+rwX /app/dist 2>/dev/null || true
fi

# Ejecutar el comando original como el usuario node
exec su-exec node "$@"

#!/bin/sh
set -eu

MANIFEST_FILE="package-lock.json"
MARKER_DIR="node_modules/.cache/smarteconomat"
MARKER_FILE="$MARKER_DIR/frontend-deps.sha256"
# Marcador adicional para el caché de Vite (esbuild dep optimizer).
# Ata el ciclo de vida del caché a las entradas que invalidan el bundle:
#   - package-lock.json (versión de las deps)
#   - vite.config.ts    (include/exclude del optimizador, plugins, alias…)
# Sin esto, el volumen `vite_cache` persistente conserva metadatos parciales
# entre reinicios y el navegador acaba pidiendo chunks que ya no existen
# (`The file does not exist at "/tmp/.vite-smarteconomat/deps/chunk-XXX.js"`).
VITE_CACHE_DIR="/tmp/.vite-smarteconomat"
VITE_MARKER_FILE="$MARKER_DIR/vite-cache.sha256"
VITE_CONFIG_FILE="vite.config.ts"

if [ ! -f "$MANIFEST_FILE" ]; then
  MANIFEST_FILE="package.json"
fi

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "❌ No se encontró package.json"
  exit 1
fi

CURRENT_HASH="$(sha256sum "$MANIFEST_FILE" | awk '{print $1}')"
STORED_HASH=""

if [ -f "$MARKER_FILE" ]; then
  STORED_HASH="$(cat "$MARKER_FILE")"
fi

if [ ! -d node_modules ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "📦 Sincronizando dependencias del frontend usando $MANIFEST_FILE..."
  # Red inestable (Docker/CI): reintentos y menos conexiones paralelas (misma idea que backend/Dockerfile.prod)
  export NPM_CONFIG_FETCH_RETRIES=5
  export NPM_CONFIG_FETCH_RETRY_FACTOR=2
  export NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
  export NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
  export NPM_CONFIG_MAXSOCKETS=1
  export NPM_CONFIG_PROGRESS=false
  export NPM_CONFIG_PREFER_OFFLINE=true
  if [ "$MANIFEST_FILE" = "package-lock.json" ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
  mkdir -p "$MARKER_DIR"
  printf '%s' "$CURRENT_HASH" > "$MARKER_FILE"
else
  echo "✅ Dependencias del frontend al día"
fi

# Invalidar el caché del optimizador de Vite cuando cambian las entradas que
# determinan su contenido. Hash combinado de package-lock.json + vite.config.ts.
VITE_HASH_INPUT=""
if [ -f package-lock.json ]; then
  VITE_HASH_INPUT="$(sha256sum package-lock.json | awk '{print $1}')"
else
  VITE_HASH_INPUT="$(sha256sum package.json | awk '{print $1}')"
fi
if [ -f "$VITE_CONFIG_FILE" ]; then
  VITE_CONFIG_HASH="$(sha256sum "$VITE_CONFIG_FILE" | awk '{print $1}')"
  VITE_HASH_INPUT="${VITE_HASH_INPUT}-${VITE_CONFIG_HASH}"
fi
VITE_CURRENT_HASH="$(printf '%s' "$VITE_HASH_INPUT" | sha256sum | awk '{print $1}')"
VITE_STORED_HASH=""
if [ -f "$VITE_MARKER_FILE" ]; then
  VITE_STORED_HASH="$(cat "$VITE_MARKER_FILE")"
fi

if [ "$VITE_CURRENT_HASH" != "$VITE_STORED_HASH" ]; then
  if [ -d "$VITE_CACHE_DIR" ]; then
    echo "🧹 Invalidando caché de Vite ($VITE_CACHE_DIR) por cambio en deps o vite.config.ts..."
    # Borrado robusto: el directorio puede ser un mountpoint (volumen Docker),
    # así que no se elimina la raíz, solo su contenido.
    find "$VITE_CACHE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  fi
  mkdir -p "$MARKER_DIR"
  printf '%s' "$VITE_CURRENT_HASH" > "$VITE_MARKER_FILE"
else
  echo "✅ Caché de Vite consistente con deps y vite.config.ts"
fi

#!/bin/sh
set -eu

MANIFEST_FILE="package-lock.json"
MARKER_DIR="node_modules/.cache/smarteconomat"
MARKER_FILE="$MARKER_DIR/frontend-deps.sha256"

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

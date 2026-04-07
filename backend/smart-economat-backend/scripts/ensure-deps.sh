#!/bin/sh
set -eu

MANIFEST_FILE="package-lock.json"
MARKER_DIR="node_modules/.cache/smarteconomat"
MARKER_FILE="$MARKER_DIR/backend-deps.sha256"

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

if [ ! -d node_modules ] || [ ! -f node_modules/.bin/nest ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "📦 Sincronizando dependencias del backend usando $MANIFEST_FILE..."
  if [ "$MANIFEST_FILE" = "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
  mkdir -p "$(dirname "$MARKER_FILE")"
  printf '%s' "$CURRENT_HASH" > "$MARKER_FILE"
else

  echo "✅ Dependencias del backend al día"
fi

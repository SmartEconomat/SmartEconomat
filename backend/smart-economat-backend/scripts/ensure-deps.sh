#!/bin/sh
# ──────────────────────────────────────────────────────────────────
# ensure-deps.sh
# Sincroniza node_modules si package-lock.json o package.json cambia
# Compatible con: sh (ash/dash/busybox), bash, zsh
# ──────────────────────────────────────────────────────────────────
set -eu

MANIFEST_FILE="package-lock.json"
MARKER_DIR="node_modules/.cache/smarteconomat"
MARKER_FILE="$MARKER_DIR/backend-deps.sha256"

if [ ! -f "$MANIFEST_FILE" ]; then
  MANIFEST_FILE="package.json"
fi

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "[ERROR] No se encontro package.json"
  exit 1
fi

CURRENT_HASH="$(sha256sum "$MANIFEST_FILE" | awk '{print $1}')"
STORED_HASH=""

if [ -f "$MARKER_FILE" ]; then
  STORED_HASH="$(cat "$MARKER_FILE")"
fi

if [ ! -d node_modules ] || [ ! -f node_modules/.bin/nest ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "[SYNC] Sincronizando dependencias del backend usando $MANIFEST_FILE..."
  if [ "$MANIFEST_FILE" = "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
  mkdir -p "$MARKER_DIR"
  printf '%s' "$CURRENT_HASH" > "$MARKER_FILE"
else
  echo "[OK] Dependencias del backend al dia"
fi

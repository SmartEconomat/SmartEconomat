#!/bin/sh
# ============================================================
# docker-entrypoint.sh – Frontend dependency guard (POSIX sh)
# Equivalente a ensure-deps.sh del backend pero para Vite.
# El marker file vive en node_modules para compartir partición
# con los módulos → escritura atómica cross-platform.
# ============================================================
set -eu

LOCKFILE="package-lock.json"
PKGFILE="package.json"
MARKER_FILE="node_modules/.smarteconomat-deps.sha256"

# ── 1. Determinar el manifest a usar ────────────────────────
if [ -f "$LOCKFILE" ]; then
  MANIFEST="$LOCKFILE"
elif [ -f "$PKGFILE" ]; then
  MANIFEST="$PKGFILE"
else
  echo "❌ [frontend-entrypoint] No se encontró package-lock.json ni package.json en $(pwd)"
  exit 1
fi

# ── 2. Calcular hash actual del manifest ────────────────────
CURRENT_HASH="$(sha256sum "$MANIFEST" | cut -d' ' -f1)"
STORED_HASH=""
if [ -f "$MARKER_FILE" ]; then
  STORED_HASH="$(cat "$MARKER_FILE" 2>/dev/null || true)"
fi

# ── 3. Decidir si reinstalar ────────────────────────────────
# Se chequea: node_modules vacío, vite CLI ausente, o lockfile cambiado
NEEDS_INSTALL=false
if [ ! -d node_modules ] || [ ! -f node_modules/.bin/vite ]; then
  echo "📦 [frontend-entrypoint] node_modules vacío o incompleto – instalando..."
  NEEDS_INSTALL=true
elif [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "📦 [frontend-entrypoint] $MANIFEST cambió (hash: $CURRENT_HASH) – reinstalando..."
  NEEDS_INSTALL=true
fi

# ── 4. Instalar si necesario ────────────────────────────────
if [ "$NEEDS_INSTALL" = "true" ]; then
  if [ "$MANIFEST" = "$LOCKFILE" ]; then
    npm ci --prefer-offline 2>&1 || npm ci
  else
    npm install
  fi
  printf '%s' "$CURRENT_HASH" > "$MARKER_FILE"
  echo "✅ [frontend-entrypoint] Dependencias instaladas (hash: $CURRENT_HASH)"
else
  echo "✅ [frontend-entrypoint] Dependencias del frontend al día (hash: $CURRENT_HASH)"
fi

# ── 5. Arrancar Vite ────────────────────────────────────────
# exec reemplaza el proceso sh por npm → señales (SIGTERM) se propagan
# correctamente al proceso de Vite para un shutdown limpio.
exec npm run dev -- --host


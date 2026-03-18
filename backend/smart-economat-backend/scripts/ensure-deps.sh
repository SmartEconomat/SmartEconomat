#!/bin/sh
# ============================================================
# ensure-deps.sh – Backend dependency guard (POSIX sh)
# Lógica: hash-based reinstall del lockfile.
# El marker file vive en node_modules para compartir partición
# con los módulos → escritura atómica, sin problemas de permisos.
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
  echo "❌ [ensure-deps] No se encontró package-lock.json ni package.json en $(pwd)"
  exit 1
fi

# ── 2. Calcular hash actual del manifest ────────────────────
CURRENT_HASH="$(sha256sum "$MANIFEST" | cut -d' ' -f1)"
STORED_HASH=""
if [ -f "$MARKER_FILE" ]; then
  STORED_HASH="$(cat "$MARKER_FILE" 2>/dev/null || true)"
fi

# ── 3. Detectar si hay binarios nativos compilados ──────────
# bcrypt y @sentry/profiling-node compilan archivos .node
# Si node_modules existe pero los .node faltan → build corrupto
NATIVE_OK=true
if [ -d node_modules/bcrypt ] && [ ! -f node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node ]; then
  echo "⚠️  [ensure-deps] Binario nativo de bcrypt no encontrado – forzando reinstalación"
  NATIVE_OK=false
fi

# ── 4. Decidir si reinstalar ────────────────────────────────
NEEDS_INSTALL=false
if [ ! -d node_modules ] || [ ! -f node_modules/.bin/nest ]; then
  echo "📦 [ensure-deps] node_modules vacío o incompleto – instalando..."
  NEEDS_INSTALL=true
elif [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "📦 [ensure-deps] $MANIFEST cambió (hash: $CURRENT_HASH) – reinstalando..."
  NEEDS_INSTALL=true
elif [ "$NATIVE_OK" = "false" ]; then
  NEEDS_INSTALL=true
fi

# ── 5. Instalar si necesario ────────────────────────────────
if [ "$NEEDS_INSTALL" = "true" ]; then
  if [ "$MANIFEST" = "$LOCKFILE" ]; then
    # npm ci garantiza reproducibilidad exacta del lockfile
    npm ci --prefer-offline 2>&1 || npm ci
  else
    npm install
  fi
  # Guardar hash del manifest actualizado
  printf '%s' "$CURRENT_HASH" > "$MARKER_FILE"
  echo "✅ [ensure-deps] Dependencias instaladas (hash: $CURRENT_HASH)"
else
  echo "✅ [ensure-deps] Dependencias del backend al día (hash: $CURRENT_HASH)"
fi

#!/usr/bin/env bash
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

# ── 3. Detectar si hay binarios nativos críticos ─────────────
# Nota: bcrypt@^6 es JS puro; no requiere binarios. Evitar falsos positivos.
# Verificamos solo paquetes que sí usan binarios nativos (p. ej. @sentry/profiling-node).
NATIVE_OK=true
if [ -d node_modules/@sentry/profiling-node ]; then
  if ! find node_modules/@sentry/profiling-node -type f -name '*.node' | grep -q .; then
    echo "⚠️  [ensure-deps] Binarios nativos de @sentry/profiling-node no encontrados – forzando reinstalación"
    NATIVE_OK=false
  fi
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

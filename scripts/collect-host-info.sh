#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# collect-host-info.sh
# Recopila información del host (Linux/macOS) y la exporta como variables
# de entorno HOST_* para que docker-compose las inyecte al contenedor.
#
# Uso:
#   source scripts/collect-host-info.sh
#   docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PLATFORM="$(uname -s | tr '[:upper:]' '[:lower:]')"

# ── Usuario y hostname ──
export HOST_USER="${USER:-$(whoami 2>/dev/null || echo 'Desconocido')}"
export HOST_HOSTNAME="${HOSTNAME:-$(hostname 2>/dev/null || echo 'Desconocido')}"
export HOST_PWD="${PWD}"

# ── Shell ──
export HOST_SHELL="${SHELL:-$(echo "$0")}"

# ── Red: MAC ──
export HOST_MAC
if [[ "$PLATFORM" == linux* ]]; then
  default_iface="$(ip route 2>/dev/null | awk '/default/ {print $5}' | head -1 || echo '')"
  if [ -n "$default_iface" ]; then
    HOST_MAC="$(cat /sys/class/net/"${default_iface}"/address 2>/dev/null || echo 'Desconocida')"
  else
    HOST_MAC="Desconocida"
  fi
elif [[ "$PLATFORM" == darwin* ]]; then
  HOST_MAC="$(ifconfig en0 2>/dev/null | awk '/ether/ {print $2}' || echo 'Desconocida')"
else
  HOST_MAC="Desconocida"
fi

echo "✅ Variables HOST_* del anfitrión exportadas correctamente."
echo "   HOST_USER=$HOST_USER  HOST_HOSTNAME=$HOST_HOSTNAME"

#!/bin/sh
set -eu

# Export environment variables so they're available to envsubst and nginx
export DOMAIN="${DOMAIN:-smarteconomat.app}"
export TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"

echo "[env-init] Exported DOMAIN=$DOMAIN"
echo "[env-init] Exported TLS_PROVIDER=$TLS_PROVIDER"

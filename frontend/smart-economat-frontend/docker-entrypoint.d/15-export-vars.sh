#!/bin/sh
set -eu

# Export environment variables so they're available to envsubst and nginx
export DOMAIN="${DOMAIN:-smarteconomat.app}"
export FRONTEND_API_URL="${FRONTEND_API_URL:-https://smarteconomat.app}"
export BACKEND_API_URL="${BACKEND_API_URL:-https://smarteconomat.app/api/v1}"

echo "[env-init] Exported DOMAIN=$DOMAIN"
echo "[env-init] Exported FRONTEND_API_URL=$FRONTEND_API_URL"
echo "[env-init] Exported BACKEND_API_URL=$BACKEND_API_URL"

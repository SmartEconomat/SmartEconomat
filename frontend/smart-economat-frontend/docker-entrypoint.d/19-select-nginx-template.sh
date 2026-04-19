#!/bin/sh
set -eu

SSL_TEMPLATE="/opt/nginx-templates/default-ssl.conf.template"
HTTP_TEMPLATE="/opt/nginx-templates/default-http.conf.template"
TARGET_TEMPLATE="/etc/nginx/templates/default.conf.template"
CERT_PATH="${NGINX_SSL_CERT_PATH:-/etc/nginx/certs/fullchain.pem}"
KEY_PATH="${NGINX_SSL_KEY_PATH:-/etc/nginx/certs/privkey.pem}"
TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"

if [ "$TLS_PROVIDER" = "none" ]; then
  cp "$HTTP_TEMPLATE" "$TARGET_TEMPLATE"
  echo "[nginx-init] TLS_PROVIDER=none; forcing HTTP config."
elif [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
  cp "$SSL_TEMPLATE" "$TARGET_TEMPLATE"
  echo "[nginx-init] SSL certificates found; enabling HTTPS config."
else
  cp "$HTTP_TEMPLATE" "$TARGET_TEMPLATE"
  echo "[nginx-init] SSL certificates missing; starting in HTTP mode."
fi

#!/bin/sh
# Watches certificate files and reloads Nginx on changes (zero-downtime reload)
# Requires inotify-tools (installed in Dockerfile)
set -eu

CERT_DIR="/etc/nginx/certs"
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"
FILES="$FULLCHAIN $PRIVKEY $CERT_DIR/.reloaded"

if ! command -v inotifywait >/dev/null 2>&1; then
  echo "[nginx-cert-watcher] inotifywait not found; skipping auto-reload" >&2
  exit 0
fi

mkdir -p "$CERT_DIR"

# Bootstrap: if certs are missing, generate temporary self-signed so Nginx can start on 443
if [ ! -s "$FULLCHAIN" ] || [ ! -s "$PRIVKEY" ]; then
  echo "[nginx-cert-watcher] No certificates found. Generating temporary self-signed cert..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$PRIVKEY" -out "$FULLCHAIN" \
    -subj "/CN=localhost" >/dev/null 2>&1 || true
fi

echo "[nginx-cert-watcher] Watching cert updates in $CERT_DIR ..."

while true; do
  inotifywait -e close_write,create,move,attrib $FILES 2>/dev/null || inotifywait -e close_write,create,move,attrib "$CERT_DIR" 2>/dev/null
  echo "[nginx-cert-watcher] Change detected → nginx -s reload"
  nginx -s reload || true
  # Debounce small bursts
  sleep 2
done

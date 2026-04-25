#!/bin/sh
# Watches certificate files and reloads Nginx on changes (zero-downtime reload)
# Requires inotify-tools (installed in Dockerfile)
set -eu

CERT_DIR="/etc/nginx/certs"
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"
FILES="$FULLCHAIN $PRIVKEY $CERT_DIR/.reloaded"
TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"

if [ "$TLS_PROVIDER" = "none" ]; then
  echo "[nginx-cert-watcher] TLS_PROVIDER=none; removing any stale certificates and skipping watcher."
  rm -rf "$CERT_DIR"
  mkdir -p "$CERT_DIR"
  exit 0
fi

if ! command -v inotifywait >/dev/null 2>&1; then
  echo "[nginx-cert-watcher] inotifywait not found; skipping auto-reload" >&2
  exit 0
fi

mkdir -p "$CERT_DIR"

echo "[nginx-cert-watcher] Watching cert updates in $CERT_DIR ..."

while true; do
  inotifywait -e close_write,create,move,attrib $FILES 2>/dev/null || inotifywait -e close_write,create,move,attrib "$CERT_DIR" 2>/dev/null
  echo "[nginx-cert-watcher] Change detected → nginx -s reload"
  nginx -s reload || true
  # Debounce small bursts
  sleep 2
done

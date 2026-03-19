#!/bin/sh
# Deploy hook for Certbot (runs after a successful issuance/renewal)
# Purpose:
#  - Create/refresh stable symlinks at /etc/letsencrypt/{fullchain.pem,privkey.pem}
#    so Nginx can reference fixed paths regardless of lineage/domain folder.
#  - Touch a marker file to trigger inotify-based reload in the frontend container.
#
# Environment (provided by Certbot):
#  - RENEWED_LINEAGE: absolute path to the live lineage directory of the renewed cert
#                     e.g. /etc/letsencrypt/live/example.com
#
set -eu

LIVE_DIR="${RENEWED_LINEAGE:-}"
TARGET_DIR="/etc/letsencrypt"

if [ -z "$LIVE_DIR" ] || [ ! -d "$LIVE_DIR" ]; then
  echo "[deploy-hook] LIVE_DIR missing or invalid: $LIVE_DIR" >&2
  exit 0
fi

ln -sf "$LIVE_DIR/fullchain.pem" "$TARGET_DIR/fullchain.pem"
ln -sf "$LIVE_DIR/privkey.pem"   "$TARGET_DIR/privkey.pem"

# Touch marker to notify watchers in other containers (e.g., Nginx sidecar)
touch "$TARGET_DIR/.reloaded"
echo "[deploy-hook] Symlinks updated and reload marker touched."

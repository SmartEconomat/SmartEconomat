#!/bin/bash
set -euo pipefail

APP_NAME="${APP_NAME:-SmartEconomat}"
ARCHIVE_NAME="${ARCHIVE_NAME:-SmartEconomat_AI_Upload.zip}"
REMOTE_BASE_DIR="${REMOTE_BASE_DIR:-$HOME}"

APP_DIR="$REMOTE_BASE_DIR/$APP_NAME"
ARCHIVE_PATH="$REMOTE_BASE_DIR/$ARCHIVE_NAME"
STAMP=$(date +%s)
BACKUP_DIR="$REMOTE_BASE_DIR/${APP_NAME}_backup_$STAMP"

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "No se encontro el paquete de despliegue en $ARCHIVE_PATH"
    exit 1
fi

sudo chmod 666 /var/run/docker.sock || true

if [ -d "$APP_DIR" ]; then
    echo "Creando backup en $BACKUP_DIR"
    sudo mv "$APP_DIR" "$BACKUP_DIR"
fi

echo "Extrayendo $ARCHIVE_NAME"
mkdir -p "$APP_DIR"
unzip -q "$ARCHIVE_PATH" -d "$APP_DIR"

for path in certs certs-data certs-webroot uploads; do
    if [ -d "$BACKUP_DIR/$path" ]; then
        echo "Restaurando $path desde backup"
        sudo rm -rf "$APP_DIR/$path"
        sudo cp -rp "$BACKUP_DIR/$path" "$APP_DIR/"
    fi
done

cat > "$APP_DIR/.env.prod" <<EOF
NODE_ENV=${NODE_ENV:-production}
DOMAIN=${DOMAIN:-}
BACKEND_API_URL=${BACKEND_API_URL:-}
FRONTEND_API_URL=${FRONTEND_API_URL:-}
POSTGRES_USER=${POSTGRES_USER:-}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
POSTGRES_DB=${POSTGRES_DB:-}
DB_HOST=${DB_HOST:-}
DB_PORT=${DB_PORT:-}
DB_USERNAME=${DB_USERNAME:-}
DB_PASSWORD=${DB_PASSWORD:-}
DB_DATABASE=${DB_DATABASE:-}
JWT_SECRET=${JWT_SECRET:-}
JWT_EXPIRATION=${JWT_EXPIRATION:-7d}
VITE_API_PROXY_TARGET=${VITE_API_PROXY_TARGET:-}
SENTRY_DSN=${SENTRY_DSN:-}
VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
ACME_DIRECTORY_URL=${ACME_DIRECTORY_URL:-}
ACME_EMAIL=${ACME_EMAIL:-}
EOF

chmod 600 "$APP_DIR/.env.prod"

cd "$APP_DIR"
chmod +x scripts/*.sh

echo "Iniciando build y despliegue"
sudo ./scripts/setup-production.sh

echo "Esperando a que el backend este listo..."
sleep 15

echo "Ejecutando seeders..."
sudo docker-compose --env-file .env.prod -f docker-compose.prod.yml exec -T backend sh -lc 'NODE_ENV=development node dist/seeders/seed.js reset'

rm -f "$ARCHIVE_PATH"

echo "Deployment and seeding completed successfully."
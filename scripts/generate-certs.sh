#!/bin/bash
# Este script emite/renueva certificados usando Certbot con un servidor ACME configurable (Actalis recomendado).
# Compatible con emisión en modo webroot (zero-downtime) sirviendo el challenge a través de Nginx.

set -euo pipefail

if [ -f .env.prod ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env.prod | xargs)
fi

DOMAIN=${DOMAIN:-"example.com"}
ACME_DIRECTORY_URL=${ACME_DIRECTORY_URL:-""}
ACME_EMAIL=${ACME_EMAIL:-"admin@$DOMAIN"}

if [ -z "$ACME_DIRECTORY_URL" ]; then
    echo "[generate-certs] ACME_DIRECTORY_URL no definido. Establece el endpoint de Actalis en .env.prod (por ej., https://<actalis-acme>/directory)." >&2
    exit 1
fi

echo "Emitiendo/renovando certificados para $DOMAIN y api.$DOMAIN (ACME: $ACME_DIRECTORY_URL) ..."

# Asegurarse de que el directorio de certs existe
mkdir -p certs

# Emisión/renovación mediante webroot compartido con Nginx (sin parar servicios)
WEBROOT_DIR="$(pwd)/certs-webroot"
mkdir -p "$WEBROOT_DIR/.well-known/acme-challenge"

if [ "${1:-}" = "--renew" ]; then
    echo "Renovando certificados..."
    docker run --rm --name certbot \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -v "$WEBROOT_DIR:/var/www/certbot" \
        -e ACME_DIRECTORY_URL="$ACME_DIRECTORY_URL" \
        certbot/certbot renew --non-interactive --server "$ACME_DIRECTORY_URL" --webroot -w /var/www/certbot \
            --deploy-hook "/bin/sh /etc/letsencrypt/renewal-hooks/deploy/10-symlink-and-touch.sh"
else
    echo "Emitiendo certificados por primera vez (webroot)..."
    docker run --rm --name certbot \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -v "$WEBROOT_DIR:/var/www/certbot" \
        -e ACME_DIRECTORY_URL="$ACME_DIRECTORY_URL" \
        certbot/certbot certonly --webroot -w /var/www/certbot \
            -d "$DOMAIN" -d "api.$DOMAIN" \
            --non-interactive --agree-tos --email "$ACME_EMAIL" \
            --server "$ACME_DIRECTORY_URL"
fi

# Una vez obtenidos, Nginx espera encontrar fullchain.pem y privkey.pem en /etc/nginx/certs/
# Los deploy-hooks dentro del contenedor crean symlinks estables en ./certs
# (fullchain.pem, privkey.pem) y tocan un marcador .reloaded que nuestro Nginx
# vigila para recargar sin downtime.
if [ -d "certs/live/$DOMAIN" ]; then
    echo "Certificados disponibles en certs/live/$DOMAIN (symlinks en ./certs)"
else
    echo "Error: No se encontraron los certificados en certs/live/$DOMAIN"
    exit 1
fi

# Configurar CRON para renovación automática si no existe
CRON_JOB="0 0 * * * cd $(pwd) && ./scripts/generate-certs.sh --renew >> ./scripts/renew.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "generate-certs.sh"; echo "$CRON_JOB") | crontab -
echo "Cron job configurado para renovación diaria."

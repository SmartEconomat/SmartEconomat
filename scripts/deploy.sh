#!/bin/bash
# ==============================================================================
# SmartEconomat - Script Maestro de Despliegue Consolidado
# ==============================================================================
# Este script gestiona el despliegue completo, certificados SSL y firewall.
# ==============================================================================

set -euo pipefail

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables base
APP_NAME="${APP_NAME:-SmartEconomat}"
ARCHIVE_NAME="${ARCHIVE_NAME:-SmartEconomat_AI_Upload.zip}"
REMOTE_BASE_DIR="${REMOTE_BASE_DIR:-$HOME}"
APP_DIR="$REMOTE_BASE_DIR/$APP_NAME"
ARCHIVE_PATH="$REMOTE_BASE_DIR/$ARCHIVE_NAME"

# ------------------------------------------------------------------------------
# FUNCION: Renovación de certificados (usada por CRON)
# ------------------------------------------------------------------------------
renew_certs() {
    echo -e "${YELLOW}Renovando certificados SSL (webroot)...${NC}"
    cd "$APP_DIR"
    docker run --rm --name certbot \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -v "$(pwd)/certs-webroot:/var/www/certbot" \
        -e ACME_DIRECTORY_URL="$ACME_DIRECTORY_URL" \
        certbot/certbot renew --non-interactive --server "$ACME_DIRECTORY_URL" --webroot -w /var/www/certbot \
            --deploy-hook "/bin/sh /etc/letsencrypt/renewal-hooks/deploy/10-symlink-and-touch.sh"
    echo -e "${GREEN}Renovación completada.${NC}"
}

# Si se llama con --renew, ejecutar solo la renovación y salir
if [ "${1:-}" = "--renew" ]; then
    # Cargar env para tener el ACME_DIRECTORY_URL
    if [ -f "$APP_DIR/.env.prod" ]; then
        # shellcheck disable=SC2046
        export $(grep -v '^#' "$APP_DIR/.env.prod" | xargs)
    fi
    renew_certs
    exit 0
fi

echo -e "${GREEN}Iniciando despliegue de $APP_NAME...${NC}"

# 1. Asegurar dependencias del sistema
echo -e "\n${YELLOW}[1/8] Verificando dependencias del sistema...${NC}"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zip unzip curl ufw > /dev/null

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER || true
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
fi
sudo chmod 666 /var/run/docker.sock || true

# 2. Backup y Extracción
echo -e "\n${YELLOW}[2/8] Preparando archivos de la aplicación...${NC}"
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo -e "${RED}Error: No se encontro el paquete en $ARCHIVE_PATH${NC}"
    exit 1
fi

STAMP=$(date +%s)
BACKUP_DIR="$REMOTE_BASE_DIR/${APP_NAME}_backup_$STAMP"

if [ -d "$APP_DIR" ]; then
    echo "Haciendo backup de la versión anterior..."
    sudo mv "$APP_DIR" "$BACKUP_DIR"
fi

mkdir -p "$APP_DIR"
unzip -q "$ARCHIVE_PATH" -d "$APP_DIR"

# Restaurar datos persistentes si existen
for path in certs certs-data certs-webroot uploads; do
    if [ -d "$BACKUP_DIR/$path" ]; then
        echo "Restaurando $path..."
        sudo rm -rf "$APP_DIR/$path"
        sudo cp -rp "$BACKUP_DIR/$path" "$APP_DIR/"
    fi
done

# Restaurar la versión más reciente de los hooks porque la copia de seguridad los ha pisado
if unzip -l "$ARCHIVE_PATH" | grep -q 'certs/renewal-hooks/'; then
    sudo unzip -q -o "$ARCHIVE_PATH" "certs/renewal-hooks/*" -d "$APP_DIR"
fi

# 3. Configurar Firewall (UFW)
echo -e "\n${YELLOW}[3/8] Configurando Firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Generar .env.prod
echo -e "\n${YELLOW}[4/8] Generando variables de entorno...${NC}"
cat > "$APP_DIR/.env.prod" <<EOF
NODE_ENV=${NODE_ENV:-production}
DOMAIN=${DOMAIN:-}
BACKEND_API_URL=${BACKEND_API_URL:-}
FRONTEND_API_URL=${FRONTEND_API_URL:-}
POSTGRES_USER=${POSTGRES_USER:-}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
POSTGRES_DB=${POSTGRES_DB:-}
DB_HOST=db
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-${POSTGRES_USER:-}}
DB_PASSWORD=${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}
DB_DATABASE=${DB_DATABASE:-${POSTGRES_DB:-}}
JWT_SECRET=${JWT_SECRET:-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)}
JWT_EXPIRATION=${JWT_EXPIRATION:-7d}
VITE_API_PROXY_TARGET=${VITE_API_PROXY_TARGET:-}
SENTRY_DSN=${SENTRY_DSN:-}
VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
ACME_DIRECTORY_URL=${ACME_DIRECTORY_URL:-}
ACME_EMAIL=${ACME_EMAIL:-admin@${DOMAIN:-example.com}}
EOF
chmod 600 "$APP_DIR/.env.prod"

# 5. Gestionar Certificados SSL
echo -e "\n${YELLOW}[5/8] Configurando Certificados SSL...${NC}"
cd "$APP_DIR"
mkdir -p certs certs-data certs-webroot/.well-known/acme-challenge
# Asegurar permisos de los hooks
if [ -d "certs/renewal-hooks" ]; then
    sudo find certs/renewal-hooks -type f -name "*.sh" -exec chmod +x {} +
fi

if [ -z "$(sudo find certs/live -name 'fullchain.pem' 2>/dev/null)" ]; then
    echo -e "${YELLOW}No se encontraron certificados. Iniciando emisión (standalone)...${NC}"
    docker run --rm --name certbot \
        -p 80:80 \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -e ACME_DIRECTORY_URL="$ACME_DIRECTORY_URL" \
        certbot/certbot certonly --standalone \
            -d "$DOMAIN" -d "api.$DOMAIN" \
            --non-interactive --agree-tos --email "$ACME_EMAIL" \
            --server "$ACME_DIRECTORY_URL" \
            --deploy-hook "/bin/sh /etc/letsencrypt/renewal-hooks/deploy/10-symlink-and-touch.sh"
else
    echo -e "${GREEN}Certificados existentes encontrados.${NC}"
    # Recrear symlinks relativos para evitar que se rompan en el host o en el contenedor de NGINX
    ACTIVE_CERT=$(sudo find certs/live -name 'fullchain.pem' 2>/dev/null | head -n 1 || true)
    if [ -n "$ACTIVE_CERT" ]; then
        ACTIVE_DOMAIN=$(basename "$(dirname "$ACTIVE_CERT")")
        sudo ln -sf "live/$ACTIVE_DOMAIN/fullchain.pem" "certs/fullchain.pem"
        sudo ln -sf "live/$ACTIVE_DOMAIN/privkey.pem" "certs/privkey.pem"
    fi
fi
sudo chmod -R 755 certs certs-data || true

# Configurar CRON para renovación
CRON_JOB="0 0 * * * $APP_DIR/scripts/deploy.sh --renew >> $APP_DIR/renewal.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "deploy.sh --renew" || true; echo "$CRON_JOB") | crontab -

# 6. Desplegar Contenedores
echo -e "\n${YELLOW}[6/8] Levantando Docker Compose...${NC}"
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 7. Ejecutar Seeders
echo -e "\n${YELLOW}[7/8] Inicializando base de datos (Seeders)...${NC}"
echo "Esperando a que el backend este listo..."
sleep 15
sudo docker-compose --env-file .env.prod -f docker-compose.prod.yml exec -T backend sh -lc 'NODE_ENV=development node dist/seeders/seed.js reset'

# 8. Limpiar
echo -e "\n${YELLOW}[8/8] Limpiando archivos temporales...${NC}"
rm -f "$ARCHIVE_PATH"

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}       ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!         ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Enlace: https://$DOMAIN"

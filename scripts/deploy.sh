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
LETSENCRYPT_ACME_PROD_URL="https://acme-v02.api.letsencrypt.org/directory"
LETSENCRYPT_ACME_STAGING_URL="https://acme-staging-v02.api.letsencrypt.org/directory"
LETSENCRYPT_CONFIG_DIR="/etc/letsencrypt"
LETSENCRYPT_WORK_DIR="/var/lib/letsencrypt"
LETSENCRYPT_LOGS_DIR="/var/log/letsencrypt"
LETSENCRYPT_WEBROOT_DIR="/var/www/acme-challenge"
DEPLOY_BACKUP_RETENTION="${DEPLOY_BACKUP_RETENTION:-1}"
DEPLOY_PRUNE_DOCKER_BEFORE_BUILD="${DEPLOY_PRUNE_DOCKER_BEFORE_BUILD:-true}"

TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"
TLS_SELF_SIGNED_DAYS="${TLS_SELF_SIGNED_DAYS:-825}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-${ACME_EMAIL:-smarteconomat@gmail.com}}"
LETSENCRYPT_DIRECTORY_URL="${LETSENCRYPT_DIRECTORY_URL:-${ACME_DIRECTORY_URL:-$LETSENCRYPT_ACME_PROD_URL}}"

validate_tls_provider() {
    case "$TLS_PROVIDER" in
        selfsigned|letsencrypt)
            ;;
        *)
            echo -e "${RED}Error: TLS_PROVIDER inválido. Usa 'selfsigned' o 'letsencrypt'. Valor actual: $TLS_PROVIDER${NC}"
            exit 1
            ;;
    esac
}

validate_letsencrypt_directory() {
    case "$LETSENCRYPT_DIRECTORY_URL" in
        https://acme-v02.api.letsencrypt.org/directory|https://acme-staging-v02.api.letsencrypt.org/directory)
            ;;
        *)
            echo -e "${RED}Error: LETSENCRYPT_DIRECTORY_URL debe apuntar a Let's Encrypt (prod o staging). Valor actual: $LETSENCRYPT_DIRECTORY_URL${NC}"
            exit 1
            ;;
    esac
}

cleanup_old_release_backups() {
    local backups=()
    local backup

    while IFS= read -r backup; do
        backups+=("$backup")
    done < <(find "$REMOTE_BASE_DIR" -maxdepth 1 -mindepth 1 -type d -name "${APP_NAME}_backup_*" | sort -r)

    if [ "${#backups[@]}" -le "$DEPLOY_BACKUP_RETENTION" ]; then
        return
    fi

    echo "Eliminando backups antiguos para liberar espacio..."
    for ((i=DEPLOY_BACKUP_RETENTION; i<${#backups[@]}; i++)); do
        sudo rm -rf "${backups[$i]}"
    done
}

cleanup_release_workspace() {
    if [ ! -d "$APP_DIR" ]; then
        return
    fi

    echo "Limpiando release anterior preservando datos persistentes..."
    find "$APP_DIR" -mindepth 1 -maxdepth 1 \
        ! -name "certs" \
        ! -name "certs-data" \
        ! -name "certs-webroot" \
        ! -name "uploads" \
        ! -name "renewal.log" \
        ! -name ".env.prod" \
        -exec sudo rm -rf {} +
}

prune_docker_storage() {
    if [ "$DEPLOY_PRUNE_DOCKER_BEFORE_BUILD" != "true" ]; then
        return
    fi

    echo "Liberando cache y artefactos Docker no usados..."
    sudo docker builder prune -af || true
    sudo docker image prune -af || true
    sudo docker container prune -f || true
}

refresh_active_certificate_symlinks() {
    local active_cert
    active_cert=$(sudo find certs/live -name 'fullchain.pem' 2>/dev/null | head -n 1 || true)
    if [ -n "$active_cert" ]; then
        local active_domain
        active_domain=$(basename "$(dirname "$active_cert")")
        sudo ln -sf "live/$active_domain/fullchain.pem" "certs/fullchain.pem"
        sudo ln -sf "live/$active_domain/privkey.pem" "certs/privkey.pem"
    fi
}

generate_self_signed_certificates() {
    local cert_dir="certs/live/selfsigned"
    sudo mkdir -p "$cert_dir"

    echo -e "${YELLOW}Generando certificado autofirmado para $DOMAIN y api.$DOMAIN ...${NC}"
    sudo openssl req -x509 -nodes -newkey rsa:4096 -sha256 \
        -days "$TLS_SELF_SIGNED_DAYS" \
        -keyout "$cert_dir/privkey.pem" \
        -out "$cert_dir/fullchain.pem" \
        -subj "/CN=$DOMAIN/O=SmartEconomat/C=ES" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:api.$DOMAIN" \
        -addext "keyUsage=digitalSignature,keyEncipherment" \
        -addext "extendedKeyUsage=serverAuth"

    refresh_active_certificate_symlinks
}

issue_letsencrypt_initial_certificates() {
    validate_letsencrypt_directory
    echo -e "${YELLOW}Solicitando certificado Let's Encrypt inicial (modo deploy DigitalOcean)...${NC}"

    docker run --rm --name letsencrypt-client \
        -p 80:80 \
        -v "$(pwd)/certs:$LETSENCRYPT_CONFIG_DIR" \
        -v "$(pwd)/certs-data:$LETSENCRYPT_WORK_DIR" \
        certbot/certbot certonly --standalone \
            -d "$DOMAIN" -d "api.$DOMAIN" \
            --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" \
            --server "$LETSENCRYPT_DIRECTORY_URL" \
            --config-dir "$LETSENCRYPT_CONFIG_DIR" \
            --work-dir "$LETSENCRYPT_WORK_DIR" \
            --logs-dir "$LETSENCRYPT_LOGS_DIR"

    refresh_active_certificate_symlinks
}

configure_renewal_cron() {
    if [ "$TLS_PROVIDER" = "letsencrypt" ]; then
        local cron_job
        cron_job="0 0 * * * $APP_DIR/scripts/deploy.sh --renew >> $APP_DIR/renewal.log 2>&1"
        (crontab -l 2>/dev/null | grep -Fv "deploy.sh --renew" || true; echo "$cron_job") | crontab -
        return
    fi

    (crontab -l 2>/dev/null | grep -Fv "deploy.sh --renew" || true) | crontab -
}

# ------------------------------------------------------------------------------
# FUNCION: Renovación de certificados (usada por CRON)
# ------------------------------------------------------------------------------
renew_certs() {
    if [ "$TLS_PROVIDER" != "letsencrypt" ]; then
        echo -e "${YELLOW}TLS_PROVIDER=$TLS_PROVIDER. No se requiere renovación automática.${NC}"
        return 0
    fi

    validate_letsencrypt_directory
    echo -e "${YELLOW}Renovando certificados TLS con Let's Encrypt...${NC}"
    cd "$APP_DIR"
    docker run --rm --name letsencrypt-client \
        -v "$(pwd)/certs:$LETSENCRYPT_CONFIG_DIR" \
        -v "$(pwd)/certs-data:$LETSENCRYPT_WORK_DIR" \
        -v "$(pwd)/certs-webroot:$LETSENCRYPT_WEBROOT_DIR" \
        certbot/certbot renew --non-interactive --server "$LETSENCRYPT_DIRECTORY_URL" \
            --config-dir "$LETSENCRYPT_CONFIG_DIR" \
            --work-dir "$LETSENCRYPT_WORK_DIR" \
            --logs-dir "$LETSENCRYPT_LOGS_DIR" \
            --webroot -w "$LETSENCRYPT_WEBROOT_DIR" || true

    refresh_active_certificate_symlinks
    echo -e "${GREEN}Renovación completada.${NC}"
}

# Si se llama con --renew, ejecutar solo la renovación y salir
if [ "${1:-}" = "--renew" ]; then
    # Cargar env de producción para conocer modo TLS y parámetros asociados.
    if [ -f "$APP_DIR/.env.prod" ]; then
        # shellcheck disable=SC2046
        export $(grep -v '^#' "$APP_DIR/.env.prod" | xargs)
    fi

    TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"
    TLS_SELF_SIGNED_DAYS="${TLS_SELF_SIGNED_DAYS:-825}"
    LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-${ACME_EMAIL:-smarteconomat@gmail.com}}"
    LETSENCRYPT_DIRECTORY_URL="${LETSENCRYPT_DIRECTORY_URL:-${ACME_DIRECTORY_URL:-$LETSENCRYPT_ACME_PROD_URL}}"

    validate_tls_provider
    renew_certs
    exit 0
fi

echo -e "${GREEN}Iniciando despliegue de $APP_NAME...${NC}"

# 1. Asegurar dependencias del sistema
echo -e "\n${YELLOW}[1/7] Verificando dependencias del sistema...${NC}"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zip unzip curl ufw openssl > /dev/null

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

# 2. Preparación y Extracción
echo -e "\n${YELLOW}[2/7] Preparando archivos de la aplicación...${NC}"
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo -e "${RED}Error: No se encontro el paquete en $ARCHIVE_PATH${NC}"
    exit 1
fi

STAMP=$(date +%s)
BACKUP_DIR="$REMOTE_BASE_DIR/${APP_NAME}_backup_$STAMP"

if [ -d "$APP_DIR" ]; then
    echo "Guardando un backup ligero de datos persistentes..."
    mkdir -p "$BACKUP_DIR"
    for path in certs certs-data certs-webroot uploads; do
        if [ -d "$APP_DIR/$path" ]; then
            sudo cp -rp "$APP_DIR/$path" "$BACKUP_DIR/"
        fi
    done
fi

cleanup_old_release_backups
cleanup_release_workspace

mkdir -p "$APP_DIR"
unzip -q "$ARCHIVE_PATH" -d "$APP_DIR"
rm -f "$ARCHIVE_PATH"

# Restaurar datos persistentes si existen
for path in certs certs-data certs-webroot uploads; do
    if [ -d "$BACKUP_DIR/$path" ]; then
        echo "Restaurando $path..."
        sudo rm -rf "$APP_DIR/$path"
        sudo cp -rp "$BACKUP_DIR/$path" "$APP_DIR/"
    fi
done

# 3. Configurar Firewall (UFW)
echo -e "\n${YELLOW}[3/7] Configurando Firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Generar .env.prod
echo -e "\n${YELLOW}[4/7] Generando variables de entorno...${NC}"
if [ -z "${SEED_DEFAULT_ADMIN_TEMP_PASSWORD:-}" ]; then
    echo -e "${RED}Error crítico: SEED_DEFAULT_ADMIN_TEMP_PASSWORD es obligatoria en producción.${NC}"
    exit 1
fi

cat > "$APP_DIR/.env.prod" <<EOF
NODE_ENV=${NODE_ENV:-production}
DOMAIN=${DOMAIN:-}
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
POSTGRES_USER=${POSTGRES_USER:-}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
POSTGRES_DB=${POSTGRES_DB:-smart_economat}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
DB_HOST=db
DB_SYNC=${DB_SYNC:-false}
JWT_SECRET=${JWT_SECRET:-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)}
JWT_EXPIRATION=${JWT_EXPIRATION:-7d}
SEED_DEFAULT_ADMIN_TEMP_PASSWORD=${SEED_DEFAULT_ADMIN_TEMP_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD:-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)}
SENTRY_DSN=${SENTRY_DSN:-}
VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
TLS_PROVIDER=${TLS_PROVIDER:-selfsigned}
TLS_SELF_SIGNED_DAYS=${TLS_SELF_SIGNED_DAYS:-825}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-${ACME_EMAIL:-smarteconomat@gmail.com}}
LETSENCRYPT_DIRECTORY_URL=${LETSENCRYPT_DIRECTORY_URL:-${ACME_DIRECTORY_URL:-$LETSENCRYPT_ACME_PROD_URL}}
CERTS_DIR=${CERTS_DIR:-./certs}
CERTS_WEBROOT_DIR=${CERTS_WEBROOT_DIR:-./certs-webroot}
EOF
chmod 600 "$APP_DIR/.env.prod"

TLS_PROVIDER="${TLS_PROVIDER:-selfsigned}"
TLS_SELF_SIGNED_DAYS="${TLS_SELF_SIGNED_DAYS:-825}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-${ACME_EMAIL:-smarteconomat@gmail.com}}"
LETSENCRYPT_DIRECTORY_URL="${LETSENCRYPT_DIRECTORY_URL:-${ACME_DIRECTORY_URL:-$LETSENCRYPT_ACME_PROD_URL}}"

validate_tls_provider
if [ "$TLS_PROVIDER" = "letsencrypt" ]; then
    validate_letsencrypt_directory
fi

if [ -z "${DOMAIN:-}" ]; then
    echo -e "${RED}Error: DOMAIN es obligatorio para generar certificados TLS.${NC}"
    exit 1
fi

# 5. Gestionar Certificados TLS
echo -e "\n${YELLOW}[5/7] Configurando Certificados TLS (modo: $TLS_PROVIDER)...${NC}"
cd "$APP_DIR"
mkdir -p certs certs-data certs-webroot/.well-known/acme-challenge

if [ -z "$(sudo find certs/live -name 'fullchain.pem' 2>/dev/null)" ]; then
    if [ "$TLS_PROVIDER" = "selfsigned" ]; then
        echo -e "${YELLOW}No se encontraron certificados. Se generará certificado autofirmado local.${NC}"
        generate_self_signed_certificates
    else
        if ! issue_letsencrypt_initial_certificates; then
            echo -e "${YELLOW}No fue posible emitir TLS con Let's Encrypt. Se generará certificado autofirmado de respaldo.${NC}"
            generate_self_signed_certificates
        fi
    fi
else
    echo -e "${GREEN}Certificados existentes encontrados.${NC}"
    refresh_active_certificate_symlinks
fi
sudo chmod -R 755 certs certs-data || true

# Configurar (o limpiar) CRON de renovación según proveedor TLS
configure_renewal_cron

# 6. Desplegar Contenedores
echo -e "\n${YELLOW}[6/7] Levantando Docker Compose...${NC}"
prune_docker_storage
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans

# 7. Limpiar
echo -e "\n${YELLOW}[7/7] Limpiando archivos temporales...${NC}"
if [ -d "$BACKUP_DIR" ]; then
    echo "Backup persistente disponible en $BACKUP_DIR"
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}       ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!         ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Enlace: https://$DOMAIN"

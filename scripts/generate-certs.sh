#!/bin/bash

# Este script genera certificados SSL gratuitos usando Let's Encrypt y Certbot.
# Debe ejecutarse en el servidor de producción.

if [ -f .env.prod ]; then
    export $(grep -v '^#' .env.prod | xargs)
fi

DOMAIN=${DOMAIN:-"48.220.49.43.nip.io"}
EMAIL="admin@$DOMAIN" # Puedes cambiar esto

echo "Generando certificados para $DOMAIN y api.$DOMAIN..."

# Asegurarse de que el directorio de certs existe
mkdir -p certs

# Usar Docker para ejecutar Certbot y obtener los certificados
# Nota: Esto requiere que el puerto 80 esté libre en el host durante la ejecución.
if [ "$1" == "--renew" ]; then
    echo "Renovando certificados..."
    docker run --rm --name certbot \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -p 80:80 \
        certbot/certbot renew --non-interactive
else
    echo "Generando certificados por primera vez..."
    docker run --rm --name certbot \
        -v "$(pwd)/certs:/etc/letsencrypt" \
        -v "$(pwd)/certs-data:/var/lib/letsencrypt" \
        -p 80:80 \
        certbot/certbot certonly --standalone \
        -d "$DOMAIN" -d "api.$DOMAIN" \
        --non-interactive --agree-tos --email "$EMAIL"
fi

# Una vez obtenidos, Nginx espera encontrar fullchain.pem y privkey.pem en /etc/nginx/certs/
if [ -d "certs/live/$DOMAIN" ]; then
    cp -L "certs/live/$DOMAIN/fullchain.pem" certs/
    cp -L "certs/live/$DOMAIN/privkey.pem" certs/
    echo "Certificados actualizados en ./certs/"
    
    # Reiniciar Nginx si está corriendo para aplicar cambios
    if docker ps | grep -q "frontend"; then
        echo "Reiniciando contenedor frontend para aplicar certificados..."
        docker restart $(docker ps -q --filter name=frontend)
    fi
else
    echo "Error: No se encontraron los certificados en certs/live/$DOMAIN"
    exit 1
fi

# Configurar CRON para renovación automática si no existe
CRON_JOB="0 0 1 * * cd $(pwd) && ./scripts/generate-certs.sh --renew >> ./scripts/renew.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "generate-certs.sh"; echo "$CRON_JOB") | crontab -
echo "Cron job configurado para renovación mensual."

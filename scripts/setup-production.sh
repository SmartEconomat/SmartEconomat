#!/bin/bash

# ==============================================================================
# SmartEconomat - Script de Preparación Profesional para Producción (Linux)
# ==============================================================================
# Este script instala Docker, Docker Compose y prepara el entorno
# para un despliegue de producción de SmartEconomat.
# ==============================================================================

set -e

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}       SmartEconomat - Preparación de Producción    ${NC}"
echo -e "${GREEN}====================================================${NC}"

# 1. Verificación del sistema y actualización de paquetes
echo -e "\n${YELLOW}[1/5] Verificando sistema y actualizando paquetes...${NC}"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release zip unzip

# 2. Instalar Docker si no está presente
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker no encontrado. Instalando Docker Engine...${NC}"
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    # Asegurar que el socket de docker tenga los permisos correctos inmediatamente
    sudo chmod 666 /var/run/docker.sock
    echo -e "${GREEN}Docker instalado correctamente.${NC}"
else
    echo -e "${GREEN}Docker ya está instalado.${NC}"
    # Asegurar permisos del socket incluso si ya está instalado
    sudo chmod 666 /var/run/docker.sock
fi

# 3. Configurar alias para Docker Compose V2 si es necesario
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Creando alias para docker-compose...${NC}"
    sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
fi

# 4. Configuración del entorno
echo -e "\n${YELLOW}[2/5] Configurando variables de entorno...${NC}"
if [ ! -f .env.prod ]; then
    echo -e "${YELLOW}.env.prod no encontrado. Creando desde plantilla...${NC}"
    cp .env.example .env.prod
    
    # Solicitar variables esenciales si es interactivo
    if [ -t 0 ]; then
        read -p "Introduce la IP pública o Dominio (ej. 48.220.49.43 o ejemplo.com): " MY_DOMAIN
        if [ ! -z "$MY_DOMAIN" ]; then
            # Verificación simple para IP y uso de nip.io para facilitar SSL
            if [[ $MY_DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                FULL_DOMAIN="$MY_DOMAIN.nip.io"
            else
                FULL_DOMAIN="$MY_DOMAIN"
            fi
            
            sed -i "s|DOMAIN=.*|DOMAIN=$FULL_DOMAIN|g" .env.prod
            sed -i "s|BACKEND_API_URL=.*|BACKEND_API_URL=https://api.$FULL_DOMAIN|g" .env.prod
            sed -i "s|FRONTEND_API_URL=.*|FRONTEND_API_URL=https://$FULL_DOMAIN|g" .env.prod
            
            # Actualizar también .env.prod del frontend
            if [ -f frontend/smart-economat-frontend/.env.prod ]; then
                sed -i "s|DOMAIN=.*|DOMAIN=$FULL_DOMAIN|g" frontend/smart-economat-frontend/.env.prod
                sed -i "s|FRONTEND_API_URL=.*|FRONTEND_API_URL=https://$FULL_DOMAIN|g" frontend/smart-economat-frontend/.env.prod
                sed -i "s|VITE_API_PROXY_TARGET=.*|VITE_API_PROXY_TARGET=https://api.$FULL_DOMAIN|g" frontend/smart-economat-frontend/.env.prod
            fi
        fi
        
        # Generar secreto JWT aleatorio
        JWT_SEC=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SEC|g" .env.prod
        
        # Establecer modo producción
        sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env.prod
    fi
else
    echo -e "${GREEN}.env.prod ya existe. Saltando creación.${NC}"
fi

# 5. Generación de Certificados SSL
echo -e "\n${YELLOW}[3/5] Configurando certificados SSL...${NC}"
chmod +x scripts/generate-certs.sh
# Verificar si los certificados ya existen
if [ ! -f certs/fullchain.pem ]; then
    echo -e "${YELLOW}Iniciando generación de SSL...${NC}"
    sudo ./scripts/generate-certs.sh
else
    echo -e "${GREEN}Certificados SSL encontrados en ./certs/.${NC}"
fi

# 6. Construir y Desplegar
echo -e "\n${YELLOW}[4/5] Construyendo y lanzando contenedores...${NC}"
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 7. Verificación
echo -e "\n${YELLOW}[5/5] Verificando despliegue...${NC}"
sleep 10
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}       ¡PREPARACIÓN COMPLETADA!                     ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Frontend: ${GREEN}https://$(grep DOMAIN .env.prod | cut -d '=' -f2)${NC}"
echo -e "API Docs: ${GREEN}https://api.$(grep DOMAIN .env.prod | cut -d '=' -f2)/docs${NC}"
echo -e "\nRecuerda cerrar sesión y volver a entrar para usar docker sin sudo la próxima vez."

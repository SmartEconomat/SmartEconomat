#!/bin/bash
# fix-prod-container-conflict.sh
# Resuelve conflictos de nombres de contenedores duplicados en producción

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Solucionador de Conflicto de Contenedores Docker ===${NC}\n"

# Validar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}✗ Error: docker-compose.prod.yml no encontrado.${NC}"
    echo "Ejecuta este script desde la raiz del proyecto SmartEconomat."
    exit 1
fi

echo -e "${YELLOW}1. Deteniendo todos los servicios docker-compose...${NC}"
docker compose -f docker-compose.prod.yml down --remove-orphans

echo -e "${YELLOW}2. Limpiando contenedores huérfanos...${NC}"
docker container prune -f

echo -e "${YELLOW}3. Verificando contenedores restantes con 'smarteconomat'...${NC}"
ORPHANED=$(docker ps -a --filter "name=smarteconomat" --format "{{.ID}}" 2>/dev/null || true)

if [ -n "$ORPHANED" ]; then
    echo -e "${YELLOW}   Encontrados contenedores huérfanos. Eliminando...${NC}"
    echo "$ORPHANED" | xargs docker rm -f 2>/dev/null || true
    echo -e "${GREEN}   ✓ Contenedores huérfanos eliminados${NC}"
else
    echo -e "${GREEN}   ✓ No hay contenedores huérfanos${NC}"
fi

echo -e "${YELLOW}4. Reconstruyendo imágenes sin cache...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}5. Levantando servicios...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Esperar a que estén listos
echo -e "${YELLOW}6. Esperando a que servicios estén running (máx 30 segundos)...${NC}"
sleep 5

STATUS_BACKEND=$(docker compose -f docker-compose.prod.yml ps backend --format "{{.State}}" 2>/dev/null || echo "unknown")
STATUS_FRONTEND=$(docker compose -f docker-compose.prod.yml ps frontend --format "{{.State}}" 2>/dev/null || echo "unknown")

echo ""
echo -e "${BLUE}Estado final:${NC}"
echo "  Backend: $STATUS_BACKEND"
echo "  Frontend: $STATUS_FRONTEND"

if [ "$STATUS_BACKEND" = "running" ] && [ "$STATUS_FRONTEND" = "running" ]; then
    echo -e "\n${GREEN}=== ✓ Despliegue exitoso ===${NC}"
    echo ""
    docker compose -f docker-compose.prod.yml ps
else
    echo -e "\n${RED}⚠ Algunos servicios no están running${NC}"
    echo "Revisa los logs:"
    echo "docker compose -f docker-compose.prod.yml logs -f --tail=50"
    exit 1
fi

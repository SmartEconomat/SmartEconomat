#!/bin/bash
# ============================================================================
# SmartEconomat - Setup HTTPS Local Automático (Linux/macOS)
# ============================================================================
# Unifica: certificados, confianza, hosts - TODO en un comando
# Uso: bash ./scripts/setup-smarteconomat-local.sh
# ============================================================================

set -eu

DOMAIN="smarteconomat.app"
API_DOMAIN="api.smarteconomat.app"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTS_DIR="$REPO_ROOT/certs"
LOCAL_CA_DIR="$CERTS_DIR/local-ca"
CERT_FILE="$LOCAL_CA_DIR/smarteconomat-local-root-ca.crt"

detect_lan_ip() {
    if [ -n "${LOCAL_BIND_IP:-}" ]; then
        echo "$LOCAL_BIND_IP"
        return 0
    fi

    if [ "$(uname -s)" = "Darwin" ]; then
        local iface lan_ip
        iface="$(route -n get default 2>/dev/null | awk '/interface: / {print $2; exit}' || true)"
        if [ -n "$iface" ]; then
            lan_ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
            if [ -n "$lan_ip" ]; then
                echo "$lan_ip"
                return 0
            fi
        fi

        for iface in en0 en1 bridge0; do
            lan_ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
            if [ -n "$lan_ip" ]; then
                echo "$lan_ip"
                return 0
            fi
        done
    else
        local lan_ip
        if command -v ip >/dev/null 2>&1; then
            lan_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{ for (i = 1; i <= NF; i++) { if ($i == "src") { print $(i + 1); exit } } }' || true)"
        fi
        if [ -z "$lan_ip" ] && command -v hostname >/dev/null 2>&1; then
            lan_ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
        fi
        if [ -n "$lan_ip" ]; then
            echo "$lan_ip"
            return 0
        fi
    fi

    echo "127.0.0.1"
}

LAN_IP="$(detect_lan_ip)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🔐 SmartEconomat - Setup HTTPS Local                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Detectar OS
detect_os() {
    if [ "$(uname -s)" = "Darwin" ]; then
        echo "darwin"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/fedora-release ]; then
        echo "fedora"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    elif [ -f /etc/os-release ]; then
        echo "generic"
    else
        echo "unknown"
    fi
}

# Paso 1: Generar certificados (si no existen)
setup_certificates() {
    print_step "Verificando certificados..."
    
    if [ -f "$CERT_FILE" ]; then
        print_success "Certificados ya existen"
        return 0
    fi
    
    print_warning "Certificados no encontrados, generando..."
    LOCAL_BIND_IP="$LAN_IP" bash "$REPO_ROOT/scripts/setup-local-prod-https.sh" || {
        print_error "Error generando certificados"
        return 1
    }
    print_success "Certificados generados"
}

# Paso 2: Confiar certificado en el sistema
trust_certificate() {
    print_step "Confiando certificado en el sistema..."
    OS_TYPE=$(detect_os)
    
    if ! command -v sudo &> /dev/null; then
        print_error "sudo no disponible"
        return 1
    fi
    
    # Debian/Ubuntu
    if [ "$OS_TYPE" = "debian" ]; then
        sudo cp "$CERT_FILE" /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt
        sudo chmod 644 /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt
        sudo update-ca-certificates > /dev/null 2>&1
        
    # Fedora/RHEL
    elif [ "$OS_TYPE" = "fedora" ]; then
        sudo cp "$CERT_FILE" /etc/pki/ca-trust/source/anchors/smarteconomat-local-root-ca.crt
        sudo chmod 644 /etc/pki/ca-trust/source/anchors/smarteconomat-local-root-ca.crt
        sudo update-ca-trust extract > /dev/null 2>&1
        
    # Arch
    elif [ "$OS_TYPE" = "arch" ]; then
        sudo cp "$CERT_FILE" /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt
        sudo chmod 644 /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt
        sudo update-ca-trust > /dev/null 2>&1

    # macOS
    elif [ "$OS_TYPE" = "darwin" ]; then
        if sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_FILE" > /dev/null 2>&1; then
            print_success "Certificado confiado en el llavero del sistema"
            return 0
        fi

        print_warning "No se pudo importar automáticamente en el llavero del sistema"
        print_warning "Prueba manualmente con: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain \"$CERT_FILE\""
        return 1
    else
        print_warning "Sistema operativo no reconocido; saltando confianza automática"
        return 1
    fi
    
    print_success "Certificado confiado en el sistema"
}

# Paso 3: Agregar DNS local a /etc/hosts
setup_hosts() {
    print_step "Configurando /etc/hosts..."
    
    if ! command -v sudo &> /dev/null; then
        print_warning "sudo no disponible, saltando /etc/hosts"
        return 0
    fi
    
    local host_line="${LAN_IP}  ${DOMAIN} ${API_DOMAIN}"
    local temp_hosts

    temp_hosts="$(mktemp)"

    awk -v domain="$DOMAIN" -v host_line="$host_line" '
        BEGIN { updated = 0 }
        $0 ~ "(^|[[:space:]])" domain "([[:space:]]|$)" {
            if (!updated) {
                print host_line
                updated = 1
            }
            next
        }
        { print }
        END { if (!updated) print host_line }
    ' /etc/hosts > "$temp_hosts"

    sudo cp "$temp_hosts" /etc/hosts
    rm -f "$temp_hosts"

    print_success "Agregado a /etc/hosts: $LAN_IP $DOMAIN $API_DOMAIN"
}

open_firewall_ports() {
    print_step "Ajustando firewall local..."

    if command -v ufw >/dev/null 2>&1; then
        sudo ufw allow 80/tcp >/dev/null 2>&1 || true
        sudo ufw allow 443/tcp >/dev/null 2>&1 || true
        print_success "Puertos 80/443 permitidos en UFW"
        return 0
    fi

    if command -v firewall-cmd >/dev/null 2>&1; then
        sudo firewall-cmd --permanent --add-port=80/tcp >/dev/null 2>&1 || true
        sudo firewall-cmd --permanent --add-port=443/tcp >/dev/null 2>&1 || true
        sudo firewall-cmd --reload >/dev/null 2>&1 || true
        print_success "Puertos 80/443 permitidos en firewalld"
        return 0
    fi

    if [ "$(uname -s)" = "Darwin" ]; then
        print_warning "macOS puede pedir permiso manual al primer acceso entrante en 80/443"
        return 0
    fi

    print_warning "No se detectó un firewall gestionable; asegúrate de permitir 80/443 si aplica"
}

# Paso 4: Verificar stack Docker
verify_docker() {
    print_step "Verificando stack Docker..."
    
    cd "$REPO_ROOT"
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker Compose no encontrado"
        return 1
    fi
    
    if ! docker compose version > /dev/null 2>&1; then
        print_warning "Docker Compose v2 no disponible"
        return 1
    fi

    if docker compose -f docker-compose.prod.yml ps --services --filter status=running 2>/dev/null | grep -qx "frontend"; then
        print_success "Frontend está Up"
    else
        print_warning "Frontend no está running, levantando..."
        docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend > /dev/null 2>&1
    fi
}

# Paso 5: Mostrar resumen final
print_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Setup completado exitosamente                               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📌 Configuración realizada:${NC}"
    echo "   ✓ Certificados generados/verificados"
    echo "   ✓ Certificado confiado en sistema operativo"
    echo "   ✓ Dominios añadidos a /etc/hosts apuntando a $LAN_IP"
    echo "   ✓ Puertos 80/443 preparados para acceso en red"
    echo "   ✓ Stack Docker verificado"
    echo ""
    echo -e "${BLUE}🌐 Acceso disponible:${NC}"
    echo "   → https://$DOMAIN"
    echo "   → https://$API_DOMAIN"
    echo "   → https://$LAN_IP"
    echo ""
    echo -e "${BLUE}💡 Próximos pasos:${NC}"
    echo "   1. Cierra todos los navegadores completamente"
    echo "   2. Reabre tu navegador favorito"
    echo "   3. Accede a https://$DOMAIN o https://$LAN_IP"
    echo ""
    echo -e "${YELLOW}ℹ️  Si ves error de certificado en navegador:${NC}"
    echo "   → Firefox: about:preferences#privacy → Certificados → Autoridades"
    echo "   → Chrome: chrome://settings/security → Administrar certificados"
    echo "   → O accede a https://$LAN_IP (sin error)"
    echo ""
}

# Main
main() {
    print_header
    
    # Validar que estamos en el repo correcto
    if [ ! -d "$REPO_ROOT" ]; then
        print_error "Repo no encontrado en: $REPO_ROOT"
        exit 1
    fi
    
    cd "$REPO_ROOT"
    
    # Ejecutar pasos
    setup_certificates || exit 1
    trust_certificate || print_warning "Error confiando certificado"
    setup_hosts || print_warning "Error configurando hosts"
    open_firewall_ports || print_warning "Error ajustando firewall"
    verify_docker || print_warning "Error verificando Docker"
    
    print_summary
}

main "$@"

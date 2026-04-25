#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${LOCAL_DOMAIN:-smarteconomat.app}"
API_DOMAIN="${LOCAL_API_DOMAIN:-api.${DOMAIN}}"
CA_NAME="${LOCAL_CA_NAME:-SmartEconomat Local Root CA}"
CA_DAYS="${LOCAL_CA_DAYS:-3650}"
CERT_DAYS="${LOCAL_CERT_DAYS:-825}"
ENV_FILE="${ROOT_DIR}/.env.prod"
OS_NAME="$(uname -s | tr '[:upper:]' '[:lower:]')"

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

CA_DIR="${ROOT_DIR}/certs/local-ca"
LIVE_DIR="${ROOT_DIR}/certs/live/local-${DOMAIN}"
WEBROOT_DIR="${ROOT_DIR}/certs-webroot/.well-known/acme-challenge"
CA_KEY="${CA_DIR}/smarteconomat-local-root-ca.key"
CA_CERT="${CA_DIR}/smarteconomat-local-root-ca.crt"
SERVER_KEY="${LIVE_DIR}/privkey.pem"
SERVER_CSR="${LIVE_DIR}/server.csr"
SERVER_CERT="${LIVE_DIR}/cert.pem"
FULLCHAIN="${LIVE_DIR}/fullchain.pem"
EXT_FILE="${LIVE_DIR}/openssl-ext.cnf"

with_hosts=false
if [ "${1:-}" = "--with-hosts" ]; then
  with_hosts=true
fi

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: comando requerido no encontrado: $cmd" >&2
    exit 1
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local temp_file
  local target_user="${SUDO_USER:-}"
  local target_group=""

  if [ ! -f "$ENV_FILE" ]; then
    cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
  fi

  temp_file="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ "^" key "=" { print key "=" value; updated = 1; next }
    { print }
    END { if (!updated) print key "=" value }
  ' "$ENV_FILE" > "$temp_file"

  mv "$temp_file" "$ENV_FILE"

  if [ -n "$target_user" ] && [ "$(id -u)" -eq 0 ]; then
    target_group="$(id -gn "$target_user" 2>/dev/null || true)"
    if [ -n "$target_group" ]; then
      chown "$target_user:$target_group" "$ENV_FILE" 2>/dev/null || true
    else
      chown "$target_user" "$ENV_FILE" 2>/dev/null || true
    fi
  fi

  chmod 600 "$ENV_FILE"
}

ensure_seed_temp_password() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
  fi

  if grep -q '^SEED_DEFAULT_ADMIN_TEMP_PASSWORD=' "$ENV_FILE"; then
    return
  fi

  printf "SEED_DEFAULT_ADMIN_TEMP_PASSWORD=%s\n" "SmartEconomat2026!" >> "$ENV_FILE"
}

ensure_redis_password() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
  fi

  if grep -q '^REDIS_PASSWORD=' "$ENV_FILE"; then
    return
  fi

  local generated_password
  generated_password="$(openssl rand -hex 16)"
  printf "REDIS_PASSWORD=%s\n" "$generated_password" >> "$ENV_FILE"
}

ensure_network_ip_env() {
  upsert_env "LOCAL_BIND_IP" "$LAN_IP"
}

ensure_hosts_entry() {
  local host_line="127.0.0.1 ${DOMAIN} ${API_DOMAIN}"

  if grep -Eq "(^|[[:space:]])${DOMAIN}([[:space:]]|$)" /etc/hosts; then
    echo "[local-https] /etc/hosts ya contiene ${DOMAIN}"
    return
  fi

  if [ "$(id -u)" -ne 0 ]; then
    echo "Error: --with-hosts requiere permisos de root para editar /etc/hosts" >&2
    echo "Usa el flujo principal: bash ./scripts/setup-smarteconomat-local.sh" >&2
    exit 1
  fi

  printf "\n%s\n" "$host_line" >> /etc/hosts
  echo "[local-https] Entrada agregada a /etc/hosts: $host_line"
}

print_macos_trust_hint() {
  if [ "$OS_NAME" != "darwin" ]; then
    return 0
  fi

  echo "[local-https] macOS detectado: para confiar la CA local ejecuta:"
  echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain \"$CA_CERT\""
}

require_command openssl

mkdir -p "$CA_DIR" "$LIVE_DIR" "$WEBROOT_DIR" "${ROOT_DIR}/certs"

if [ ! -f "$CA_KEY" ] || [ ! -f "$CA_CERT" ]; then
  echo "[local-https] Generando CA local SmartEconomat..."
  openssl req -x509 -nodes -newkey rsa:4096 -sha256 \
    -days "$CA_DAYS" \
    -keyout "$CA_KEY" \
    -out "$CA_CERT" \
    -subj "/CN=${CA_NAME}/O=SmartEconomat/C=ES"
fi

  cat > "$EXT_FILE" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:${DOMAIN},DNS:${API_DOMAIN},DNS:localhost,IP:127.0.0.1,IP:::1${LAN_IP:+,IP:${LAN_IP}}
EOF

echo "[local-https] Generando certificado TLS para ${DOMAIN} y ${API_DOMAIN}..."
openssl genrsa -out "$SERVER_KEY" 4096
openssl req -new -key "$SERVER_KEY" -out "$SERVER_CSR" -subj "/CN=${DOMAIN}/O=SmartEconomat/C=ES"
openssl x509 -req -in "$SERVER_CSR" \
  -CA "$CA_CERT" \
  -CAkey "$CA_KEY" \
  -CAcreateserial \
  -out "$SERVER_CERT" \
  -days "$CERT_DAYS" \
  -sha256 \
  -extfile "$EXT_FILE"

cat "$SERVER_CERT" "$CA_CERT" > "$FULLCHAIN"
ln -sfn "live/local-${DOMAIN}/fullchain.pem" "${ROOT_DIR}/certs/fullchain.pem"
ln -sfn "live/local-${DOMAIN}/privkey.pem" "${ROOT_DIR}/certs/privkey.pem"

rm -f "$SERVER_CSR" "$EXT_FILE"

upsert_env "DOMAIN" "$DOMAIN"
upsert_env "DB_SYNC" "false"
upsert_env "TLS_PROVIDER" "selfsigned"
ensure_network_ip_env
ensure_seed_temp_password
ensure_redis_password

if [ "$with_hosts" = true ]; then
  ensure_hosts_entry
fi

echo ""
echo "[local-https] Preparacion completada."
echo "[local-https] Dominio local: https://${DOMAIN}"
echo "[local-https] IP de red detectada: ${LAN_IP}"
echo "[local-https] Certificado servidor: ${SERVER_CERT}"
echo "[local-https] Fullchain usada por Nginx: ${ROOT_DIR}/certs/fullchain.pem"
echo ""
echo "Para confiar la CA local en Linux (Debian/Ubuntu):"
echo "  sudo cp ${CA_CERT} /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt"
echo "  sudo update-ca-certificates"
echo ""
echo "Para arrancar produccion local:"
echo "  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
print_macos_trust_hint

#!/usr/bin/env bash
set -euo pipefail

RUNTIME_PATH=""
MODE="all"
RELEASE_BUSY_PORTS="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime-path)
      RUNTIME_PATH="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --release-busy-ports)
      RELEASE_BUSY_PORTS="true"
      shift 1
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 99
      ;;
  esac
done

if [[ -z "$RUNTIME_PATH" ]]; then
  echo "runtime path is required" >&2
  exit 98
fi

check_command() {
  local cmd="$1"
  local code="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd" >&2
    exit "$code"
  fi
}

check_port_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :${port} )" | grep -q LISTEN; then
      return 1
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 1
    fi
  fi
  return 0
}

find_port_owner_pid() {
  local port="$1"
  local pid=""

  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
    if [[ -n "$pid" ]]; then
      printf '%s' "$pid"
      return 0
    fi
  fi

  if command -v ss >/dev/null 2>&1; then
    pid="$(ss -ltnp "( sport = :${port} )" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n1 || true)"
    if [[ -n "$pid" ]]; then
      printf '%s' "$pid"
      return 0
    fi
  fi

  return 1
}

release_busy_port() {
  local port="$1"
  local pid=""

  if ! pid="$(find_port_owner_pid "$port" || true)" || [[ -z "$pid" ]]; then
    echo "port $port is busy but the owner process could not be identified" >&2
    return 1
  fi

  if [[ "$RELEASE_BUSY_PORTS" != "true" ]]; then
    echo "port $port is busy (pid: $pid). re-run with --release-busy-ports to stop it automatically" >&2
    return 1
  fi

  if ! kill -TERM "$pid" >/dev/null 2>&1; then
    echo "failed to stop pid $pid on port $port. try with sudo or stop it manually" >&2
    return 1
  fi

  if check_port_free "$port"; then
    return 0
  fi

  kill -KILL "$pid" >/dev/null 2>&1 || true

  if check_port_free "$port"; then
    return 0
  fi

  echo "port $port remains busy after trying to stop pid $pid" >&2
  return 1
}

generate_tls() {
  local certs_dir="$RUNTIME_PATH/certs"
  local certs_live_dir="$certs_dir/live/local-smarteconomat"
  local webroot_dir="$RUNTIME_PATH/certs-webroot/.well-known/acme-challenge"

  mkdir -p "$certs_live_dir" "$webroot_dir"

  local key_file="$certs_live_dir/privkey.pem"
  local cert_file="$certs_live_dir/fullchain.pem"
  local ext_file="$certs_live_dir/openssl-ext.cnf"

  cat > "$ext_file" <<EOF
subjectAltName=DNS:smarteconomat.app,DNS:localhost,IP:127.0.0.1
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
EOF

  openssl req -x509 -nodes -newkey rsa:4096 \
    -sha256 \
    -days 825 \
    -keyout "$key_file" \
    -out "$cert_file" \
    -subj "/CN=smarteconomat.app/O=SmartEconomat/C=ES" \
    -extensions v3_req \
    -config <(cat /etc/ssl/openssl.cnf "$ext_file")

  ln -sfn "live/local-smarteconomat/fullchain.pem" "$certs_dir/fullchain.pem"
  ln -sfn "live/local-smarteconomat/privkey.pem" "$certs_dir/privkey.pem"
  rm -f "$ext_file"
}

mkdir -p "$RUNTIME_PATH" "$RUNTIME_PATH/backups" "$RUNTIME_PATH/diagnostics"

check_command docker 1
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin unavailable" >&2
  exit 2
fi

if [[ "$MODE" != "tls" ]]; then
  for port in 80 443; do
    if ! check_port_free "$port"; then
      if ! release_busy_port "$port"; then
        exit 3
      fi
    fi
  done
fi

if [[ "$MODE" == "tls" || "$MODE" == "all" ]]; then
  check_command openssl 4
  generate_tls
fi

echo "{\"ok\":true,\"mode\":\"$MODE\",\"runtimePath\":\"$RUNTIME_PATH\",\"releaseBusyPorts\":$RELEASE_BUSY_PORTS}"

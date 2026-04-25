#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Guardian Watchdog externo para SmartEconomat (macOS / Linux)
#
# Monitorea que Electron y Docker estén operativos y los reinicia si caen.
# Se ejecuta como servicio systemd (Linux) o launchd (macOS).
#
# Uso: ./guardian-watchdog.sh [--interval 120] [--max-retries 5]
# ──────────────────────────────────────────────────────────────
set -euo pipefail

CHECK_INTERVAL=${CHECK_INTERVAL:-120}
MAX_RETRIES=${MAX_RETRIES:-5}
BACKOFF_MULTIPLIER=${BACKOFF_MULTIPLIER:-2}
LOG_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/SmartEconomatInstaller"
LOG_FILE="$LOG_DIR/guardian-watchdog.log"
CONSECUTIVE_FAILURES=0

# Parse argumentos
while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval) CHECK_INTERVAL="$2"; shift 2 ;;
    --max-retries) MAX_RETRIES="$2"; shift 2 ;;
    *) shift ;;
  esac
done

mkdir -p "$LOG_DIR"

log() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local msg="[$timestamp] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

get_runtime_path() {
  local marker_path
  if [[ "$(uname)" == "Darwin" ]]; then
    marker_path="$HOME/Library/Application Support/SmartEconomatInstaller/runtime-path.txt"
  else
    marker_path="${XDG_CONFIG_HOME:-$HOME/.config}/SmartEconomatInstaller/runtime-path.txt"
  fi

  if [[ -f "$marker_path" ]]; then
    local rtp
    rtp=$(<"$marker_path")
    rtp="${rtp%%[[:space:]]}"
    if [[ -n "$rtp" && -f "$rtp/project/docker-compose.prod.yml" ]]; then
      echo "$rtp"
      return 0
    fi
  fi

  # Fallback
  local fallback
  if [[ "$(uname)" == "Darwin" ]]; then
    fallback="$HOME/Library/Application Support/SmartEconomatRuntime"
  else
    fallback="$HOME/.smarteconomat-runtime"
  fi

  if [[ -f "$fallback/project/docker-compose.prod.yml" ]]; then
    echo "$fallback"
    return 0
  fi

  return 1
}

test_docker_engine() {
  docker version --format '{{.Server.Version}}' >/dev/null 2>&1
}

start_docker() {
  if [[ "$(uname)" == "Darwin" ]]; then
    log "Intentando iniciar Docker Desktop (macOS)..."
    open -a Docker 2>/dev/null || open /Applications/Docker.app 2>/dev/null || return 1
  else
    log "Intentando iniciar Docker daemon (Linux)..."
    systemctl start docker 2>/dev/null || \
      sudo service docker start 2>/dev/null || \
      systemctl --user start docker-desktop 2>/dev/null || \
      return 1
  fi
  return 0
}

wait_for_docker() {
  local max_attempts=30
  for ((i=1; i<=max_attempts; i++)); do
    if test_docker_engine; then
      log "Docker Engine operativo (intento $i/$max_attempts)."
      return 0
    fi
    sleep 4
  done
  return 1
}

find_electron_process() {
  pgrep -f 'SmartEconomatInstaller' >/dev/null 2>&1
}

find_electron_path() {
  local candidates
  if [[ "$(uname)" == "Darwin" ]]; then
    candidates=(
      "/Applications/SmartEconomatInstaller.app/Contents/MacOS/SmartEconomatInstaller"
      "$HOME/Applications/SmartEconomatInstaller.app/Contents/MacOS/SmartEconomatInstaller"
    )
  else
    candidates=(
      "/opt/SmartEconomatInstaller/SmartEconomatInstaller"
      "$HOME/.local/bin/SmartEconomatInstaller"
      "/usr/local/bin/SmartEconomatInstaller"
    )
  fi

  for path in "${candidates[@]}"; do
    if [[ -x "$path" ]]; then
      echo "$path"
      return 0
    fi
  done
  return 1
}

test_stack_health() {
  local runtime_path="$1"
  local compose_file="$runtime_path/project/docker-compose.prod.yml"
  local env_file="$runtime_path/.env.prod"

  local output
  output=$(docker compose -f "$compose_file" --env-file "$env_file" ps --format json 2>/dev/null) || return 1

  # Verificar si hay servicios unhealthy/exited
  echo "$output" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    if not isinstance(data, list):
        data = [data]
    for svc in data:
        state = (svc.get('State', '') or svc.get('Status', '')).lower()
        health = (svc.get('Health', '')).lower()
        if 'unhealthy' in health or 'exited' in state or 'dead' in state or 'failed' in state:
            sys.exit(1)
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null
}

start_stack() {
  local runtime_path="$1"
  local compose_file="$runtime_path/project/docker-compose.prod.yml"
  local env_file="$runtime_path/.env.prod"
  docker compose -f "$compose_file" --env-file "$env_file" up -d --remove-orphans >/dev/null 2>&1
}

# ── Loop principal ────────────────────────────────────────────

log "Guardian Watchdog iniciado. Intervalo: ${CHECK_INTERVAL}s, OS: $(uname)"

while true; do
  current_interval=$CHECK_INTERVAL
  if [[ $CONSECUTIVE_FAILURES -gt 0 ]]; then
    # Backoff exponencial con techo de 1800s (30 min)
    backoff=$(python3 -c "import math; print(int(min($CHECK_INTERVAL * $BACKOFF_MULTIPLIER ** $CONSECUTIVE_FAILURES, 1800)))" 2>/dev/null || echo "$CHECK_INTERVAL")
    current_interval=$backoff
  fi

  issue_detected=false

  # 1. Verificar Electron
  if ! find_electron_process; then
    log "WARN: Electron no está corriendo. Intentando relanzar..."
    electron_path=$(find_electron_path 2>/dev/null) || true
    if [[ -n "${electron_path:-}" ]]; then
      nohup "$electron_path" --background --control-panel >/dev/null 2>&1 &
      log "Electron relanzado."
    else
      log "ERROR: No se encontró el ejecutable de Electron."
      issue_detected=true
    fi
  fi

  # 2. Verificar Docker Engine
  if ! test_docker_engine; then
    log "WARN: Docker Engine no responde."
    if start_docker; then
      if ! wait_for_docker; then
        log "ERROR: Docker Engine no respondió tras espera."
        issue_detected=true
      fi
    else
      log "ERROR: No se pudo iniciar Docker."
      issue_detected=true
    fi
  fi

  # 3. Verificar stack de contenedores
  if test_docker_engine; then
    runtime_path=$(get_runtime_path 2>/dev/null) || true
    if [[ -n "${runtime_path:-}" ]]; then
      if ! test_stack_health "$runtime_path"; then
        log "WARN: Stack no está healthy. Ejecutando docker compose up -d..."
        if start_stack "$runtime_path"; then
          log "Stack levantado correctamente."
        else
          log "ERROR: No se pudo levantar el stack."
          issue_detected=true
        fi
      fi
    fi
  fi

  # Actualizar backoff
  if [[ "$issue_detected" == "true" ]]; then
    CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
    if [[ $CONSECUTIVE_FAILURES -ge $MAX_RETRIES ]]; then
      log "WARN: Alcanzado máximo de reintentos ($MAX_RETRIES). Aplicando backoff largo."
    fi
  else
    if [[ $CONSECUTIVE_FAILURES -gt 0 ]]; then
      log "OK: Todo operativo. Reseteando contador de fallos."
    fi
    CONSECUTIVE_FAILURES=0
  fi

  sleep "$current_interval"
done

#!/usr/bin/env bash
set -euo pipefail

RUNTIME_PATH=""
PROJECT_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime-path)
      RUNTIME_PATH="$2"
      shift 2
      ;;
    --project-root)
      PROJECT_ROOT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 98
      ;;
  esac
done

if [[ -z "$RUNTIME_PATH" || -z "$PROJECT_ROOT" ]]; then
  echo "runtime path and project root are required" >&2
  exit 99
fi

ENV_FILE="$RUNTIME_PATH/.env.prod"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format json

#!/usr/bin/env bash
set -euo pipefail

RUNTIME_PATH=""
PROJECT_ROOT=""
ARTIFACT=""

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
    --artifact)
      ARTIFACT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 93
      ;;
  esac
done

if [[ -z "$RUNTIME_PATH" || -z "$PROJECT_ROOT" || -z "$ARTIFACT" ]]; then
  echo "runtime path, project root and artifact are required" >&2
  exit 94
fi

if [[ ! -f "$ARTIFACT" ]]; then
  echo "artifact not found" >&2
  exit 95
fi

ENV_FILE="$RUNTIME_PATH/.env.prod"
if [[ ! -f "$ENV_FILE" ]]; then
  echo ".env.prod not found at runtime path" >&2
  exit 96
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
WORK_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

tar -xzf "$ARTIFACT" -C "$WORK_DIR"

if [[ ! -f "$WORK_DIR/metadata.json" || ! -f "$WORK_DIR/database.sql" || ! -f "$WORK_DIR/uploads.tar.gz" ]]; then
  echo "invalid backup artifact format" >&2
  exit 97
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db backend

cat "$WORK_DIR/database.sql" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

cat "$WORK_DIR/uploads.tar.gz" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
  sh -lc "tar -C /app -xzf -"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "Restore completed"

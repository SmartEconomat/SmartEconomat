#!/usr/bin/env bash
set -euo pipefail

RUNTIME_PATH=""
PROJECT_ROOT=""
LABEL="manual"
OUTPUT_DIR=""

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
    --label)
      LABEL="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 90
      ;;
  esac
done

if [[ -z "$RUNTIME_PATH" || -z "$PROJECT_ROOT" ]]; then
  echo "runtime path and project root are required" >&2
  exit 91
fi

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$RUNTIME_PATH/backups"
fi

ENV_FILE="$RUNTIME_PATH/.env.prod"
if [[ ! -f "$ENV_FILE" ]]; then
  echo ".env.prod not found at runtime path" >&2
  exit 92
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$OUTPUT_DIR"

STAMP_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
WORK_DIR="$(mktemp -d)"
ARCHIVE="${OUTPUT_DIR}/smarteconomat-backup_${STAMP_UTC}.tar.gz"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "docker-compose.prod.yml not found" >&2
  exit 93
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db backend >/dev/null

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$WORK_DIR/database.sql"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
  sh -lc "if [ -d /app/uploads ]; then tar -C /app -czf - uploads; else tar -C /tmp -czf - --files-from /dev/null; fi" > "$WORK_DIR/uploads.tar.gz"

if [[ ! -s "$WORK_DIR/database.sql" ]]; then
  echo "database.sql is empty; pg_dump failed" >&2
  exit 94
fi

if [[ ! -s "$WORK_DIR/uploads.tar.gz" ]]; then
  echo "uploads.tar.gz is empty" >&2
  exit 95
fi

CHECKSUM="$(cat "$WORK_DIR/database.sql" "$WORK_DIR/uploads.tar.gz" | sha256sum | awk '{print $1}')"

cat > "$WORK_DIR/metadata.json" <<EOF
{
  "appVersion": "1.0.0",
  "schemaVersion": "v1",
  "createdAt": "$(date --iso-8601=seconds)",
  "checksum": "$CHECKSUM",
  "archiveName": "$(basename "$ARCHIVE")",
  "archivePath": "$ARCHIVE"
}
EOF

tar -czf "$ARCHIVE" -C "$WORK_DIR" database.sql uploads.tar.gz metadata.json

if [[ ! -s "$ARCHIVE" ]]; then
  echo "backup archive was not created" >&2
  exit 96
fi

cat "$WORK_DIR/metadata.json"

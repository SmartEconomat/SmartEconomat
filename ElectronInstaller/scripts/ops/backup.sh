#!/usr/bin/env bash
set -euo pipefail

RUNTIME_PATH=""
PROJECT_ROOT=""
LABEL="manual"

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

ENV_FILE="$RUNTIME_PATH/.env.prod"
if [[ ! -f "$ENV_FILE" ]]; then
  echo ".env.prod not found at runtime path" >&2
  exit 92
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

BACKUP_ROOT="$RUNTIME_PATH/backups"
mkdir -p "$BACKUP_ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
SAFE_LABEL="$(echo "$LABEL" | tr -cd '[:alnum:]_-')"
WORK_DIR="$(mktemp -d)"
ARCHIVE="${BACKUP_ROOT}/backup-${SAFE_LABEL}-${STAMP}.tar.gz"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$WORK_DIR/database.sql"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
  sh -lc "tar -C /app -czf - uploads" > "$WORK_DIR/uploads.tar.gz"

CHECKSUM="$(cat "$WORK_DIR/database.sql" "$WORK_DIR/uploads.tar.gz" | sha256sum | awk '{print $1}')"

cat > "$WORK_DIR/metadata.json" <<EOF
{
  "appVersion": "1.0.0",
  "schemaVersion": "v1",
  "createdAt": "$(date --iso-8601=seconds)",
  "checksum": "$CHECKSUM",
  "archiveName": "$(basename "$ARCHIVE")"
}
EOF

tar -czf "$ARCHIVE" -C "$WORK_DIR" database.sql uploads.tar.gz metadata.json

cat "$WORK_DIR/metadata.json"

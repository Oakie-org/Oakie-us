#!/usr/bin/env bash
# Run the whole app locally: backend with an in-memory AWS emulator and demo
# data on :8000, frontend on :5173. No AWS account needed. Ctrl+C stops both.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="$ROOT_DIR/serverless_backend/venv/bin/python"

if [[ ! -x "$PYTHON" || ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "Dependencies are missing. Run ./scripts/setup-dev.sh first." >&2
  exit 1
fi

trap 'kill 0' EXIT INT TERM
"$PYTHON" "$ROOT_DIR/serverless_backend/scripts/dev_server.py" &
npm --prefix "$ROOT_DIR/frontend" run dev &
wait

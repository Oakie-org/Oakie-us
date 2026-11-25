#!/usr/bin/env bash
# One-time setup: backend virtualenv, backend and frontend dependencies, git hooks.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/serverless_backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"

echo "==> Backend (Python / FastAPI)"
PYTHON_BIN=""
for candidate in python3.11 python3.12 python3.13 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done
if [[ -z "$PYTHON_BIN" ]]; then
  echo "Error: Python 3.11+ is required." >&2
  exit 1
fi
if ! "$PYTHON_BIN" -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then
  echo "Error: $PYTHON_BIN is older than Python 3.11." >&2
  exit 1
fi
echo "Using $("$PYTHON_BIN" --version)"

[[ -d "$VENV_DIR" ]] || "$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --quiet --upgrade pip
"$VENV_DIR/bin/python" -m pip install --quiet -r "$BACKEND_DIR/requirements-dev.txt"

if [[ -d "$ROOT_DIR/.git" ]]; then
  (cd "$ROOT_DIR" && "$VENV_DIR/bin/pre-commit" install >/dev/null) || true
fi

echo "==> Frontend (React / Vite)"
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 20+ is required." >&2
  exit 1
fi
echo "Using Node $(node -v)"
(cd "$FRONTEND_DIR" && npm install --no-audit --no-fund)

echo
echo "Setup complete. Start everything with:  ./scripts/dev.sh"

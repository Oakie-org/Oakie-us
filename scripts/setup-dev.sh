#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> DadaIsland local dev setup"
echo "Repo: $ROOT_DIR"

BACKEND_DIR="$ROOT_DIR/serverless_backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Error: backend directory not found at $BACKEND_DIR" >&2
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: frontend directory not found at $FRONTEND_DIR" >&2
  exit 1
fi

echo
echo "==> Backend (Python/FastAPI)"

PYTHON_BIN=""
if command -v python3.11 >/dev/null 2>&1; then
  PYTHON_BIN="python3.11"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  echo "Error: python3 not found. Install Python 3.11+ first." >&2
  exit 1
fi

PY_VERSION="$("$PYTHON_BIN" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')"
echo "Using Python: $PYTHON_BIN ($PY_VERSION)"

VENV_DIR="$BACKEND_DIR/venv"
if [[ ! -d "$VENV_DIR" ]]; then
  echo "Creating venv at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
else
  echo "Venv already exists at $VENV_DIR"
fi

echo "Installing backend dependencies..."
"$VENV_DIR/bin/pip" install --upgrade pip >/dev/null
"$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -r "$BACKEND_DIR/requirements-dev.txt"

if [[ -d "$ROOT_DIR/.git" && -x "$VENV_DIR/bin/pre-commit" ]]; then
  echo "Installing pre-commit hooks..."
  (cd "$ROOT_DIR" && "$VENV_DIR/bin/pre-commit" install)
fi

echo
echo "==> Frontend (React/Vite)"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node not found. Install Node.js 20+ first." >&2
  exit 1
fi

NODE_VERSION="$(node -v)"
echo "Using Node: $NODE_VERSION"

echo "Installing frontend dependencies..."
(cd "$FRONTEND_DIR" && npm install)

echo
echo "==> Setup complete"
echo "Next steps:"
echo "  Backend:"
echo "    cd serverless_backend"
echo "    source venv/bin/activate"
echo "    uvicorn app.main:app --reload"
echo "  Frontend:"
echo "    cd frontend"
echo "    npm run dev"

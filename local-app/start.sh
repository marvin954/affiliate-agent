#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

echo "Starting Affiliate Agency..."
echo "Hermes endpoint: ${HERMES_BASE_URL:-http://localhost:11434/v1}"
echo "Model: ${HERMES_MODEL:-hermes3}"
echo ""

# Install Python deps
cd "$SCRIPT_DIR/backend"
pip install -r requirements.txt -q

# Install and build frontend
cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run build

# Start backend (serves built frontend + API)
cd "$SCRIPT_DIR/backend"
echo ""
echo "✓ App ready at http://localhost:8000"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

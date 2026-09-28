#!/usr/bin/env bash
# One-command launcher for the JeevikaSetu prototype (backend + frontend).
set -e
cd "$(dirname "$0")"

echo "▶ Starting FastAPI backend on :8000"
(cd backend && ${PYTHON:-python3} main.py) &
BACK=$!
trap 'kill $BACK 2>/dev/null' EXIT

sleep 2
echo "▶ Starting Vite frontend on :5173"
cd frontend && npm run dev

#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Archon Demo — Starting up..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install backend deps
echo "→ Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
echo "✓ Backend ready"

# Build frontend
echo "→ Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "→ Building frontend..."
npm run build
echo "✓ Frontend built"

# Start FastAPI (serves built frontend + API) on $PORT (Cloud Run sets this)
PORT=${PORT:-5000}
echo "✓ Starting Archon on :$PORT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Archon is running!"
echo "  Open the Replit preview to see it"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../backend
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --timeout-keep-alive 120

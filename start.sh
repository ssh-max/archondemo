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

# Start FastAPI backend on port 8000 (background)
uvicorn main:app --host 0.0.0.0 --port 8000 --timeout-keep-alive 120 &
BACKEND_PID=$!
echo "✓ FastAPI running on :8000 (PID $BACKEND_PID)"

# Install frontend deps
echo "→ Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "✓ Frontend dependencies installed"

# Start Vite dev server on port 3000 (foreground)
echo "✓ Starting React app on :3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Archon is running!"
echo "  Open the Replit preview to see it"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run dev

# Cleanup backend on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

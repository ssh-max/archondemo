# Archon

Archon is a B2B enterprise architecture advisor.

## Project structure

- **Frontend:** `./frontend/` — main file `frontend/src/App.tsx`, components in `frontend/src/components/`
- **Backend:** `./backend/` — main file `backend/main.py`
- **Types:** `frontend/src/types.ts`

## Tech stack

- **Frontend:** React + TypeScript + Tailwind
- **Backend:** FastAPI + Python

## How it works

The app calls the Claude API with SSE streaming to generate cloud architecture
solutions. Mermaid diagrams are rendered with `architecture-beta` syntax.

## Working agreement

The app currently runs without errors. Generation, streaming, and diagram
repair all work correctly. Any change must not break these.

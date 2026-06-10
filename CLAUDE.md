# Archon

Archon is a B2B enterprise architecture advisor.

## Project structure

- **Frontend:** `./frontend/src/`
  - `App.tsx` — the main app (logged-in experience), rendered at `/app`.
    A large monolith; **DO NOT refactor or edit it unless explicitly asked.**
  - `pages/` — Landing, Pricing, About, NotFound (marketing/public pages)
  - `layouts/` — PublicLayout, ProtectedLayout
  - `components/` — shared components, ProtectedRoute, SiteHeader/Footer,
    LoginScreen
  - `lib/` — supabase client, auth context (`useAuth`)
  - `routes.ts` — `ROUTES` constants; all nav uses these, no hardcoded paths
- **Backend:** `./backend/` — `main.py`, plus `database.py`, `models.py`, `auth.py`
- **Types:** `frontend/src/types.ts`

## Tech stack

- **Frontend:** React + TypeScript
- **Backend:** FastAPI + Python

## Styling

- Inline styles + CSS tokens for the app; scoped `arc-*` CSS files for
  marketing pages.
- Tailwind is present but used **ONLY** for structural / `sr-only` utilities —
  **NEVER for color.** Do not introduce Tailwind color classes.

## Auth / data

- Supabase (auth + Postgres + RLS).
- `react-router-dom` v6 for routing.
- Backend verifies Supabase JWTs via JWKS on `/api/projects` routes.

## How it works

The app calls the Claude API with SSE streaming to generate cloud architecture
solutions; Mermaid `architecture-beta` diagrams with a repair loop.

## Working agreement

Generation, streaming, and diagram repair all work — changes must not break
these, and must **not modify `App.tsx` unless explicitly requested.**

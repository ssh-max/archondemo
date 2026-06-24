import { supabase } from './supabase'

/* ──────────────────────────────────────────────────────────────────────────
   Archon — project persistence API client.

   Thin typed wrapper over the backend's /api/projects routes. Every request
   carries the current Supabase session's access_token as a Bearer token, which
   the backend verifies via JWKS (see backend/auth.py get_current_user).

   Same-origin convention: paths are relative ("/api/projects…"), matching the
   app's existing fetch calls (App.tsx uses `const API = ''`). No backend host
   is hardcoded here.

   NOTE: nothing imports this module yet — auto-save wiring is a later step.
   ────────────────────────────────────────────────────────────────────────── */

export type ProjectInputMode = 'describe' | 'form'

/** Payload for creating a project — mirrors backend ProjectCreate (models.py). */
export interface ProjectCreateInput {
  name: string
  input_mode: ProjectInputMode
  input_json: Record<string, unknown>
  solution_json?: Record<string, unknown> | null
  workspace_id: string
}

/** A project row as returned by the backend — mirrors ProjectOut (models.py). */
export interface Project {
  id: string
  workspace_id: string
  created_by?: string | null
  name: string
  input_mode?: ProjectInputMode | null
  input_json: Record<string, unknown>
  solution_json?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/**
 * Build the auth + content headers for an /api/projects request.
 *
 * Reads the current session from the Supabase client and attaches its
 * access_token as `Authorization: Bearer <token>`. Throws if there is no
 * active session — callers must not attempt to persist while logged out.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (error || !accessToken) {
    throw new Error('Not authenticated — sign in before saving projects.')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
}

/**
 * Issue an authenticated request to a same-origin /api path and parse the JSON
 * response. Throws a descriptive Error on any non-2xx status.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = { ...(await authHeaders()), ...(init.headers ?? {}) }
  const res = await fetch(path, { ...init, headers })

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.detail ? `: ${body.detail}` : ''
    } catch {
      /* response had no JSON body */
    }
    throw new Error(`Request to ${path} failed (${res.status})${detail}`)
  }

  return res.json() as Promise<T>
}

/** POST /api/projects — create a new project. */
export function createProject(input: ProjectCreateInput): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Partial-update payload — mirrors backend ProjectUpdate (models.py). */
export interface ProjectUpdateInput {
  name?: string
  input_json?: Record<string, unknown>
  solution_json?: Record<string, unknown> | null
}

/** PUT /api/projects/{id} — update an existing project (owner only). */
export function updateProject(
  projectId: string,
  input: ProjectUpdateInput,
): Promise<Project> {
  return request<Project>(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

/** GET /api/projects?workspace_id=… — list projects in a workspace. */
export function listProjects(workspaceId: string): Promise<Project[]> {
  const qs = new URLSearchParams({ workspace_id: workspaceId })
  return request<Project[]>(`/api/projects?${qs.toString()}`)
}

/** GET /api/projects/{id} — fetch a single project. */
export function getProject(projectId: string): Promise<Project> {
  return request<Project>(`/api/projects/${encodeURIComponent(projectId)}`)
}

/**
 * GET /api/me/workspace — resolve the authenticated user's workspace.
 *
 * The backend performs this lookup with the service key (workspace_members is
 * intentionally not exposed to the Supabase Data API), returning the user's
 * resolved workspace id and role.
 */
export function getMyWorkspace(): Promise<{ workspace_id: string; role: string }> {
  return request<{ workspace_id: string; role: string }>('/api/me/workspace')
}

/** DELETE /api/projects/{id} — delete a project. */
export function deleteProject(projectId: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(
    `/api/projects/${encodeURIComponent(projectId)}`,
    { method: 'DELETE' },
  )
}

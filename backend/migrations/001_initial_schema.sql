-- =============================================================================
-- 001_initial_schema.sql
-- Archon — initial schema migration
--
-- Run in the Supabase SQL editor or via supabase db push.
-- Requires: pgcrypto (gen_random_uuid) — enabled by default in Supabase.
-- auth.users is the Supabase-managed table; we reference it but do not own it.
-- =============================================================================


-- =============================================================================
-- 1. WORKSPACES
--    Top-level container. Every user gets one personal workspace on sign-up
--    (created by the trigger at the bottom of this file). Teams share a
--    workspace; billing and project isolation happen at this level.
-- =============================================================================

create table if not exists workspaces (
    id          uuid        primary key default gen_random_uuid(),
    name        text        not null,
    created_by  uuid        not null references auth.users(id) on delete set null,
    created_at  timestamptz not null default now()
);


-- =============================================================================
-- 2. WORKSPACE_MEMBERS
--    Join table that grants a user access to a workspace and assigns their role.
--    A user can belong to many workspaces; a workspace can have many members.
--    The unique constraint prevents duplicate memberships.
-- =============================================================================

create table if not exists workspace_members (
    id            uuid        primary key default gen_random_uuid(),
    workspace_id  uuid        not null references workspaces(id) on delete cascade,
    user_id       uuid        not null references auth.users(id) on delete cascade,
    role          text        not null default 'owner'
                                check (role in ('owner', 'admin', 'member')),
    created_at    timestamptz not null default now(),

    unique (workspace_id, user_id)
);


-- =============================================================================
-- 3. PROJECTS
--    One architecture generation = one project row.
--    input_json stores the raw form/advisor payload; solution_json stores the
--    Claude response. solution_json is nullable so a project can exist in a
--    "draft" state before generation completes.
--    updated_at is maintained by a trigger defined below.
-- =============================================================================

create table if not exists projects (
    id             uuid        primary key default gen_random_uuid(),
    workspace_id   uuid        not null references workspaces(id) on delete cascade,
    created_by     uuid        not null references auth.users(id) on delete set null,
    name           text        not null,
    input_mode     text        check (input_mode in ('describe', 'form')),
    input_json     jsonb       not null,
    solution_json  jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Trigger: keep updated_at current on every projects row update.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger projects_updated_at
    before update on projects
    for each row execute procedure set_updated_at();


-- =============================================================================
-- 4. INDEXES
--    projects(workspace_id)   — primary access pattern: "all projects in workspace"
--    projects(created_by)     — secondary: "projects created by this user"
--    workspace_members(user_id) — used heavily inside every RLS policy check
--                                 to resolve "which workspaces does this user belong to?"
-- =============================================================================

create index if not exists idx_projects_workspace_id
    on projects (workspace_id);

create index if not exists idx_projects_created_by
    on projects (created_by);

create index if not exists idx_workspace_members_user_id
    on workspace_members (user_id);


-- =============================================================================
-- 5. ROW LEVEL SECURITY
--
-- Design principle: the set of workspace_ids a user belongs to is the
-- single source of truth. All policies delegate to this membership check
-- rather than comparing auth.uid() against created_by, so that team members
-- gain access as soon as they are added — even to rows they did not create.
--
-- SECURITY DEFINER helpers are used instead of inline subqueries against
-- workspace_members. An inline subquery inside a workspace_members policy
-- would re-trigger that table's own SELECT policy, causing infinite recursion.
-- A SECURITY DEFINER function bypasses RLS on its internal read, breaking
-- the cycle. Both functions pin search_path to prevent search-path injection.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.0 RLS HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- Returns every workspace_id the current user is a member of (any role).
-- Used by all SELECT/INSERT/UPDATE/DELETE policies on workspaces and projects,
-- and by the workspace_members SELECT policy.
create or replace function get_my_workspace_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
    select workspace_id from workspace_members where user_id = auth.uid();
$$;

-- Returns workspace_ids where the current user holds 'owner' or 'admin' role.
-- Used by workspace_members INSERT/DELETE policies to gate membership changes.
-- A separate function avoids routing the role-check subquery back through the
-- workspace_members SELECT policy (which would add an extra RLS hop, and would
-- be fragile if the SELECT policy is tightened later).
create or replace function get_my_admin_workspace_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
    select workspace_id from workspace_members
    where  user_id = auth.uid()
      and  role in ('owner', 'admin');
$$;

-- ---------------------------------------------------------------------------
-- 5a. WORKSPACES RLS
-- ---------------------------------------------------------------------------

alter table workspaces enable row level security;

-- Any authenticated user may create a workspace (needed for the sign-up trigger
-- and for manually created team workspaces).
create policy "workspaces: authenticated users can insert"
    on workspaces for insert
    to authenticated
    with check (auth.uid() is not null);

-- A user may read a workspace only if they are a member.
create policy "workspaces: members can select"
    on workspaces for select
    to authenticated
    using (
        id in (select get_my_workspace_ids())
    );

-- Only members may update a workspace's name/metadata.
-- Ownership/admin enforcement (if needed) should be added at the app layer
-- or via a stricter policy that also checks role via get_my_admin_workspace_ids().
create policy "workspaces: members can update"
    on workspaces for update
    to authenticated
    using (
        id in (select get_my_workspace_ids())
    )
    with check (
        id in (select get_my_workspace_ids())
    );

-- Only members may delete a workspace.
-- In practice you likely want to restrict this to 'owner' role — replace
-- get_my_workspace_ids() with get_my_admin_workspace_ids() when ready.
create policy "workspaces: members can delete"
    on workspaces for delete
    to authenticated
    using (
        id in (select get_my_workspace_ids())
    );


-- ---------------------------------------------------------------------------
-- 5b. WORKSPACE_MEMBERS RLS
-- ---------------------------------------------------------------------------

alter table workspace_members enable row level security;

-- A user can see their own membership rows, plus all membership rows for any
-- workspace they already belong to (so they can list teammates).
-- The first branch (user_id = auth.uid()) handles the own-row case directly
-- without a function call. The second branch uses the SECURITY DEFINER helper
-- to avoid re-triggering this policy recursively.
create policy "workspace_members: members can select"
    on workspace_members for select
    to authenticated
    using (
        user_id = auth.uid()
        or workspace_id in (select get_my_workspace_ids())
    );

-- Only existing owners or admins of a workspace may add new members.
-- Uses get_my_admin_workspace_ids() (SECURITY DEFINER) so the role check
-- never routes back through this table's own SELECT policy.
create policy "workspace_members: owners and admins can insert"
    on workspace_members for insert
    to authenticated
    with check (
        workspace_id in (select get_my_admin_workspace_ids())
    );

-- Only owners/admins can remove members from their workspace.
create policy "workspace_members: owners and admins can delete"
    on workspace_members for delete
    to authenticated
    using (
        workspace_id in (select get_my_admin_workspace_ids())
    );


-- ---------------------------------------------------------------------------
-- 5c. PROJECTS RLS
-- ---------------------------------------------------------------------------

alter table projects enable row level security;

-- Full CRUD for any workspace member. This policy is intentionally broad:
-- all members of a workspace collaborate on the same projects. If per-project
-- visibility is needed later, add a visibility column and refine these policies.

create policy "projects: workspace members can select"
    on projects for select
    to authenticated
    using (
        workspace_id in (select get_my_workspace_ids())
    );

create policy "projects: workspace members can insert"
    on projects for insert
    to authenticated
    with check (
        workspace_id in (select get_my_workspace_ids())
    );

create policy "projects: workspace members can update"
    on projects for update
    to authenticated
    using (
        workspace_id in (select get_my_workspace_ids())
    )
    with check (
        workspace_id in (select get_my_workspace_ids())
    );

create policy "projects: workspace members can delete"
    on projects for delete
    to authenticated
    using (
        workspace_id in (select get_my_workspace_ids())
    );


-- =============================================================================
-- 6. AUTO-CREATE PERSONAL WORKSPACE ON SIGN-UP
--
-- APPROACH CHOSEN: Supabase auth.users trigger (not a Supabase Dashboard hook).
--
-- Why a trigger rather than a Dashboard "Auth Hook"?
--   - Auth Hooks (added in Supabase 2024) fire as HTTP webhooks BEFORE the user
--     row is committed, and are designed for mutating the JWT/session — not for
--     creating application data.
--   - A AFTER INSERT trigger on auth.users fires inside the same transaction
--     that created the user, so the workspace + membership rows are guaranteed
--     to exist by the time any API call can be made. No race window.
--   - The trigger lives in the database alongside the schema, so it is
--     version-controlled and deployed with this migration.
--
-- LIMITATION: Supabase does not allow triggers on auth.users from the SQL
-- editor by default. You must run this as a Supabase superuser (available in
-- the project's Database → SQL Editor with service-role access), or include it
-- in a supabase/migrations file that runs via the CLI.
--
-- TO APPLY: paste the block below into the SQL Editor while connected as the
-- postgres / service-role user, or add it to your supabase/migrations folder.
-- =============================================================================

create or replace function create_personal_workspace_for_new_user()
returns trigger language plpgsql security definer as $$
declare
    new_workspace_id uuid;
    display_name     text;
begin
    -- Derive a friendly workspace name from email or raw_user_meta_data.
    display_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1),
        'My Workspace'
    );

    -- Create the personal workspace.
    insert into public.workspaces (name, created_by)
    values (display_name || '''s workspace', new.id)
    returning id into new_workspace_id;

    -- Grant the new user owner membership.
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, new.id, 'owner');

    return new;
end;
$$;

-- This trigger fires once, after each new row is committed to auth.users.
-- Drop-and-recreate pattern is safe for repeated migration runs.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure create_personal_workspace_for_new_user();

"""
Supabase client provider for the Archon backend.

This module exposes a single, lazily-initialised Supabase client built with the
SERVICE key. The service key BYPASSES Row Level Security (RLS) entirely, so the
database-level workspace isolation policies do NOT apply to queries made through
this client. Route handlers are therefore solely responsible for scoping every
query to the authenticated user's workspace (e.g. filtering by workspace_id).
Never expose the service key to the frontend.

Initialisation is lazy: the client is created on the first call to
get_supabase(), not at import time. This means importing this module (and, in
turn, importing it from main.py) does not require SUPABASE_URL or
SUPABASE_SERVICE_KEY to be set — the app can still boot and serve the existing
non-persistence routes without Supabase configured. The required environment
variables are only enforced the first time a route actually needs the database.
"""

import os
from supabase import Client, create_client

_client: Client | None = None


def get_supabase() -> Client:
    """
    Return a process-wide singleton Supabase client built with the service key.

    The client is created on first use and cached for subsequent calls. If
    either SUPABASE_URL or SUPABASE_SERVICE_KEY is missing, a RuntimeError is
    raised naming exactly which variable is absent, rather than failing silently.
    """
    global _client
    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL", "")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not url:
        raise RuntimeError(
            "SUPABASE_URL environment variable is not set — required for "
            "Supabase persistence."
        )
    if not service_key:
        raise RuntimeError(
            "SUPABASE_SERVICE_KEY environment variable is not set — required "
            "for Supabase persistence."
        )

    _client = create_client(url, service_key)
    return _client

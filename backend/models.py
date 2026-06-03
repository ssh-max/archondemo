"""
Pydantic v2 models for the Supabase persistence layer.

These mirror the `projects` table defined in migrations/001_initial_schema.sql.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    """Payload for creating a project row."""

    name: str = Field(min_length=1, max_length=200)
    input_mode: Literal["describe", "form"]
    input_json: dict
    solution_json: Optional[dict] = None
    workspace_id: UUID
    # AUTH: replace explicit created_by with authenticated user from middleware
    # in Step 3. The projects.created_by column is NOT NULL, so it is required
    # explicitly until auth middleware can supply it.
    created_by: UUID


class ProjectOut(BaseModel):
    """A project row as returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_by: Optional[UUID] = None
    name: str
    input_mode: Optional[Literal["describe", "form"]] = None
    input_json: dict
    solution_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

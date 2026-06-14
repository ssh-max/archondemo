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
    # TODO: validate workspace_id belongs to the authenticated user once
    # membership lookup is added.


class ProjectUpdate(BaseModel):
    """Partial-update payload for a project.

    All fields optional so a partial update works — only fields actually sent
    are written (handler uses model_dump(exclude_unset=True)). workspace_id and
    created_by are intentionally NOT updatable via this route.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    input_json: Optional[dict] = None
    solution_json: Optional[dict] = None


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

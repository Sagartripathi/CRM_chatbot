"""
Meeting-related Pydantic models.
Contains meeting data structures and scheduling schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from .enums import MeetingStatus


class Meeting(BaseModel):
    """
    Meeting model representing a scheduled meeting.
    Contains meeting details and scheduling information.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    organizer_id: str  # User ID
    title: Optional[str] = None
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    status: MeetingStatus = MeetingStatus.PROPOSED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class MeetingCreate(BaseModel):
    """
    Meeting creation schema.
    Used for creating new meetings.
    """
    lead_id: str
    title: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None


class MeetingProposal(BaseModel):
    """
    Meeting proposal schema.
    Used for proposing meeting times.
    """
    lead_id: str
    requested_time: datetime
    duration_minutes: int = 60
    title: Optional[str] = None
    notes: Optional[str] = None

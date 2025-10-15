"""
Support ticket-related Pydantic models.
Contains ticket data structures and update schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from .enums import TicketStatus, TicketPriority


class SupportTicket(BaseModel):
    """
    Support ticket model representing a customer support request.
    Contains ticket information and status tracking.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    created_by: str  # User ID
    assigned_to: Optional[str] = None  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class TicketCreate(BaseModel):
    """
    Ticket creation schema.
    Used for creating new support tickets.
    """
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class TicketUpdate(BaseModel):
    """
    Ticket update schema.
    Used for updating existing tickets.
    """
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        """Pydantic configuration."""
        use_enum_values = True

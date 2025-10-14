"""
Lead-related Pydantic models.
Contains lead data structures and campaign lead schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from .enums import LeadStatus, CampaignLeadStatus, CallOutcome


class Lead(BaseModel):
    """
    Lead model representing a potential customer.
    Contains contact information and lead status.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None  # User ID
    campaign_id: Optional[str] = None  # Campaign ID
    campaign_history: List[dict] = Field(default_factory=list)  # Track campaign changes
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class LeadCreate(BaseModel):
    """
    Lead creation schema.
    Used for creating new leads.
    """
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None
    campaign_id: Optional[str] = None

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class CampaignLead(BaseModel):
    """
    Campaign lead relationship model.
    Tracks lead progress within a campaign.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    lead_id: str
    attempts_made: int = 0
    max_attempts: int = 3
    last_attempt_at: Optional[datetime] = None
    next_attempt_at: Optional[datetime] = None
    status: CampaignLeadStatus = CampaignLeadStatus.PENDING
    last_call_outcome: Optional[CallOutcome] = None
    notes: Optional[str] = None
    assigned_agent: Optional[str] = None  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class NextLeadResponse(BaseModel):
    """
    Response model for getting next lead in campaign.
    Contains campaign lead and lead information.
    """
    campaign_lead: CampaignLead
    lead: Lead
    message: str

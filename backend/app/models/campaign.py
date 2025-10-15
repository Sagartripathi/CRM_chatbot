"""
Campaign-related Pydantic models.
Contains campaign data structures and call logging schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from .enums import CallOutcome


class Campaign(BaseModel):
    """
    Campaign model representing a calling campaign.
    Contains campaign information and statistics.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_by: str  # User ID
    
    # Campaign identifiers
    campaign_id: Optional[str] = None
    client_id: Optional[str] = None
    agent_id_vb: Optional[str] = None
    
    # Scheduling & Attempts
    main_sequence_attempts: Optional[int] = None
    follow_up_delay_days_pc: Optional[int] = None
    follow_up_max_attempts_pc: Optional[int] = None
    
    # Config Parameters
    holiday_calendar_pc: Optional[str] = None
    weekend_adjustment_pc: bool = False
    timezone_shared: Optional[str] = None
    
    # Operational
    is_active: bool = True
    start_call: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_leads: int = 0
    completed_leads: int = 0


class CampaignCreate(BaseModel):
    """
    Campaign creation schema.
    Used for creating new campaigns with leads.
    """
    name: str
    description: Optional[str] = None
    lead_ids: List[str] = []
    
    # Campaign identifiers
    campaign_id: Optional[str] = None
    client_id: Optional[str] = None
    agent_id_vb: Optional[str] = None
    
    # Scheduling & Attempts
    main_sequence_attempts: Optional[int] = None
    follow_up_delay_days_pc: Optional[int] = None
    follow_up_max_attempts_pc: Optional[int] = None
    
    # Config Parameters
    holiday_calendar_pc: Optional[str] = None
    weekend_adjustment_pc: bool = False
    timezone_shared: Optional[str] = None
    
    # Operational
    is_active: bool = True
    start_call: Optional[str] = None





class CallLog(BaseModel):
    """
    Call log model for tracking call attempts.
    Records call outcomes and details.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_lead_id: str
    agent_id: str  # User ID
    outcome: CallOutcome
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    call_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class CallLogCreate(BaseModel):
    """
    Call log creation schema.
    Used for logging call attempts.
    """
    campaign_lead_id: str
    outcome: CallOutcome
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        """Pydantic configuration."""
        use_enum_values = True

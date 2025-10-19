"""
Campaign-related Pydantic models.
Contains campaign data structures and call logging schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from .enums import CallOutcome
from app.utils.validators import (
    generate_campaign_id, 
    generate_client_id, 
    generate_agent_id
)


class Campaign(BaseModel):
    """
    Campaign model representing a calling campaign.
    Focus: ORGANIZATION lead type only.
    Contains campaign information and statistics.
    """
    # System ID (internal use)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Campaign Info (Mandatory)
    campaign_id: str = Field(default_factory=generate_campaign_id)
    campaign_name: str
    campaign_description: str  # Mandatory
    client_id: str = Field(default_factory=generate_client_id)
    agent_id: str = Field(default_factory=generate_agent_id)
    
    # Legacy field for backward compatibility
    created_by: str  # User ID
    
    # Legacy fields (deprecated, kept for backward compatibility)
    name: Optional[str] = None  # Use campaign_name instead
    description: Optional[str] = None  # Use campaign_description instead
    agent_id_vb: Optional[str] = None  # Use agent_id instead
    
    # Scheduling & Attempts
    main_sequence_attempts: Optional[int] = None
    follow_up_delay_days_pc: Optional[int] = None
    follow_up_max_attempts_pc: Optional[int] = None
    
    # Config Parameters
    holiday_calendar_pc: Optional[str] = None
    weekend_adjustment_pc: bool = False
    timezone_shared: Optional[str] = None
    
    # Operational (Mandatory)
    is_active: bool = True
    start_call: Optional[str] = None  # API trigger - will be implemented later
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Statistics
    total_leads: int = 0
    completed_leads: int = 0


class CampaignCreate(BaseModel):
    """
    Campaign creation schema.
    Used for creating new campaigns with ORGANIZATION leads.
    """
    # Campaign Info (Mandatory)
    campaign_name: str = Field(..., min_length=1, description="Campaign name (mandatory)")
    campaign_description: str = Field(..., min_length=1, description="Campaign description (mandatory)")
    
    # Auto-generated fields (optional override for testing)
    campaign_id: Optional[str] = Field(default_factory=generate_campaign_id)
    client_id: Optional[str] = Field(default_factory=generate_client_id)
    agent_id: Optional[str] = Field(default_factory=generate_agent_id)
    
    # Leads to add to campaign
    lead_ids: List[str] = []
    
    # Legacy fields (deprecated, kept for backward compatibility)
    name: Optional[str] = None  # Use campaign_name instead
    description: Optional[str] = None  # Use campaign_description instead
    agent_id_vb: Optional[str] = None  # Use agent_id instead
    
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
    start_call: Optional[str] = None  # Will be implemented later


class CampaignUpdate(BaseModel):
    """
    Campaign update schema.
    All fields optional for partial updates.
    """
    campaign_name: Optional[str] = None
    campaign_description: Optional[str] = None
    agent_id: Optional[str] = None  # Can be reassigned
    is_active: Optional[bool] = None
    start_call: Optional[str] = None
    main_sequence_attempts: Optional[int] = None
    follow_up_delay_days_pc: Optional[int] = None
    follow_up_max_attempts_pc: Optional[int] = None
    holiday_calendar_pc: Optional[str] = None
    weekend_adjustment_pc: Optional[bool] = None
    timezone_shared: Optional[str] = None
    
    # Legacy fields
    name: Optional[str] = None
    description: Optional[str] = None





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

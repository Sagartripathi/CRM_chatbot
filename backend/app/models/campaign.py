"""
Campaign-related Pydantic models.
Contains campaign data structures and call logging schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, validator
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
    client_id: str = Field(..., description="Client ID - must be one of: CLI-00001, CLI-00002, CLI-00003")
    agent_id: str = Field(..., description="Agent ID - must be one of: AGE-00001, AGE-00002, AGE-00003")
    
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
    is_active: bool = False  # Default to Inactive as per requirements
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
    
    # Auto-generated fields
    campaign_id: Optional[str] = Field(default_factory=generate_campaign_id)
    
    # Mandatory fields with validation
    client_id: str = Field(..., description="Client ID - must be one of: CLI-00001, CLI-00002, CLI-00003")
    agent_id: str = Field(..., description="Agent ID - must be one of: AGE-00001, AGE-00002, AGE-00003")
    
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
    is_active: bool = False  # Default to Inactive as per requirements
    start_call: Optional[str] = None  # Will be implemented later
    
    @validator('client_id')
    def validate_client_id(cls, v):
        """Validate client_id is one of the allowed values."""
        allowed_clients = ['CLI-00001', 'CLI-00002', 'CLI-00003']
        if v not in allowed_clients:
            raise ValueError(f'client_id must be one of: {", ".join(allowed_clients)}')
        return v
    
    @validator('agent_id')
    def validate_agent_id(cls, v):
        """Validate agent_id is one of the allowed values."""
        allowed_agents = ['AGE-00001', 'AGE-00002', 'AGE-00003']
        if v not in allowed_agents:
            raise ValueError(f'agent_id must be one of: {", ".join(allowed_agents)}')
        return v
    
    @validator('timezone_shared')
    def validate_timezone(cls, v):
        """Validate timezone is a valid US/Canada timezone."""
        if v is None:
            return v
        
        # Common US and Canada timezones
        valid_timezones = [
            'America/New_York',      # Eastern
            'America/Chicago',       # Central
            'America/Denver',        # Mountain
            'America/Los_Angeles',   # Pacific
            'America/Anchorage',     # Alaska
            'Pacific/Honolulu',      # Hawaii
            'America/Toronto',       # Eastern Canada
            'America/Winnipeg',      # Central Canada
            'America/Edmonton',      # Mountain Canada
            'America/Vancouver'      # Pacific Canada
        ]
        
        if v not in valid_timezones:
            raise ValueError(f'timezone_shared must be one of: {", ".join(valid_timezones)}')
        return v


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

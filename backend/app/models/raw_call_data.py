"""
Raw Call Data model for storing Twilio call records.
Stores complete call data including original payload.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class RawCallData(BaseModel):
    """
    Raw call data model for storing Twilio call records.
    Stores all call metadata and the original JSON payload.
    """
    # System ID
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Twilio IDs
    sid: str = Field(..., description="Twilio call SID")
    phone_number_sid: str = Field(..., description="Twilio phone number SID")
    account_sid: str = Field(..., description="Twilio account SID")
    
    # Call Metadata
    source_trigger: str
    direction: str
    duration: str
    start_time: str  # Store as string from Twilio format
    end_time: str    # Store as string from Twilio format
    queue_time: str
    
    # Technical Details
    content_lenght: str  # Note: Keeping typo from your data structure
    conn_ip: str
    origin: Optional[str] = None
    execution_mode: str
    status: str
    
    # CRM Relationships
    batch_id: str
    campaign_id: str
    campaign_history: str  # Stored as string
    lead_id: str
    lead_type: str
    
    # Call Numbers
    called_from: str
    called_to: str
    
    # Lead Information
    record_summary_shared: Optional[str] = None
    leads_notes: Optional[str] = None
    meeting_booked_shared: Optional[str] = None
    demo_booking_shared: Optional[str] = None
    
    # Timestamps
    date_created: str  # Store as string from Twilio format
    date_updated: str  # Store as string from Twilio format
    
    # Original Payload - Stores complete JSON from Twilio/n8n
    raw_CD_original: Dict[str, Any] = Field(..., description="Complete original JSON payload")
    
    # System timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class RawCallDataCreate(BaseModel):
    """
    Schema for creating raw call data records.
    All fields from the incoming webhook/API call.
    """
    # Twilio IDs
    sid: str
    phone_number_sid: str
    account_sid: str
    
    # Call Metadata
    source_trigger: str
    direction: str
    duration: str
    start_time: str
    end_time: str
    queue_time: str
    
    # Technical Details
    content_lenght: str
    conn_ip: str
    origin: Optional[str] = None
    execution_mode: str
    status: str
    
    # CRM Relationships
    batch_id: str
    campaign_id: str
    campaign_history: str
    lead_id: str
    lead_type: str
    
    # Call Numbers
    called_from: str
    called_to: str
    
    # Lead Information
    record_summary_shared: Optional[str] = None
    leads_notes: Optional[str] = None
    meeting_booked_shared: Optional[str] = None
    demo_booking_shared: Optional[str] = None
    
    # Timestamps
    date_created: str
    date_updated: str
    
    # Original Payload
    raw_CD_original: Dict[str, Any]
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


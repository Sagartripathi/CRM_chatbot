# """
# Lead-related Pydantic models.
# Contains lead data structures and campaign lead schemas.
# """

# import uuid
# from datetime import datetime, timezone
# from typing import List, Optional
# from pydantic import BaseModel, Field, EmailStr
# from .enums import LeadStatus, CampaignLeadStatus, CallOutcome


# class Lead(BaseModel):
#     """
#     Lead model representing a potential customer.
#     Contains contact information and lead status.
#     """
#     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
#     first_name: str
#     last_name: str
#     phone: Optional[str] = None
#     email: Optional[EmailStr] = None
#     source: Optional[str] = None
#     notes: Optional[str] = None
#     status: LeadStatus = LeadStatus.NEW
#     assigned_to: Optional[str] = None  # User ID
#     campaign_id: Optional[str] = None  # Campaign ID
#     campaign_history: List[dict] = Field(default_factory=list)  # Track campaign changes
#     created_by: str  # User ID
#     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
#     updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

#     class Config:
#         """Pydantic configuration."""
#         use_enum_values = True


# class LeadCreate(BaseModel):
#     """
#     Lead creation schema.
#     Used for creating new leads.
#     """
#     first_name: str
#     last_name: str
#     phone: Optional[str] = None
#     email: Optional[EmailStr] = None
#     source: Optional[str] = None
#     notes: Optional[str] = None
#     status: LeadStatus = LeadStatus.NEW
#     assigned_to: Optional[str] = None
#     campaign_id: Optional[str] = None

#     class Config:
#         """Pydantic configuration."""
#         use_enum_values = True


# class CampaignLead(BaseModel):
#     """
#     Campaign lead relationship model.
#     Tracks lead progress within a campaign.
#     """
#     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
#     campaign_id: str
#     lead_id: str
#     attempts_made: int = 0
#     max_attempts: int = 3
#     last_attempt_at: Optional[datetime] = None
#     next_attempt_at: Optional[datetime] = None
#     status: CampaignLeadStatus = CampaignLeadStatus.PENDING
#     last_call_outcome: Optional[CallOutcome] = None
#     notes: Optional[str] = None
#     assigned_agent: Optional[str] = None  # User ID
#     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

#     class Config:
#         """Pydantic configuration."""
#         use_enum_values = True


# class NextLeadResponse(BaseModel):
#     """
#     Response model for getting next lead in campaign.
#     Contains campaign lead and lead information.
#     """
#     campaign_lead: CampaignLead
#     lead: Lead
#     message: str
"""
Lead-related Pydantic models.
Contains lead data structures and campaign lead schemas.
"""

import uuid
from datetime import datetime, timezone, date, time
from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator

from .enums import LeadStatus, CampaignLeadStatus, CallOutcome
from app.utils.validators import validate_us_phone


class DemoBooking(BaseModel):
    """Demo booking information."""
    booking_name_shared: Optional[str] = None
    booking_phone_shared: Optional[str] = None
    booking_email_shared: Optional[str] = None
    booking_date_shared: Optional[date] = None
    booking_time_shared: Optional[time] = None
    calendar_event_id_shared: Optional[str] = None


class Lead(BaseModel):
    """
    Lead model representing a potential customer.
    Contains contact information and lead status.
    """
    # Core Identifiers & Relationships
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str = Field(default_factory=lambda: f"L-{uuid.uuid4().hex[:7].upper()}")  # Auto-generated lead ID
    lead_type: str = Field(..., description="Lead type: individual or organization")
    
    # Campaign Information (Mandatory)
    campaign_name: str = Field(..., description="Campaign name - mandatory")
    campaign_id: str = Field(..., description="Campaign ID - fetched from database")
    
    # Individual Lead Fields (conditionally required)
    lead_first_name: Optional[str] = Field(None, description="First Name - required if lead_type is individual")
    lead_last_name: Optional[str] = Field(None, description="Last Name - required if lead_type is individual")
    lead_phone: Optional[str] = Field(None, description="Lead's Contact # - required if lead_type is individual")
    leads_notes: Optional[str] = Field(None, description="Lead's Insight - required if lead_type is individual")
    lead_email: Optional[str] = Field(None, description="Lead's Email - optional for individual")
    
    # Organization Lead Fields (conditionally required)
    business_name: Optional[str] = Field(None, description="Business name - required if lead_type is organization")
    business_phone: Optional[str] = Field(None, description="Business phone - required if lead_type is organization")
    business_address: Optional[str] = Field(None, description="Business address - required if lead_type is organization")
    business_summary: Optional[str] = Field(None, max_length=240, description="Lead's Business Insight - optional for organization, max 240 chars")
    
    # Legacy fields (kept for backward compatibility)
    batch_id: str = ""
    updated_at_shared: str = ""

    is_valid: bool = True

    source: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[LeadStatus] = None  # Allow null status
    assigned_to: Optional[str] = None  # User ID
    campaign_history: List[dict] = Field(default_factory=list)  # Track campaign changes
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Personalization (Voice Bot updates)
    first_contact_name_vb: Optional[str] = None
    
    # Decision maker
    decision_maker_identified_shared: Optional[bool] = None
    
    # Contact Info (Voice Bot captures)
    referral_name_vb: Optional[str] = None
    referral_phone_vb: Optional[str] = None
    referral_email_vb: Optional[str] = None
    referral_role_vb: Optional[str] = None
    next_attempt_at_vb: Optional[datetime] = None
    
    # Status & Stages (Voice Bot records)
    call_status_vb: Optional[str] = None
    call_duration_vb: Optional[int] = None
    conversation_summary_vb: Optional[str] = None
    record_summary_shared: Optional[str] = None
    
    # Follow-up System (Post-Call/Voice Bot)
    follow_up_count_pc: Optional[bool] = None
    follow_up_next_attempt_at_vb: Optional[datetime] = None
    undetermined_flag_pc: Optional[bool] = None
    
    # Meeting & Booking (Shared between systems)
    meeting_booked_shared: Optional[bool] = None
    demo_booking_shared: Optional[DemoBooking] = None
    
    # System Audit (CRM/System-managed)
    updated_by_shared: Optional[str] = None
    is_processed_shared: Optional[bool] = None  # Processing status flag
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Normalize status to lowercase to handle case-insensitive database values."""
        # Allow null/None values
        if v is None:
            return None
        if isinstance(v, str):
            return v.lower()
        return v

    @model_validator(mode='after')
    def populate_legacy_fields(self):
        """Populate legacy fields from new fields for backward compatibility."""
        if not self.notes and self.leads_notes:
            self.notes = self.leads_notes
        return self


    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class LeadCreate(BaseModel):
    """
    Lead creation schema.
    Used for creating new leads.
    """
    # Mandatory fields
    lead_type: str = Field(..., description="Lead type: individual or organization")
    campaign_name: str = Field(..., description="Campaign name - mandatory")
    campaign_id: str = Field(..., description="Campaign ID - fetched from database")
    
    # Individual Lead Fields (conditionally required)
    lead_first_name: Optional[str] = Field(None, description="First Name - required if lead_type is individual")
    lead_last_name: Optional[str] = Field(None, description="Last Name - required if lead_type is individual")
    lead_phone: Optional[str] = Field(None, description="Lead's Contact # - required if lead_type is individual")
    leads_notes: Optional[str] = Field(None, description="Lead's Insight - required if lead_type is individual")
    lead_email: Optional[str] = Field(None, description="Lead's Email - optional for individual")
    
    # Organization Lead Fields (conditionally required)
    business_name: Optional[str] = Field(None, description="Business name - required if lead_type is organization")
    business_phone: Optional[str] = Field(None, description="Business phone - required if lead_type is organization")
    business_address: Optional[str] = Field(None, description="Business address - required if lead_type is organization")
    business_summary: Optional[str] = Field(None, max_length=240, description="Lead's Business Insight - optional for organization, max 240 chars")
    
    # Internal fields
    batch_id: str = ""
    updated_at_shared: str = ""

    is_valid: bool = True

    
    # Legacy fields (for backward compatibility)
    source: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None
    
    # Voice Bot fields
    decision_maker_identified_shared: Optional[bool] = None
    first_contact_name_vb: Optional[str] = None
    referral_name_vb: Optional[str] = None
    referral_phone_vb: Optional[str] = None
    referral_email_vb: Optional[str] = None
    referral_role_vb: Optional[str] = None
    call_status_vb: Optional[str] = None
    call_duration_vb: Optional[int] = None
    conversation_summary_vb: Optional[str] = None
    record_summary_shared: Optional[str] = None
    follow_up_count_pc: Optional[bool] = None
    undetermined_flag_pc: Optional[bool] = None
    meeting_booked_shared: Optional[bool] = None
    demo_booking_shared: Optional[DemoBooking] = None
    updated_by_shared: Optional[str] = None
    is_processed_shared: Optional[bool] = None  # Processing status flag
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Normalize status to lowercase to handle case-insensitive database values."""
        # Allow null/None values
        if v is None:
            return None
        if isinstance(v, str):
            return v.lower()
        return v
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True


# Keep existing CampaignLead and NextLeadResponse models unchanged
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
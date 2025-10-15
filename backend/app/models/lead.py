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
from pydantic import BaseModel, Field, EmailStr
from .enums import LeadStatus, CampaignLeadStatus, CallOutcome


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
    
    # Business Context (CRM-managed)
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_summary_vb: Optional[str] = None
    leads_notes: Optional[str] = None
    
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
    
    # Follow-up System (Post-Call/Voice Bot)
    follow_up_count_pc: Optional[bool] = None
    follow_up_next_attempt_at_vb: Optional[datetime] = None
    undetermined_flag_pc: Optional[bool] = None
    
    # Meeting & Booking (Shared between systems)
    meeting_booked_shared: Optional[bool] = None
    demo_booking_shared: Optional[DemoBooking] = None
    
    # System Audit (CRM/System-managed)
    updated_by_shared: Optional[str] = None

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
    
    # NEW: Optional fields for creation
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_summary_vb: Optional[str] = None
    leads_notes: Optional[str] = None
    decision_maker_identified_shared: Optional[bool] = None
    first_contact_name_vb: Optional[str] = None
    referral_name_vb: Optional[str] = None
    referral_phone_vb: Optional[str] = None
    referral_email_vb: Optional[str] = None
    referral_role_vb: Optional[str] = None
    call_status_vb: Optional[str] = None
    call_duration_vb: Optional[int] = None
    conversation_summary_vb: Optional[str] = None
    follow_up_count_pc: Optional[bool] = None
    undetermined_flag_pc: Optional[bool] = None
    meeting_booked_shared: Optional[bool] = None
    demo_booking_shared: Optional[DemoBooking] = None
    updated_by_shared: Optional[str] = None

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
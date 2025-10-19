"""
Pydantic models for the CRM application.
Contains all data models and schemas.
"""

from .user import User, UserCreate, UserLogin, Token
from .lead import Lead, LeadCreate, NextLeadResponse, CampaignLead
from .campaign import Campaign, CampaignCreate, CampaignUpdate, CallLog, CallLogCreate
from .meeting import Meeting, MeetingCreate, MeetingProposal
from .ticket import SupportTicket, TicketCreate, TicketUpdate
from .enums import (
    UserRole, LeadStatus, CallOutcome, CampaignLeadStatus,
    MeetingStatus, TicketStatus, TicketPriority
)

__all__ = [
    # User models
    "User", "UserCreate", "UserLogin", "Token",
    # Lead models
    "Lead", "LeadCreate", "NextLeadResponse", "CampaignLead",
    # Campaign models
    "Campaign", "CampaignCreate", "CampaignUpdate", "CallLog", "CallLogCreate",
    # Meeting models
    "Meeting", "MeetingCreate", "MeetingProposal",
    # Ticket models
    "SupportTicket", "TicketCreate", "TicketUpdate",
    # Enums
    "UserRole", "LeadStatus", "CallOutcome", "CampaignLeadStatus",
    "MeetingStatus", "TicketStatus", "TicketPriority"
]

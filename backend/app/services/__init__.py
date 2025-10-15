"""
Service layer for the CRM application.
Contains business logic and service classes.
"""

from .auth_service import AuthService
from .lead_service import LeadService
from .campaign_service import CampaignService
from .meeting_service import MeetingService
from .ticket_service import TicketService

__all__ = [
    "AuthService",
    "LeadService",
    "CampaignService", 
    "MeetingService",
    "TicketService"
]

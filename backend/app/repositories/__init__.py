"""
Repository layer for the CRM application.
Contains data access objects for database operations.
"""

from .user_repository import UserRepository
from .lead_repository import LeadRepository
from .campaign_repository import CampaignRepository
from .meeting_repository import MeetingRepository
from .ticket_repository import TicketRepository

__all__ = [
    "UserRepository",
    "LeadRepository", 
    "CampaignRepository",
    "MeetingRepository",
    "TicketRepository"
]

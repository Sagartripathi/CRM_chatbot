"""
Enumeration definitions for the CRM application.
Contains all status and role enums used throughout the system.
"""

from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    AGENT = "agent"
    CLIENT = "client"


class LeadStatus(str, Enum):
    """Lead status enumeration."""
    NEW = "new"
    READY = "ready"
    PENDING_PREVIEW = "pending_preview"
    PREVIEWED = "previewed"
    LOST = "lost"
    NO_RESPONSE = "no_response"
    BUSY = "busy"
    NO_ANSWER = "no_answer"
    COMPLETED = "completed"
    CONVERTED = "converted"


class CallOutcome(str, Enum):
    """Call outcome enumeration."""
    ANSWERED = "answered"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    VOICEMAIL = "voicemail"


class CampaignLeadStatus(str, Enum):
    """Campaign lead status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class MeetingStatus(str, Enum):
    """Meeting status enumeration."""
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"


class TicketStatus(str, Enum):
    """Support ticket status enumeration."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Support ticket priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

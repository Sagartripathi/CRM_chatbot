"""
API routers for the CRM application.
Contains all route handlers organized by feature.
"""

from .auth import router as auth_router
from .leads import router as leads_router
from .campaigns import router as campaigns_router
from .meetings import router as meetings_router
from .tickets import router as tickets_router

__all__ = [
    "auth_router",
    "leads_router",
    "campaigns_router", 
    "meetings_router",
    "tickets_router"
]

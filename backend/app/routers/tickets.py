"""
Support ticket management API routes.
Handles ticket CRUD operations and status management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends
from app.models import (
    SupportTicket, TicketCreate, TicketUpdate, User,
    TicketStatus, TicketPriority
)
from app.services import TicketService
from app.repositories import TicketRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/tickets", tags=["tickets"])


def get_ticket_service() -> TicketService:
    """
    Dependency to get ticket service.
    
    Returns:
        TicketService: Ticket service instance
    """
    ticket_repo = TicketRepository(db.database)
    return TicketService(ticket_repo)


@router.post("/", response_model=SupportTicket)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Create a new support ticket.
    
    Args:
        ticket_data: Ticket creation data
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        SupportTicket: The created ticket object
    """
    return await ticket_service.create_ticket(ticket_data, current_user)


@router.get("/", response_model=List[SupportTicket])
async def get_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Get tickets with optional filters.
    
    Args:
        status: Filter by ticket status
        priority: Filter by ticket priority
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        List[SupportTicket]: List of ticket objects
    """
    return await ticket_service.get_tickets(current_user, status, priority)


@router.get("/{ticket_id}", response_model=SupportTicket)
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Get ticket by ID.
    
    Args:
        ticket_id: Ticket's unique identifier
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        SupportTicket: Ticket object
        
    Raises:
        HTTPException: If ticket not found or access denied
    """
    return await ticket_service.get_ticket_by_id(ticket_id, current_user)


@router.put("/{ticket_id}", response_model=SupportTicket)
async def update_ticket(
    ticket_id: str,
    ticket_data: TicketUpdate,
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Update ticket information.
    
    Args:
        ticket_id: Ticket's unique identifier
        ticket_data: Updated ticket data
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        SupportTicket: Updated ticket object
        
    Raises:
        HTTPException: If ticket not found or access denied
    """
    return await ticket_service.update_ticket(ticket_id, ticket_data, current_user)


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Delete a ticket.
    
    Args:
        ticket_id: Ticket's unique identifier
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If ticket not found or access denied
    """
    return await ticket_service.delete_ticket(ticket_id, current_user)


@router.get("/stats/overview")
async def get_ticket_stats(
    current_user: User = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service)
):
    """
    Get ticket statistics.
    
    Args:
        current_user: Current authenticated user
        ticket_service: Ticket service dependency
        
    Returns:
        dict: Ticket statistics
        
    Raises:
        HTTPException: If user not authorized to view statistics
    """
    return await ticket_service.get_ticket_stats(current_user)

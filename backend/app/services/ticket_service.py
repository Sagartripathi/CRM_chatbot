"""
Ticket service for support ticket management.
Handles business logic for ticket operations.
"""

from typing import List, Optional
from fastapi import HTTPException, status
from app.models import (
    SupportTicket, TicketCreate, TicketUpdate, User, UserRole,
    TicketStatus, TicketPriority
)
from app.repositories import TicketRepository


class TicketService:
    """
    Service for support ticket management.
    Handles business logic for ticket operations.
    """
    
    def __init__(self, ticket_repository: TicketRepository):
        """
        Initialize ticket service.
        
        Args:
            ticket_repository: Ticket repository instance
        """
        self.ticket_repo = ticket_repository
    
    async def create_ticket(self, ticket_data: TicketCreate, current_user: User) -> SupportTicket:
        """
        Create a new support ticket.
        
        Args:
            ticket_data: Ticket creation data
            current_user: Current authenticated user
            
        Returns:
            SupportTicket: The created ticket object
        """
        return await self.ticket_repo.create_ticket(ticket_data, current_user.id)
    
    async def get_tickets(
        self,
        current_user: User,
        status: Optional[TicketStatus] = None,
        priority: Optional[TicketPriority] = None
    ) -> List[SupportTicket]:
        """
        Get tickets with role-based filtering.
        
        Args:
            current_user: Current authenticated user
            status: Filter by ticket status
            priority: Filter by ticket priority
            
        Returns:
            List[SupportTicket]: List of ticket objects
        """
        tickets = await self.ticket_repo.get_tickets_by_filters(
            status=status,
            priority=priority,
            user_role=current_user.role,
            user_id=current_user.id
        )
        
        return [SupportTicket(**ticket) for ticket in tickets]
    
    async def get_ticket_by_id(self, ticket_id: str, current_user: User) -> SupportTicket:
        """
        Get ticket by ID with permission check.
        
        Args:
            ticket_id: Ticket's unique identifier
            current_user: Current authenticated user
            
        Returns:
            SupportTicket: Ticket object
            
        Raises:
            HTTPException: If ticket not found or access denied
        """
        ticket = await self.ticket_repo.get_ticket_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Check permissions
        if current_user.role == UserRole.CLIENT and ticket["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
        
        return SupportTicket(**ticket)
    
    async def update_ticket(self, ticket_id: str, ticket_data: TicketUpdate, current_user: User) -> SupportTicket:
        """
        Update ticket information.
        
        Args:
            ticket_id: Ticket's unique identifier
            ticket_data: Updated ticket data
            current_user: Current authenticated user
            
        Returns:
            SupportTicket: Updated ticket object
            
        Raises:
            HTTPException: If ticket not found or access denied
        """
        existing_ticket = await self.ticket_repo.get_ticket_by_id(ticket_id)
        if not existing_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Check permissions
        if current_user.role == UserRole.CLIENT and existing_ticket["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
        
        updated_ticket = await self.ticket_repo.update_ticket(ticket_id, ticket_data)
        return SupportTicket(**updated_ticket)
    
    async def delete_ticket(self, ticket_id: str, current_user: User) -> dict:
        """
        Delete a ticket.
        
        Args:
            ticket_id: Ticket's unique identifier
            current_user: Current authenticated user
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If ticket not found or access denied
        """
        existing_ticket = await self.ticket_repo.get_ticket_by_id(ticket_id)
        if not existing_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Check permissions (only creator or admin can delete)
        if current_user.role != UserRole.ADMIN and existing_ticket["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")
        
        await self.ticket_repo.delete_ticket(ticket_id)
        return {"message": "Ticket deleted successfully"}
    
    async def get_ticket_stats(self, current_user: User) -> dict:
        """
        Get ticket statistics.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            dict: Ticket statistics
        """
        # Only admins can see global stats
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized to view ticket statistics")
        
        return await self.ticket_repo.get_ticket_stats()

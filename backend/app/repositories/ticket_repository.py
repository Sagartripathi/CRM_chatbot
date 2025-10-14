"""
Ticket repository for database operations.
Handles all support ticket-related database interactions.
"""

from typing import Optional, List
from datetime import datetime, timezone
from app.models import SupportTicket, TicketCreate, TicketUpdate, TicketStatus, TicketPriority
from app.utils import prepare_for_mongo


class TicketRepository:
    """
    Repository for support ticket database operations.
    Handles CRUD operations for support tickets.
    """
    
    def __init__(self, database):
        """
        Initialize ticket repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database.tickets
    
    async def create_ticket(self, ticket_data: TicketCreate, created_by: str) -> SupportTicket:
        """
        Create a new support ticket in the database.
        
        Args:
            ticket_data: Ticket creation data
            created_by: ID of the user creating the ticket
            
        Returns:
            SupportTicket: The created ticket object
        """
        ticket_dict = ticket_data.dict()
        ticket_dict["created_by"] = created_by
        
        ticket_obj = SupportTicket(**ticket_dict)
        ticket_dict = prepare_for_mongo(ticket_obj.dict())
        
        await self.db.insert_one(ticket_dict)
        return ticket_obj
    
    async def get_ticket_by_id(self, ticket_id: str) -> Optional[dict]:
        """
        Get ticket by ID.
        
        Args:
            ticket_id: Ticket's unique identifier
            
        Returns:
            Optional[dict]: Ticket document if found, None otherwise
        """
        return await self.db.find_one({"id": ticket_id})
    
    async def get_tickets_by_filters(
        self,
        status: Optional[TicketStatus] = None,
        priority: Optional[TicketPriority] = None,
        created_by: Optional[str] = None,
        assigned_to: Optional[str] = None,
        user_role: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[dict]:
        """
        Get tickets with optional filters based on user role.
        
        Args:
            status: Filter by ticket status
            priority: Filter by ticket priority
            created_by: Filter by ticket creator
            assigned_to: Filter by assigned user
            user_role: User's role for access control
            user_id: User's ID for access control
            
        Returns:
            List[dict]: List of ticket documents
        """
        query = {}
        
        # Role-based filtering
        if user_role == "client":
            query["created_by"] = user_id
        elif user_role == "agent":
            # Agents can see tickets assigned to them or unassigned tickets
            query["$or"] = [
                {"assigned_to": user_id},
                {"assigned_to": None}
            ]
        # Admin can see all tickets (no filter)
        
        # Additional filters
        if status:
            query["status"] = status.value
        if priority:
            query["priority"] = priority.value
        if created_by:
            query["created_by"] = created_by
        if assigned_to:
            query["assigned_to"] = assigned_to
        
        return await self.db.find(query).sort("created_at", -1).to_list(1000)
    
    async def update_ticket(self, ticket_id: str, update_data: TicketUpdate) -> Optional[dict]:
        """
        Update ticket information.
        
        Args:
            ticket_id: Ticket's unique identifier
            update_data: Dictionary containing fields to update
            
        Returns:
            Optional[dict]: Updated ticket document if found, None otherwise
        """
        # Prepare update data
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Handle status changes
        if update_data.status == TicketStatus.RESOLVED:
            # Check if status is changing to resolved
            existing_ticket = await self.get_ticket_by_id(ticket_id)
            if existing_ticket and existing_ticket.get("status") != TicketStatus.RESOLVED.value:
                update_dict["resolved_at"] = datetime.now(timezone.utc).isoformat()
        
        update_dict = prepare_for_mongo(update_dict)
        await self.db.update_one({"id": ticket_id}, {"$set": update_dict})
        
        return await self.get_ticket_by_id(ticket_id)
    
    async def delete_ticket(self, ticket_id: str) -> bool:
        """
        Delete a ticket from the database.
        
        Args:
            ticket_id: Ticket's unique identifier
            
        Returns:
            bool: True if ticket was deleted, False otherwise
        """
        result = await self.db.delete_one({"id": ticket_id})
        return result.deleted_count > 0
    
    async def get_ticket_stats(self) -> dict:
        """
        Get ticket statistics.
        
        Returns:
            dict: Ticket statistics
        """
        total_tickets = await self.db.count_documents({})
        open_tickets = await self.db.count_documents({"status": TicketStatus.OPEN.value})
        in_progress_tickets = await self.db.count_documents({"status": TicketStatus.IN_PROGRESS.value})
        resolved_tickets = await self.db.count_documents({"status": TicketStatus.RESOLVED.value})
        closed_tickets = await self.db.count_documents({"status": TicketStatus.CLOSED.value})
        
        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "in_progress_tickets": in_progress_tickets,
            "resolved_tickets": resolved_tickets,
            "closed_tickets": closed_tickets
        }

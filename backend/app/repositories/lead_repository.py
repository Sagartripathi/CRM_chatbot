"""
Lead repository for database operations.
Handles all lead-related database interactions.
"""

from typing import Optional, List
from app.models import Lead, LeadCreate, LeadStatus
from app.utils import prepare_for_mongo


class LeadRepository:
    """
    Repository for lead database operations.
    Handles CRUD operations for leads.
    """
    
    def __init__(self, database):
        """
        Initialize lead repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database.leads
    
    async def create_lead(self, lead_data: LeadCreate, created_by: str) -> Lead:
        """
        Create a new lead in the database.
        
        Args:
            lead_data: Lead creation data
            created_by: ID of the user creating the lead
            
        Returns:
            Lead: The created lead object
        """
        lead_dict = lead_data.dict()
        lead_dict["created_by"] = created_by
        lead_obj = Lead(**lead_dict)
        lead_dict = prepare_for_mongo(lead_obj.dict())
        
        await self.db.insert_one(lead_dict)
        return lead_obj
    
    async def get_lead_by_id(self, lead_id: str) -> Optional[dict]:
        """
        Get lead by ID.
        
        Args:
            lead_id: Lead's unique identifier
            
        Returns:
            Optional[dict]: Lead document if found, None otherwise
        """
        return await self.db.find_one({"id": lead_id})
    
    async def get_leads_by_filters(
        self, 
        status: Optional[LeadStatus] = None,
        source: Optional[str] = None,
        assigned_to: Optional[str] = None,
        created_by: Optional[str] = None,
        query_filter: Optional[dict] = None
    ) -> List[dict]:
        """
        Get leads with optional filters.
        
        Args:
            status: Filter by lead status
            source: Filter by lead source
            assigned_to: Filter by assigned user
            created_by: Filter by creator
            query_filter: Custom query filter
            
        Returns:
            List[dict]: List of lead documents
        """
        query = query_filter or {}
        
        # Only apply status filter if explicitly provided (not None/empty)
        # This ensures leads with null status are still returned
        # Normalize status to lowercase for case-insensitive matching
        if status is not None:
            status_str = str(status.value).lower() if hasattr(status, 'value') else str(status).lower()
            # Normalize common variations (spaces/dashes to underscores)
            status_normalized = status_str.replace(' ', '_').replace('-', '_')
            # Use case-insensitive regex for status matching (handles "No Answer", "no_answer", "NO_ANSWER", etc.)
            # Match status with any combination of spaces, dashes, or underscores
            query["status"] = {"$regex": f"^{status_normalized}$", "$options": "i"}
        if source:
            query["source"] = source
        if assigned_to:
            query["assigned_to"] = assigned_to
        if created_by:
            query["created_by"] = created_by
        
        return await self.db.find(query).sort("created_at", -1).to_list(1000)
    
    async def update_lead(self, lead_id: str, update_data: dict) -> Optional[dict]:
        """
        Update lead information.
        
        Args:
            lead_id: Lead's unique identifier
            update_data: Dictionary containing fields to update
            
        Returns:
            Optional[dict]: Updated lead document if found, None otherwise
        """
        update_data = prepare_for_mongo(update_data)
        await self.db.update_one({"id": lead_id}, {"$set": update_data})
        return await self.get_lead_by_id(lead_id)
    
    async def delete_lead(self, lead_id: str) -> bool:
        """
        Delete a lead from the database.
        
        Args:
            lead_id: Lead's unique identifier
            
        Returns:
            bool: True if lead was deleted, False otherwise
        """
        result = await self.db.delete_one({"id": lead_id})
        return result.deleted_count > 0
    
    async def check_duplicate_lead(self, email: Optional[str] = None, phone: Optional[str] = None) -> Optional[dict]:
        """
        Check for duplicate leads by email or phone.
        
        Args:
            email: Email address to check
            phone: Phone number to check
            
        Returns:
            Optional[dict]: Duplicate lead if found, None otherwise
        """
        duplicate_query = []
        if email:
            duplicate_query.append({"email": email})
        if phone:
            duplicate_query.append({"phone": phone})
        
        if duplicate_query:
            return await self.db.find_one({"$or": duplicate_query})
        return None
    
    async def update_lead_campaign(self, lead_id: str, campaign_id: Optional[str], changed_by: str) -> Optional[dict]:
        """
        Update lead's campaign assignment and track history.
        
        Args:
            lead_id: Lead's unique identifier
            campaign_id: New campaign ID (None to remove assignment)
            changed_by: ID of user making the change
            
        Returns:
            Optional[dict]: Updated lead document if found, None otherwise
        """
        # Get current lead
        lead = await self.get_lead_by_id(lead_id)
        if not lead:
            return None
        
        # Track campaign history
        old_campaign_id = lead.get("campaign_id")
        campaign_history = lead.get("campaign_history", [])
        
        if old_campaign_id != campaign_id:
            from datetime import datetime, timezone
            history_entry = {
                "from_campaign_id": old_campaign_id,
                "to_campaign_id": campaign_id,
                "changed_at": datetime.now(timezone.utc).isoformat(),
                "changed_by": changed_by
            }
            campaign_history.append(history_entry)
        
        # Update lead
        update_data = {
            "campaign_id": campaign_id,
            "campaign_history": campaign_history,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return await self.update_lead(lead_id, update_data)

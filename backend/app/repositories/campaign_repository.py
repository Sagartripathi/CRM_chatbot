"""
Campaign repository for database operations.
Handles all campaign-related database interactions.
"""

from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.models import Campaign, CampaignCreate, CampaignUpdate, CampaignLead, CallLog, CallLogCreate, CampaignLeadStatus
from app.utils import prepare_for_mongo
from app.config import settings


class CampaignRepository:
    """
    Repository for campaign database operations.
    Handles CRUD operations for campaigns and campaign leads.
    """
    
    def __init__(self, database):
        """
        Initialize campaign repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database
        self.campaigns = database.campaigns
        self.campaign_leads = database.campaign_leads
        self.call_logs = database.call_logs
        self.leads = database.leads
    
    async def create_campaign(self, campaign_data: CampaignCreate, created_by: str) -> Campaign:
        """
        Create a new campaign in the database.
        
        Args:
            campaign_data: Campaign creation data
            created_by: ID of the user creating the campaign
            
        Returns:
            Campaign: The created campaign object
        """
        campaign_dict = campaign_data.dict(exclude={"lead_ids"})
        campaign_dict["created_by"] = created_by
        campaign_dict["total_leads"] = len(campaign_data.lead_ids)
        campaign_obj = Campaign(**campaign_dict)
        campaign_dict = prepare_for_mongo(campaign_obj.dict())
        
        # Insert campaign
        await self.campaigns.insert_one(campaign_dict)
        
        # Create campaign-lead relationships
        for lead_id in campaign_data.lead_ids:
            # Verify lead exists
            lead = await self.db.leads.find_one({"id": lead_id})
            if lead:
                campaign_lead = CampaignLead(
                    campaign_id=campaign_obj.id,
                    lead_id=lead_id,
                    assigned_agent=created_by
                )
                campaign_lead_dict = prepare_for_mongo(campaign_lead.dict())
                await self.campaign_leads.insert_one(campaign_lead_dict)
        
        return campaign_obj
    
    async def get_campaign_by_id(self, campaign_id: str) -> Optional[dict]:
        """
        Get campaign by ID (either MongoDB id or campaign_id).
        
        Args:
            campaign_id: Campaign's unique identifier (MongoDB id or campaign_id like C-XXXXX)
            
        Returns:
            Optional[dict]: Campaign document if found, None otherwise
        """
        # Try to find by MongoDB id first (UUID format)
        campaign = await self.campaigns.find_one({"id": campaign_id})
        if campaign:
            return campaign
        
        # If not found, try to find by campaign_id (C-XXXXX format)
        return await self.campaigns.find_one({"campaign_id": campaign_id})
    
    async def get_campaigns_by_user(self, user_id: str, user_role: str, client_id: str = None) -> List[dict]:
        """
        Get campaigns accessible to a user based on their role.
        
        Args:
            user_id: User's unique identifier
            user_role: User's role (admin, agent, client)
            client_id: Client ID (required for client role)
            
        Returns:
            List[dict]: List of campaign documents
        """
        query = {}
        
        if user_role == "agent":
            # Get campaigns where user is assigned as agent
            campaign_leads = await self.campaign_leads.find({"assigned_agent": user_id}).to_list(settings.max_page_size)
            campaign_ids = [cl["campaign_id"] for cl in campaign_leads]
            query["id"] = {"$in": campaign_ids}
        elif user_role == "client":
            # Filter campaigns by client_id instead of created_by
            if client_id:
                query["client_id"] = client_id
            else:
                # Fallback to old behavior if client_id not provided
                query["created_by"] = user_id
        
        campaigns = await self.campaigns.find(query).sort("created_at", -1).to_list(settings.max_page_size)
        
        # Update total_leads count by counting leads with matching campaign_name
        for campaign in campaigns:
            campaign_name = campaign.get("campaign_name") or campaign.get("name")
            if campaign_name:
                total_leads_count = await self.leads.count_documents({"campaign_name": campaign_name})
                campaign["total_leads"] = total_leads_count
        
        return campaigns
    
    async def update_campaign(self, campaign_id: str, campaign_data: CampaignUpdate, user_id: str) -> Optional[dict]:
        """
        Update campaign information and handle lead changes.
        Supports partial updates - only provided fields will be updated.
        
        Args:
            campaign_id: Campaign's unique identifier
            campaign_data: Updated campaign data (partial update supported)
            user_id: ID of user making the update
            
        Returns:
            Optional[dict]: Updated campaign document if found, None otherwise
        """
        # Build update data with only provided fields (partial update)
        update_data = {"updated_at": datetime.now(timezone.utc)}
        
        # Only include fields that are not None
        data_dict = campaign_data.dict(exclude_unset=True)
        for key, value in data_dict.items():
            if value is not None:
                update_data[key] = value
        
        # Handle lead changes if provided
        if hasattr(campaign_data, 'lead_ids') and campaign_data.lead_ids is not None:
            # Get current campaign leads
            current_leads = await self.campaign_leads.find({"campaign_id": campaign_id}).to_list(settings.max_page_size)
            current_lead_ids = {cl["lead_id"] for cl in current_leads}
            new_lead_ids = set(campaign_data.lead_ids)
            
            # Remove leads that are no longer in the campaign
            leads_to_remove = current_lead_ids - new_lead_ids
            if leads_to_remove:
                await self.campaign_leads.delete_many({
                    "campaign_id": campaign_id,
                    "lead_id": {"$in": list(leads_to_remove)},
                    "status": {"$in": ["pending"]}  # Only remove pending leads
                })
            
            # Add new leads to the campaign
            leads_to_add = new_lead_ids - current_lead_ids
            for lead_id in leads_to_add:
                # Verify lead exists
                lead = await self.db.leads.find_one({"id": lead_id})
                if lead:
                    campaign_lead = CampaignLead(
                        campaign_id=campaign_id,
                        lead_id=lead_id,
                        assigned_agent=user_id
                    )
                    campaign_lead_dict = prepare_for_mongo(campaign_lead.dict())
                    await self.campaign_leads.insert_one(campaign_lead_dict)
            
            # Update total leads count
            total_leads_count = await self.campaign_leads.count_documents({"campaign_id": campaign_id})
            update_data["total_leads"] = total_leads_count
        
        update_data = prepare_for_mongo(update_data)
        
        # Find the campaign first to get the correct MongoDB id
        campaign = await self.get_campaign_by_id(campaign_id)
        if not campaign:
            return None
        
        # Update using the MongoDB id
        await self.campaigns.update_one({"id": campaign["id"]}, {"$set": update_data})
        
        return await self.get_campaign_by_id(campaign_id)
    
    async def delete_campaign(self, campaign_id: str) -> bool:
        """
        Delete a campaign and all related data.
        
        Args:
            campaign_id: Campaign's unique identifier (MongoDB id or campaign_id)
            
        Returns:
            bool: True if campaign was deleted, False otherwise
        """
        # First, get the campaign to find the correct campaign_id for related data
        campaign = await self.get_campaign_by_id(campaign_id)
        if not campaign:
            return False
        
        # Use the actual campaign_id from the document for related data deletion
        actual_campaign_id = campaign.get("campaign_id")
        campaign_mongo_id = campaign.get("id")
        
        # Delete campaign leads and call logs using the campaign_id
        if actual_campaign_id:
            await self.campaign_leads.delete_many({"campaign_id": actual_campaign_id})
            
            # Delete call logs for this campaign
            campaign_lead_ids = await self.campaign_leads.find({"campaign_id": actual_campaign_id}).to_list(settings.max_page_size)
            if campaign_lead_ids:
                campaign_lead_id_list = [cl["id"] for cl in campaign_lead_ids]
                await self.call_logs.delete_many({"campaign_lead_id": {"$in": campaign_lead_id_list}})
        
        # Delete the campaign using MongoDB id
        result = await self.campaigns.delete_one({"id": campaign_mongo_id})
        return result.deleted_count > 0
    
    async def get_next_campaign_lead(self, campaign_id: str, agent_id: str) -> Optional[dict]:
        """
        Get the next available lead for an agent in a campaign.
        
        Args:
            campaign_id: Campaign's unique identifier
            agent_id: Agent's unique identifier
            
        Returns:
            Optional[dict]: Next campaign lead document if found, None otherwise
        """
        return await self.campaign_leads.find_one({
            "campaign_id": campaign_id,
            "assigned_agent": agent_id,
            "status": CampaignLeadStatus.PENDING,
            "attempts_made": {"$lt": settings.max_campaign_attempts}
        })
    
    async def update_campaign_lead_status(self, campaign_lead_id: str, status: CampaignLeadStatus) -> bool:
        """
        Update campaign lead status.
        
        Args:
            campaign_lead_id: Campaign lead's unique identifier
            status: New status for the campaign lead
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        result = await self.campaign_leads.update_one(
            {"id": campaign_lead_id},
            {"$set": {"status": status.value}}
        )
        return result.modified_count > 0
    
    async def log_call(self, call_data: CallLogCreate, agent_id: str) -> CallLog:
        """
        Log a call attempt and update campaign lead status.
        
        Args:
            call_data: Call log creation data
            agent_id: Agent's unique identifier
            
        Returns:
            CallLog: The created call log object
        """
        # Create call log
        call_dict = call_data.dict()
        call_dict["agent_id"] = agent_id
        call_obj = CallLog(**call_dict)
        call_dict = prepare_for_mongo(call_obj.dict())
        
        await self.call_logs.insert_one(call_dict)
        
        # Get campaign lead
        campaign_lead = await self.campaign_leads.find_one({"id": call_data.campaign_lead_id})
        if campaign_lead:
            # Update campaign lead
            new_attempts = campaign_lead["attempts_made"] + 1
            update_data = {
                "attempts_made": new_attempts,
                "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                "last_call_outcome": call_data.outcome.value,
            }
            
            # Set status based on outcome and attempts
            if call_data.outcome.value == "answered":
                update_data["status"] = CampaignLeadStatus.COMPLETED.value
            elif new_attempts >= settings.max_campaign_attempts:
                update_data["status"] = CampaignLeadStatus.FAILED.value
            else:
                # Schedule next attempt (example: 1 hour later)
                next_attempt = datetime.now(timezone.utc) + timedelta(hours=settings.campaign_retry_delay_hours)
                update_data["next_attempt_at"] = next_attempt.isoformat()
                update_data["status"] = CampaignLeadStatus.PENDING.value
            
            await self.campaign_leads.update_one(
                {"id": call_data.campaign_lead_id},
                {"$set": update_data}
            )
            
            # Update campaign completed count if lead is completed
            if update_data["status"] == CampaignLeadStatus.COMPLETED.value:
                await self.campaigns.update_one(
                    {"id": campaign_lead["campaign_id"]},
                    {"$inc": {"completed_leads": 1}}
                )
        
        return call_obj
    
    async def get_campaign_stats(self, campaign_id: str) -> dict:
        """
        Get campaign statistics.
        
        Args:
            campaign_id: Campaign's unique identifier
            
        Returns:
            dict: Campaign statistics
        """
        # Get campaign
        campaign = await self.get_campaign_by_id(campaign_id)
        if not campaign:
            return {}
        
        # Get campaign name to match with leads
        campaign_name = campaign.get("campaign_name") or campaign.get("name", "")
        
        # Get leads stats from leads collection (by status field, case-insensitive)
        # Count total leads for this campaign
        total_leads = await self.leads.count_documents({"campaign_name": campaign_name})
        
        # Count leads by status (case-insensitive matching)
        completed_leads = await self.leads.count_documents({
            "campaign_name": campaign_name,
            "status": {"$regex": "^completed$", "$options": "i"}
        })
        
        busy_leads = await self.leads.count_documents({
            "campaign_name": campaign_name,
            "status": {"$regex": "^busy$", "$options": "i"}
        })
        
        no_answer_leads = await self.leads.count_documents({
            "campaign_name": campaign_name,
            "status": {"$regex": "^no_answer$", "$options": "i"}
        })
        
        # Also get campaign_leads stats for backward compatibility
        in_progress_leads = await self.campaign_leads.count_documents({
            "campaign_id": campaign_id,
            "status": CampaignLeadStatus.IN_PROGRESS.value
        })
        failed_leads = await self.campaign_leads.count_documents({
            "campaign_id": campaign_id,
            "status": CampaignLeadStatus.FAILED.value
        })
        
        # Get call outcomes distribution
        call_logs_pipeline = [
            {
                "$lookup": {
                    "from": "campaign_leads",
                    "localField": "campaign_lead_id",
                    "foreignField": "id",
                    "as": "campaign_lead"
                }
            },
            {
                "$match": {
                    "campaign_lead.campaign_id": campaign_id
                }
            },
            {
                "$group": {
                    "_id": "$outcome",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        call_outcomes = {}
        async for result in self.call_logs.aggregate(call_logs_pipeline):
            call_outcomes[result["_id"]] = result["count"]
        
        return {
            "campaign_id": campaign_id,
            "campaign_name": campaign.get("campaign_name") or campaign.get("name", ""),
            "total_leads": total_leads,
            "completed_leads": completed_leads,
            "in_progress_leads": in_progress_leads,
            "failed_leads": failed_leads,
            "busy_leads": busy_leads,
            "no_answer_leads": no_answer_leads,
            "pending_leads": total_leads - completed_leads - busy_leads - no_answer_leads,
            "call_outcomes": call_outcomes,
            "conversion_rate": (completed_leads / total_leads * 100) if total_leads > 0 else 0
        }
    
    async def get_call_statistics(
        self,
        agent_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> dict:
        """
        Get call statistics with optional filtering.
        
        Args:
            agent_id: Optional agent ID to filter by
            start_date: Optional start date for filtering
            end_date: Optional end date for filtering
            
        Returns:
            dict: Call statistics including total calls and breakdown by outcome
        """
        # Build query
        query = {}
        if agent_id:
            query["agent_id"] = agent_id
        if start_date or end_date:
            query["call_time"] = {}
            if start_date:
                query["call_time"]["$gte"] = start_date
            if end_date:
                # Add one day to include the entire end_date day
                end_date_inclusive = end_date + timedelta(days=1)
                query["call_time"]["$lt"] = end_date_inclusive
        
        # Get total calls
        total_calls = await self.call_logs.count_documents(query)
        
        # Get calls by outcome
        pipeline = []
        if query:
            pipeline.append({"$match": query})
        pipeline.append({
            "$group": {
                "_id": "$outcome",
                "count": {"$sum": 1}
            }
        })
        
        outcomes = {}
        async for result in self.call_logs.aggregate(pipeline):
            outcomes[result["_id"]] = result["count"]
        
        # Get calls by date (for date range) - simplified approach
        calls_by_date = {}
        try:
            # First get all matching calls and process in Python
            matching_calls = await self.call_logs.find(query).to_list(10000)
            for call in matching_calls:
                call_time = call.get("call_time")
                if call_time:
                    # Handle both datetime objects and ISO strings
                    if isinstance(call_time, datetime):
                        date_str = call_time.strftime("%Y-%m-%d")
                    elif isinstance(call_time, str):
                        try:
                            # Parse ISO string
                            if call_time.endswith('Z'):
                                call_time = call_time[:-1] + '+00:00'
                            dt = datetime.fromisoformat(call_time)
                            date_str = dt.strftime("%Y-%m-%d")
                        except (ValueError, AttributeError):
                            continue
                    else:
                        continue
                    
                    calls_by_date[date_str] = calls_by_date.get(date_str, 0) + 1
        except Exception as e:
            # If processing fails, just return empty dict
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error getting calls by date: {e}")
            calls_by_date = {}
        
        return {
            "total_calls": total_calls,
            "calls_by_outcome": outcomes,
            "calls_by_date": calls_by_date
        }
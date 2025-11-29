"""
Raw Call Data repository for database operations.
Handles storage and retrieval of Twilio call records.
"""

from typing import Optional, List
from app.models.raw_call_data import RawCallData, RawCallDataCreate
from app.utils import prepare_for_mongo


class RawCallDataRepository:
    """
    Repository for raw call data database operations.
    Handles CRUD operations for Twilio call records.
    """
    
    def __init__(self, database):
        """
        Initialize raw call data repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database.raw_call_data
    
    async def create_call_record(self, call_data: RawCallDataCreate) -> RawCallData:
        """
        Create a new raw call data record.
        
        Args:
            call_data: Raw call data creation data
            
        Returns:
            RawCallData: The created call record
        """
        call_obj = RawCallData(**call_data.dict())
        call_dict = prepare_for_mongo(call_obj.dict())
        
        await self.db.insert_one(call_dict)
        return call_obj
    
    async def get_call_by_sid(self, sid: str) -> Optional[dict]:
        """
        Get call record by Twilio SID.
        
        Args:
            sid: Twilio call SID
            
        Returns:
            Optional[dict]: Call record if found, None otherwise
        """
        return await self.db.find_one({"sid": sid})
    
    async def get_calls_by_lead_id(self, lead_id: str) -> List[dict]:
        """
        Get all call records for a specific lead.
        
        Args:
            lead_id: Lead's unique identifier
            
        Returns:
            List[dict]: List of call records
        """
        return await self.db.find({"lead_id": lead_id}).to_list(1000)
    
    async def get_calls_by_campaign_id(self, campaign_id: str) -> List[dict]:
        """
        Get all call records for a specific campaign.
        
        Args:
            campaign_id: Campaign's unique identifier
            
        Returns:
            List[dict]: List of call records
        """
        return await self.db.find({"campaign_id": campaign_id}).to_list(1000)
    
    async def get_all_calls(self, limit: int = 1000) -> List[dict]:
        """
        Get all call records.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List[dict]: List of call records
        """
        return await self.db.find().to_list(limit)
    
    async def update_call_record(self, sid: str, update_data: dict) -> Optional[dict]:
        """
        Update call record.
        
        Args:
            sid: Twilio call SID
            update_data: Data to update
            
        Returns:
            Optional[dict]: Updated call record if found, None otherwise
        """
        update_data = prepare_for_mongo(update_data)
        await self.db.update_one({"sid": sid}, {"$set": update_data})
        return await self.get_call_by_sid(sid)


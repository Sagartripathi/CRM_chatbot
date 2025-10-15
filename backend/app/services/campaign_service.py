"""
Campaign service for campaign management.
Handles business logic for campaign operations.
"""

from typing import List, Optional
from fastapi import HTTPException, status
from app.models import (
    Campaign, CampaignCreate, CampaignLead, CallLog, CallLogCreate,
    User, UserRole, NextLeadResponse, Lead
)
from app.repositories import CampaignRepository, LeadRepository
import logging


def _role_value(role) -> str:
    """Return the string value for a role whether it's an Enum or a string."""
    try:
        # If role is an Enum member
        return role.value
    except Exception:
        # If role is already a string
        return str(role)


class CampaignService:
    """
    Service for campaign management.
    Handles business logic for campaign operations.
    """
    
    def __init__(self, campaign_repository: CampaignRepository, lead_repository: LeadRepository):
        """
        Initialize campaign service.
        
        Args:
            campaign_repository: Campaign repository instance
            lead_repository: Lead repository instance
        """
        self.campaign_repo = campaign_repository
        self.lead_repo = lead_repository
    
    async def create_campaign(self, campaign_data: CampaignCreate, current_user: User) -> Campaign:
        """
        Create a new campaign.
        
        Args:
            campaign_data: Campaign creation data
            current_user: Current authenticated user
            
        Returns:
            Campaign: The created campaign object
            
        Raises:
            HTTPException: If user not authorized to create campaigns
        """
        # Log incoming create attempt for debugging role-based authorization
        logger = logging.getLogger(__name__)
        try:
            logger.info("create_campaign called by user=%s role=%s", current_user.id, current_user.role)
        except Exception:
            logger.debug("create_campaign called but failed to log user info")

        role_val = _role_value(current_user.role)
        if role_val not in [UserRole.ADMIN.value, UserRole.AGENT.value]:
            raise HTTPException(status_code=403, detail="Not authorized to create campaigns")
        
        return await self.campaign_repo.create_campaign(campaign_data, current_user.id)
    
    async def get_campaigns(self, current_user: User) -> List[Campaign]:
        """
        Get campaigns accessible to the user.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            List[Campaign]: List of campaign objects
        """
        campaigns = await self.campaign_repo.get_campaigns_by_user(
            current_user.id, current_user.role
        )
        return [Campaign(**campaign) for campaign in campaigns]
    
    async def get_campaign_by_id(self, campaign_id: str, current_user: User) -> Campaign:
        """
        Get campaign by ID.
        
        Args:
            campaign_id: Campaign's unique identifier
            current_user: Current authenticated user
            
        Returns:
            Campaign: Campaign object
            
        Raises:
            HTTPException: If campaign not found
        """
        campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return Campaign(**campaign)
    
    async def start_campaign_agent(self, campaign_id: str, current_user: User) -> NextLeadResponse:
        """
        Start campaign for an agent and get next lead.
        
        Args:
            campaign_id: Campaign's unique identifier
            current_user: Current authenticated user
            
        Returns:
            NextLeadResponse: Next lead information
            
        Raises:
            HTTPException: If user not authorized or no leads available
        """
        role_val = _role_value(current_user.role)
        if role_val != UserRole.AGENT.value:
            raise HTTPException(status_code=403, detail="Only agents can start campaigns")
        
        # Find campaign
        campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Find next available lead for this agent
        next_campaign_lead = await self.campaign_repo.get_next_campaign_lead(
            campaign_id, current_user.id
        )
        
        if not next_campaign_lead:
            raise HTTPException(status_code=404, detail="No available leads in this campaign")
        
        # Get lead details
        lead = await self.lead_repo.get_lead_by_id(next_campaign_lead["lead_id"])
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Update campaign lead status
        await self.campaign_repo.update_campaign_lead_status(
            next_campaign_lead["id"], "in_progress"
        )
        
        return NextLeadResponse(
            campaign_lead=CampaignLead(**next_campaign_lead),
            lead=Lead(**lead),
            message="Next lead ready for contact"
        )
    
    async def log_call(self, call_data: CallLogCreate, current_user: User) -> CallLog:
        """
        Log a call attempt.
        
        Args:
            call_data: Call log creation data
            current_user: Current authenticated user
            
        Returns:
            CallLog: The created call log object
            
        Raises:
            HTTPException: If user not authorized or campaign lead not found
        """
        role_val = _role_value(current_user.role)
        if role_val != UserRole.AGENT.value:
            raise HTTPException(status_code=403, detail="Only agents can log calls")
        
        # Get campaign lead
        campaign_lead = await self.campaign_repo.campaign_leads.find_one(
            {"id": call_data.campaign_lead_id}
        )
        if not campaign_lead:
            raise HTTPException(status_code=404, detail="Campaign lead not found")
        
        return await self.campaign_repo.log_call(call_data, current_user.id)
    
    async def get_campaign_stats(self, campaign_id: str, current_user: User) -> dict:
        """
        Get campaign statistics.
        
        Args:
            campaign_id: Campaign's unique identifier
            current_user: Current authenticated user
            
        Returns:
            dict: Campaign statistics
            
        Raises:
            HTTPException: If campaign not found
        """
        # Get campaign
        campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return await self.campaign_repo.get_campaign_stats(campaign_id)
    
    async def update_campaign(self, campaign_id: str, campaign_data: CampaignCreate, current_user: User) -> Campaign:
        """
        Update campaign information.
        
        Args:
            campaign_id: Campaign's unique identifier
            campaign_data: Updated campaign data
            current_user: Current authenticated user
            
        Returns:
            Campaign: Updated campaign object
            
        Raises:
            HTTPException: If user not authorized or campaign not found
        """
        role_val = _role_value(current_user.role)
        if role_val not in [UserRole.ADMIN.value, UserRole.AGENT.value]:
            raise HTTPException(status_code=403, detail="Not authorized to update campaigns")
        
        # Find existing campaign
        existing_campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Check permissions (only creator or admin can edit)
        role_val = _role_value(current_user.role)
        if role_val != UserRole.ADMIN.value and existing_campaign["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this campaign")
        
        updated_campaign = await self.campaign_repo.update_campaign(
            campaign_id, campaign_data, current_user.id
        )
        
        return Campaign(**updated_campaign)
    
    async def delete_campaign(self, campaign_id: str, current_user: User) -> dict:
        """
        Delete a campaign.
        
        Args:
            campaign_id: Campaign's unique identifier
            current_user: Current authenticated user
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If user not authorized, campaign not found, or campaign has active calls
        """
        role_val = _role_value(current_user.role)
        if role_val not in [UserRole.ADMIN.value, UserRole.AGENT.value]:
            raise HTTPException(status_code=403, detail="Not authorized to delete campaigns")
        
        # Find existing campaign
        existing_campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Check permissions (only creator or admin can delete)
        role_val = _role_value(current_user.role)
        if role_val != UserRole.ADMIN.value and existing_campaign["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this campaign")
        
        # Check if campaign has active calls
        active_campaign_leads = await self.campaign_repo.campaign_leads.find({
            "campaign_id": campaign_id,
            "status": "in_progress"
        }).to_list(10)
        
        if active_campaign_leads:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete campaign with calls in progress"
            )
        
        # Delete the campaign
        await self.campaign_repo.delete_campaign(campaign_id)
        
        return {"message": "Campaign deleted successfully"}

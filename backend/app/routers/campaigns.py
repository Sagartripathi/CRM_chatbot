"""
Campaign management API routes.
Handles campaign CRUD operations and call logging.
"""

from typing import List
from fastapi import APIRouter, Depends
from app.models import (
    Campaign, CampaignCreate, CallLog, CallLogCreate, User,
    NextLeadResponse
)
from app.services import CampaignService
from app.repositories import CampaignRepository, LeadRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def get_campaign_service() -> CampaignService:
    """
    Dependency to get campaign service.
    
    Returns:
        CampaignService: Campaign service instance
    """
    campaign_repo = CampaignRepository(db.database)
    lead_repo = LeadRepository(db.database)
    return CampaignService(campaign_repo, lead_repo)


@router.post("/", response_model=Campaign)
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Create a new campaign.
    
    Args:
        campaign_data: Campaign creation data
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        Campaign: The created campaign object
        
    Raises:
        HTTPException: If user not authorized to create campaigns
    """
    return await campaign_service.create_campaign(campaign_data, current_user)


@router.get("/", response_model=List[Campaign])
async def get_campaigns(
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Get campaigns accessible to the user.
    
    Args:
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        List[Campaign]: List of campaign objects
    """
    return await campaign_service.get_campaigns(current_user)


@router.post("/{campaign_id}/start", response_model=NextLeadResponse)
async def start_campaign_agent(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Start campaign for an agent and get next lead.
    
    Args:
        campaign_id: Campaign's unique identifier
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        NextLeadResponse: Next lead information
        
    Raises:
        HTTPException: If user not authorized or no leads available
    """
    return await campaign_service.start_campaign_agent(campaign_id, current_user)


@router.post("/calls", response_model=CallLog)
async def log_call(
    call_data: CallLogCreate,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Log a call attempt.
    
    Args:
        call_data: Call log creation data
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        CallLog: The created call log object
        
    Raises:
        HTTPException: If user not authorized or campaign lead not found
    """
    return await campaign_service.log_call(call_data, current_user)


@router.get("/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Get campaign statistics.
    
    Args:
        campaign_id: Campaign's unique identifier
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        dict: Campaign statistics
        
    Raises:
        HTTPException: If campaign not found
    """
    return await campaign_service.get_campaign_stats(campaign_id, current_user)


@router.put("/{campaign_id}", response_model=Campaign)
async def update_campaign(
    campaign_id: str,
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Update campaign information.
    
    Args:
        campaign_id: Campaign's unique identifier
        campaign_data: Updated campaign data
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        Campaign: Updated campaign object
        
    Raises:
        HTTPException: If user not authorized or campaign not found
    """
    return await campaign_service.update_campaign(campaign_id, campaign_data, current_user)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Delete a campaign.
    
    Args:
        campaign_id: Campaign's unique identifier
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If user not authorized, campaign not found, or campaign has active calls
    """
    return await campaign_service.delete_campaign(campaign_id, current_user)

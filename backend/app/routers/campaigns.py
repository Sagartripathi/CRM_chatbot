"""
Campaign management API routes.
Handles campaign CRUD operations and call logging.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from app.models import (
    Campaign, CampaignCreate, CampaignUpdate, CallLog, CallLogCreate, User,
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
    try:
        return await campaign_service.get_campaigns(current_user)
    except HTTPException:
        # Re-raise HTTP exceptions (like 403, 404)
        raise
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        error_traceback = traceback.format_exc()
        logger.error(f"Error getting campaigns: {str(e)}")
        logger.error(error_traceback)
        
        # Return a more detailed error message
        error_detail = f"Failed to retrieve campaigns: {str(e)}"
        if "validation" in str(e).lower() or "value" in str(e).lower():
            error_detail += ". This may be due to invalid data in the database. Check server logs for details."
        
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )


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
    campaign_data: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Update campaign information.
    
    Args:
        campaign_id: Campaign's unique identifier
        campaign_data: Updated campaign data (partial update supported)
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        Campaign: Updated campaign object
        
    Raises:
        HTTPException: If user not authorized or campaign not found
    """
    try:
        return await campaign_service.update_campaign(campaign_id, campaign_data, current_user)
    except HTTPException:
        # Re-raise HTTP exceptions (like 403, 404)
        raise
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        error_traceback = traceback.format_exc()
        logger.error(f"Error updating campaign {campaign_id}: {str(e)}")
        logger.error(error_traceback)
        
        error_detail = f"Failed to update campaign: {str(e)}"
        if "validation" in str(e).lower() or "value" in str(e).lower():
            error_detail += ". This may be due to invalid data. Check server logs for details."
        
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )


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


@router.post("/upload-csv")
async def upload_campaigns_csv(
    file: UploadFile = File(...),
    client_id: str = Query(..., description="Client ID to assign to all campaigns"),
    agent_id: str = Query(..., description="Agent ID to assign to all campaigns"),
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Upload campaigns from CSV file.
    
    Args:
        file: CSV file upload
        client_id: Client ID to assign to all campaigns (mandatory)
        agent_id: Agent ID to assign to all campaigns (mandatory)
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        dict: Upload results with statistics
        
    Raises:
        HTTPException: If file format is invalid or required columns missing
    """
    return await campaign_service.upload_campaigns_csv(file, current_user, client_id, agent_id)


@router.get("/calls/statistics")
async def get_call_statistics(
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_user),
    campaign_service: CampaignService = Depends(get_campaign_service)
):
    """
    Get call statistics with optional filtering.
    
    Args:
        agent_id: Optional agent ID to filter by
        start_date: Optional start date for filtering (ISO format)
        end_date: Optional end date for filtering (ISO format)
        current_user: Current authenticated user
        campaign_service: Campaign service dependency
        
    Returns:
        dict: Call statistics including total calls and breakdown by outcome
        
    Raises:
        HTTPException: If user not authorized
    """
    start_dt = None
    end_dt = None
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
    
    return await campaign_service.get_call_statistics(
        current_user,
        agent_id=agent_id,
        start_date=start_dt,
        end_date=end_dt
    )

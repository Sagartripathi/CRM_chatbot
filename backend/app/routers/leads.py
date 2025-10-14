"""
Lead management API routes.
Handles lead CRUD operations and CSV upload.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models import (
    Lead, LeadCreate, User, UserRole, LeadStatus, NextLeadResponse
)
from app.services import LeadService
from app.repositories import LeadRepository, UserRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/leads", tags=["leads"])


def get_lead_service() -> LeadService:
    """
    Dependency to get lead service.
    
    Returns:
        LeadService: Lead service instance
    """
    lead_repo = LeadRepository(db.database)
    user_repo = UserRepository(db.database)
    return LeadService(lead_repo, user_repo)


@router.post("/", response_model=Lead)
async def create_lead(
    lead_data: LeadCreate,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Create a new lead.
    
    Args:
        lead_data: Lead creation data
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        Lead: The created lead object
        
    Raises:
        HTTPException: If duplicate lead exists
    """
    return await lead_service.create_lead(lead_data, current_user)


@router.get("/", response_model=List[Lead])
async def get_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Get leads with optional filters.
    
    Args:
        status: Filter by lead status
        source: Filter by lead source
        assigned_to: Filter by assigned user
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        List[Lead]: List of lead objects
    """
    return await lead_service.get_leads(current_user, status, source, assigned_to)


@router.get("/{lead_id}", response_model=Lead)
async def get_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Get lead by ID.
    
    Args:
        lead_id: Lead's unique identifier
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        Lead: Lead object
        
    Raises:
        HTTPException: If lead not found or access denied
    """
    return await lead_service.get_lead_by_id(lead_id, current_user)


@router.put("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    lead_data: LeadCreate,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Update lead information.
    
    Args:
        lead_id: Lead's unique identifier
        lead_data: Updated lead data
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        Lead: Updated lead object
        
    Raises:
        HTTPException: If lead not found, access denied, or duplicate exists
    """
    return await lead_service.update_lead(lead_id, lead_data, current_user)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Delete a lead.
    
    Args:
        lead_id: Lead's unique identifier
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If lead not found, access denied, or lead is in active campaigns
    """
    return await lead_service.delete_lead(lead_id, current_user)


@router.post("/upload-csv")
async def upload_leads_csv(
    file: UploadFile = File(...),
    campaign_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Upload leads from CSV file.
    
    Args:
        file: CSV file upload
        campaign_id: Optional campaign ID to assign leads to
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        dict: Upload results with statistics
        
    Raises:
        HTTPException: If file format is invalid or required columns missing
    """
    return await lead_service.upload_leads_csv(file, current_user, campaign_id)


@router.patch("/{lead_id}/campaign")
async def update_lead_campaign(
    lead_id: str,
    campaign_id: Optional[str],
    current_user: User = Depends(get_current_user),
    lead_service: LeadService = Depends(get_lead_service)
):
    """
    Update lead's campaign assignment.
    
    Args:
        lead_id: Lead's unique identifier
        campaign_id: New campaign ID (None to remove assignment)
        current_user: Current authenticated user
        lead_service: Lead service dependency
        
    Returns:
        Lead: Updated lead object
        
    Raises:
        HTTPException: If lead not found or access denied
    """
    return await lead_service.update_lead_campaign(lead_id, campaign_id, current_user)

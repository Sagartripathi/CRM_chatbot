"""
Meeting management API routes.
Handles meeting CRUD operations and scheduling.
"""

from typing import List
from fastapi import APIRouter, Depends
from app.models import (
    Meeting, MeetingCreate, MeetingProposal, User, MeetingStatus
)
from app.services import MeetingService
from app.repositories import MeetingRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/meetings", tags=["meetings"])


def get_meeting_service() -> MeetingService:
    """
    Dependency to get meeting service.
    
    Returns:
        MeetingService: Meeting service instance
    """
    meeting_repo = MeetingRepository(db.database)
    return MeetingService(meeting_repo)


@router.post("/", response_model=Meeting)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Create a new meeting.
    
    Args:
        meeting_data: Meeting creation data
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        Meeting: The created meeting object
        
    Raises:
        HTTPException: If time slot conflicts with existing meeting
    """
    return await meeting_service.create_meeting(meeting_data, current_user)


@router.post("/propose")
async def propose_meeting(
    proposal: MeetingProposal,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Propose a meeting time.
    
    Args:
        proposal: Meeting proposal data
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        dict: Meeting proposal result
    """
    return await meeting_service.propose_meeting(proposal, current_user)


@router.get("/", response_model=List[Meeting])
async def get_meetings(
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Get meetings accessible to the user.
    
    Args:
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        List[Meeting]: List of meeting objects
    """
    return await meeting_service.get_meetings(current_user)


@router.get("/{meeting_id}", response_model=Meeting)
async def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Get meeting by ID.
    
    Args:
        meeting_id: Meeting's unique identifier
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        Meeting: Meeting object
        
    Raises:
        HTTPException: If meeting not found or access denied
    """
    return await meeting_service.get_meeting_by_id(meeting_id, current_user)


@router.put("/{meeting_id}", response_model=Meeting)
async def update_meeting(
    meeting_id: str,
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Update meeting information.
    
    Args:
        meeting_id: Meeting's unique identifier
        meeting_data: Updated meeting data
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        Meeting: Updated meeting object
        
    Raises:
        HTTPException: If meeting not found or access denied
    """
    return await meeting_service.update_meeting(meeting_id, meeting_data, current_user)


@router.patch("/{meeting_id}/status", response_model=Meeting)
async def update_meeting_status(
    meeting_id: str,
    status: MeetingStatus,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Update meeting status.
    
    Args:
        meeting_id: Meeting's unique identifier
        status: New meeting status
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        Meeting: Updated meeting object
        
    Raises:
        HTTPException: If meeting not found or access denied
    """
    return await meeting_service.update_meeting_status(meeting_id, status, current_user)


@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """
    Delete a meeting.
    
    Args:
        meeting_id: Meeting's unique identifier
        current_user: Current authenticated user
        meeting_service: Meeting service dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If meeting not found or access denied
    """
    return await meeting_service.delete_meeting(meeting_id, current_user)

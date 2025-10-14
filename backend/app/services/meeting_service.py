"""
Meeting service for meeting management.
Handles business logic for meeting operations.
"""

from typing import List
from fastapi import HTTPException, status
from app.models import Meeting, MeetingCreate, MeetingProposal, User, UserRole, MeetingStatus
from app.repositories import MeetingRepository


class MeetingService:
    """
    Service for meeting management.
    Handles business logic for meeting operations.
    """
    
    def __init__(self, meeting_repository: MeetingRepository):
        """
        Initialize meeting service.
        
        Args:
            meeting_repository: Meeting repository instance
        """
        self.meeting_repo = meeting_repository
    
    async def create_meeting(self, meeting_data: MeetingCreate, current_user: User) -> Meeting:
        """
        Create a new meeting.
        
        Args:
            meeting_data: Meeting creation data
            current_user: Current authenticated user
            
        Returns:
            Meeting: The created meeting object
            
        Raises:
            HTTPException: If time slot conflicts with existing meeting
        """
        # Calculate end time
        start_time = meeting_data.start_time
        end_time = start_time + meeting_data.duration_minutes
        
        # Check for conflicts
        conflict = await self.meeting_repo.check_meeting_conflict(
            current_user.id, start_time, end_time
        )
        
        if conflict:
            raise HTTPException(
                status_code=400, 
                detail="Time slot conflicts with existing meeting"
            )
        
        return await self.meeting_repo.create_meeting(meeting_data, current_user.id)
    
    async def propose_meeting(self, proposal: MeetingProposal, current_user: User) -> dict:
        """
        Propose a meeting time.
        
        Args:
            proposal: Meeting proposal data
            current_user: Current authenticated user
            
        Returns:
            dict: Meeting proposal result
        """
        return await self.meeting_repo.propose_meeting(proposal, current_user.id)
    
    async def get_meetings(self, current_user: User) -> List[Meeting]:
        """
        Get meetings accessible to the user.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            List[Meeting]: List of meeting objects
        """
        meetings = await self.meeting_repo.get_meetings_by_user(
            current_user.id, current_user.role.value
        )
        return [Meeting(**meeting) for meeting in meetings]
    
    async def get_meeting_by_id(self, meeting_id: str, current_user: User) -> Meeting:
        """
        Get meeting by ID.
        
        Args:
            meeting_id: Meeting's unique identifier
            current_user: Current authenticated user
            
        Returns:
            Meeting: Meeting object
            
        Raises:
            HTTPException: If meeting not found or access denied
        """
        meeting = await self.meeting_repo.get_meeting_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Check permissions
        if current_user.role != UserRole.ADMIN and meeting["organizer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this meeting")
        
        return Meeting(**meeting)
    
    async def update_meeting(self, meeting_id: str, meeting_data: MeetingCreate, current_user: User) -> Meeting:
        """
        Update meeting information.
        
        Args:
            meeting_id: Meeting's unique identifier
            meeting_data: Updated meeting data
            current_user: Current authenticated user
            
        Returns:
            Meeting: Updated meeting object
            
        Raises:
            HTTPException: If meeting not found or access denied
        """
        existing_meeting = await self.meeting_repo.get_meeting_by_id(meeting_id)
        if not existing_meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Check permissions
        if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this meeting")
        
        updated_meeting = await self.meeting_repo.update_meeting(meeting_id, meeting_data)
        return Meeting(**updated_meeting)
    
    async def update_meeting_status(self, meeting_id: str, status: MeetingStatus, current_user: User) -> Meeting:
        """
        Update meeting status.
        
        Args:
            meeting_id: Meeting's unique identifier
            status: New meeting status
            current_user: Current authenticated user
            
        Returns:
            Meeting: Updated meeting object
            
        Raises:
            HTTPException: If meeting not found or access denied
        """
        existing_meeting = await self.meeting_repo.get_meeting_by_id(meeting_id)
        if not existing_meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Check permissions
        if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this meeting")
        
        updated_meeting = await self.meeting_repo.update_meeting_status(meeting_id, status)
        return Meeting(**updated_meeting)
    
    async def delete_meeting(self, meeting_id: str, current_user: User) -> dict:
        """
        Delete a meeting.
        
        Args:
            meeting_id: Meeting's unique identifier
            current_user: Current authenticated user
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If meeting not found or access denied
        """
        existing_meeting = await self.meeting_repo.get_meeting_by_id(meeting_id)
        if not existing_meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Check permissions
        if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this meeting")
        
        await self.meeting_repo.delete_meeting(meeting_id)
        return {"message": "Meeting deleted successfully"}

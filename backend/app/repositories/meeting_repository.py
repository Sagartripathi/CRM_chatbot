"""
Meeting repository for database operations.
Handles all meeting-related database interactions.
"""

from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.models import Meeting, MeetingCreate, MeetingProposal, MeetingStatus
from app.utils import prepare_for_mongo, parse_from_mongo


class MeetingRepository:
    """
    Repository for meeting database operations.
    Handles CRUD operations for meetings.
    """
    
    def __init__(self, database):
        """
        Initialize meeting repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database.meetings
    
    async def create_meeting(self, meeting_data: MeetingCreate, organizer_id: str) -> Meeting:
        """
        Create a new meeting in the database.
        
        Args:
            meeting_data: Meeting creation data
            organizer_id: ID of the user organizing the meeting
            
        Returns:
            Meeting: The created meeting object
        """
        # Calculate end time
        start_time = meeting_data.start_time
        end_time = start_time + timedelta(minutes=meeting_data.duration_minutes)
        
        meeting_dict = meeting_data.dict(exclude={"duration_minutes"})
        meeting_dict.update({
            "organizer_id": organizer_id,
            "end_time": end_time,
            "status": MeetingStatus.CONFIRMED.value
        })
        
        meeting_obj = Meeting(**meeting_dict)
        meeting_dict = prepare_for_mongo(meeting_obj.dict())
        
        await self.db.insert_one(meeting_dict)
        return meeting_obj
    
    async def get_meeting_by_id(self, meeting_id: str) -> Optional[dict]:
        """
        Get meeting by ID.
        
        Args:
            meeting_id: Meeting's unique identifier
            
        Returns:
            Optional[dict]: Meeting document if found, None otherwise
        """
        meeting = await self.db.find_one({"id": meeting_id})
        if meeting:
            # Parse datetime strings back to datetime objects for compatibility
            meeting = parse_from_mongo(meeting)
        return meeting
    
    async def get_meetings_by_user(self, user_id: str, user_role: str) -> List[dict]:
        """
        Get meetings accessible to a user based on their role.
        Returns all meetings regardless of format (standard or Google Calendar).
        
        Args:
            user_id: User's unique identifier
            user_role: User's role (admin, agent, client)
            
        Returns:
            List[dict]: List of meeting documents (raw from database)
        """
        # For admin, return all meetings
        # For agents/clients, return all meetings (Google Calendar format doesn't have organizer_id)
        # In the future, we can add filtering based on organizer.displayName for Google Calendar
        query = {}
        
        # Get all meetings - handle both standard and Google Calendar format
        # Don't sort by start_time as Google Calendar format uses start.dateTime
        # Return raw documents without modification
        try:
            # Get all documents - no filtering for now to include Google Calendar meetings
            cursor = self.db.find({})
            meetings = await cursor.to_list(1000)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching meetings: {e}")
            meetings = []
        
        # Return raw documents - don't parse/modify them
        # Frontend will handle normalization
        # Convert MongoDB documents to dicts
        result = []
        for meeting in meetings:
            try:
                if isinstance(meeting, dict):
                    # Create a copy to avoid modifying original
                    meeting_dict = dict(meeting)
                    # Remove MongoDB _id if present (convert to string if needed)
                    if "_id" in meeting_dict:
                        del meeting_dict["_id"]
                    result.append(meeting_dict)
                else:
                    # Convert document to dict
                    result.append(dict(meeting))
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error processing meeting document: {e}")
                continue
        
        return result
    
    async def update_meeting(self, meeting_id: str, meeting_data: MeetingCreate) -> Optional[dict]:
        """
        Update meeting information.
        
        Args:
            meeting_id: Meeting's unique identifier
            meeting_data: Updated meeting data
            
        Returns:
            Optional[dict]: Updated meeting document if found, None otherwise
        """
        update_data = meeting_data.dict(exclude={"duration_minutes"})
        update_data.update({
            "end_time": meeting_data.start_time + timedelta(minutes=meeting_data.duration_minutes),
            "updated_at": datetime.now(timezone.utc)
        })
        update_data = prepare_for_mongo(update_data)
        
        await self.db.update_one({"id": meeting_id}, {"$set": update_data})
        meeting = await self.get_meeting_by_id(meeting_id)
        # Parse datetime strings back to datetime objects
        if meeting:
            meeting = parse_from_mongo(meeting)
        return meeting
    
    async def update_meeting_status(self, meeting_id: str, status: MeetingStatus) -> Optional[dict]:
        """
        Update meeting status.
        
        Args:
            meeting_id: Meeting's unique identifier
            status: New meeting status
            
        Returns:
            Optional[dict]: Updated meeting document if found, None otherwise
        """
        update_data = {
            "status": status.value,
            "updated_at": datetime.now(timezone.utc)
        }
        update_data = prepare_for_mongo(update_data)
        
        await self.db.update_one({"id": meeting_id}, {"$set": update_data})
        meeting = await self.get_meeting_by_id(meeting_id)
        # Parse datetime strings back to datetime objects
        if meeting:
            meeting = parse_from_mongo(meeting)
        return meeting
    
    async def delete_meeting(self, meeting_id: str) -> bool:
        """
        Delete a meeting from the database.
        
        Args:
            meeting_id: Meeting's unique identifier
            
        Returns:
            bool: True if meeting was deleted, False otherwise
        """
        result = await self.db.delete_one({"id": meeting_id})
        return result.deleted_count > 0
    
    async def check_meeting_conflict(self, organizer_id: str, start_time: datetime, end_time: datetime, exclude_meeting_id: Optional[str] = None) -> Optional[dict]:
        """
        Check for meeting time conflicts.
        
        Args:
            organizer_id: ID of the meeting organizer
            start_time: Meeting start time
            end_time: Meeting end time
            exclude_meeting_id: Meeting ID to exclude from conflict check
            
        Returns:
            Optional[dict]: Conflicting meeting if found, None otherwise
        """
        conflict_query = {
            "organizer_id": organizer_id,
            "status": {"$in": ["confirmed", "proposed"]},
            "$or": [
                {
                    "start_time": {"$lte": start_time.isoformat()},
                    "end_time": {"$gte": start_time.isoformat()}
                },
                {
                    "start_time": {"$lte": end_time.isoformat()},
                    "end_time": {"$gte": end_time.isoformat()}
                }
            ]
        }
        
        if exclude_meeting_id:
            conflict_query["id"] = {"$ne": exclude_meeting_id}
        
        return await self.db.find_one(conflict_query)
    
    async def propose_meeting(self, proposal: MeetingProposal, organizer_id: str) -> dict:
        """
        Propose a meeting time and handle conflicts.
        
        Args:
            proposal: Meeting proposal data
            organizer_id: ID of the meeting organizer
            
        Returns:
            dict: Meeting proposal result
        """
        start_time = proposal.requested_time
        end_time = start_time + timedelta(minutes=proposal.duration_minutes)
        
        # Check for conflicts
        existing_meeting = await self.check_meeting_conflict(organizer_id, start_time, end_time)
        
        if not existing_meeting:
            # No conflict, create confirmed meeting
            meeting = Meeting(
                lead_id=proposal.lead_id,
                organizer_id=organizer_id,
                title=proposal.title or f"Meeting with Lead",
                start_time=start_time,
                end_time=end_time,
                notes=proposal.notes,
                status=MeetingStatus.CONFIRMED
            )
            meeting_dict = prepare_for_mongo(meeting.dict())
            await self.db.insert_one(meeting_dict)
            
            return {
                "status": "confirmed",
                "meeting": meeting,
                "message": "Meeting confirmed for requested time"
            }
        else:
            # Conflict exists, suggest alternative times
            alternatives = []
            for i in range(1, 4):
                alt_start = start_time + timedelta(hours=i)
                alt_end = alt_start + timedelta(minutes=proposal.duration_minutes)
                
                # Check if this alternative slot is free
                alt_conflict = await self.check_meeting_conflict(organizer_id, alt_start, alt_end)
                if not alt_conflict:
                    alternatives.append({
                        "start_time": alt_start.isoformat(),
                        "end_time": alt_end.isoformat()
                    })
            
            return {
                "status": "conflict",
                "message": "Requested time conflicts with existing meeting",
                "conflicting_meeting_id": existing_meeting["id"],
                "suggested_alternatives": alternatives
            }

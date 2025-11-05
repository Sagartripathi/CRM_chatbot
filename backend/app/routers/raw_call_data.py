"""
Raw Call Data API routes.
Handles storage and retrieval of Twilio call records.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.models.raw_call_data import RawCallData, RawCallDataCreate
from app.models import User
from app.repositories.raw_call_data_repository import RawCallDataRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/raw-call-data", tags=["raw-call-data"])


def get_raw_call_data_repo() -> RawCallDataRepository:
    """
    Dependency to get raw call data repository.
    
    Returns:
        RawCallDataRepository: Repository instance
    """
    return RawCallDataRepository(db.database)


@router.post("/", response_model=RawCallData)
async def create_call_record(
    call_data: RawCallDataCreate,
    repo: RawCallDataRepository = Depends(get_raw_call_data_repo)
):
    """
    Create a new raw call data record.
    This endpoint can be called from Twilio webhooks or n8n workflows.
    No authentication required for webhook integration.
    
    FLEXIBLE STORAGE: 
    - Known fields are validated and stored in structured format
    - Unknown/extra fields are automatically stored in raw_CD_original
    - This allows n8n to send any new fields without breaking the API
    
    Args:
        call_data: Raw call data from Twilio/n8n
        repo: Repository dependency
        
    Returns:
        RawCallData: The created call record
    """
    # Check if record already exists (prevent duplicates)
    existing = await repo.get_call_by_sid(call_data.sid)
    if existing:
        raise HTTPException(status_code=400, detail=f"Call record with SID {call_data.sid} already exists")
    
    return await repo.create_call_record(call_data)


@router.post("/flexible")
async def create_call_record_flexible(
    payload: dict,
    repo: RawCallDataRepository = Depends(get_raw_call_data_repo)
):
    """
    Create a raw call data record with FULL FLEXIBILITY.
    Accepts ANY JSON structure from n8n/Twilio.
    
    This endpoint stores the ENTIRE payload in raw_CD_original
    and extracts known fields if available.
    
    Args:
        payload: Complete JSON payload from n8n/Twilio (any structure)
        repo: Repository dependency
        
    Returns:
        dict: Success message with created record ID
    """
    try:
        # Extract required fields (with defaults)
        call_data_dict = {
            "sid": payload.get("sid", f"MISSING-SID-{payload.get('lead_id', 'UNKNOWN')}"),
            "phone_number_sid": payload.get("phone_number_sid", ""),
            "account_sid": payload.get("account_sid", ""),
            "source_trigger": payload.get("source_trigger", "unknown"),
            "direction": payload.get("direction", "unknown"),
            "duration": str(payload.get("duration", "0")),
            "start_time": payload.get("start_time", ""),
            "end_time": payload.get("end_time", ""),
            "queue_time": str(payload.get("queue_time", "0")),
            "content_lenght": str(payload.get("content_lenght", "0")),
            "conn_ip": payload.get("conn_ip", ""),
            "origin": payload.get("origin"),
            "execution_mode": payload.get("execution_mode", "unknown"),
            "status": payload.get("status", "unknown"),
            "batch_id": payload.get("batch_id", ""),
            "campaign_id": payload.get("campaign_id", ""),
            "campaign_history": payload.get("campaign_history", "[]"),
            "lead_id": payload.get("lead_id", ""),
            "lead_type": payload.get("lead_type", "unknown"),
            "called_from": payload.get("called_from", ""),
            "called_to": payload.get("called_to", ""),
            "record_summary_shared": payload.get("record_summary_shared"),
            "leads_notes": payload.get("leads_notes"),
            "meeting_booked_shared": payload.get("meeting_booked_shared"),
            "demo_booking_shared": payload.get("demo_booking_shared"),
            "date_created": payload.get("date_created", ""),
            "date_updated": payload.get("date_updated", ""),
            "raw_CD_original": payload  # Store COMPLETE original payload
        }
        
        # Create the record
        call_data = RawCallDataCreate(**call_data_dict)
        
        # Check for duplicates
        existing = await repo.get_call_by_sid(call_data.sid)
        if existing:
            return {
                "message": "Record already exists",
                "sid": call_data.sid,
                "existing_id": existing.get("id"),
                "duplicate": True
            }
        
        result = await repo.create_call_record(call_data)
        
        return {
            "message": "Call record created successfully",
            "id": result.id,
            "sid": result.sid,
            "lead_id": result.lead_id,
            "campaign_id": result.campaign_id,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error processing call data: {str(e)}"
        )


@router.get("/sid/{sid}", response_model=RawCallData)
async def get_call_by_sid(
    sid: str,
    current_user: User = Depends(get_current_user),
    repo: RawCallDataRepository = Depends(get_raw_call_data_repo)
):
    """
    Get call record by Twilio SID.
    
    Args:
        sid: Twilio call SID
        current_user: Current authenticated user
        repo: Repository dependency
        
    Returns:
        RawCallData: Call record
        
    Raises:
        HTTPException: If call record not found
    """
    call_record = await repo.get_call_by_sid(sid)
    if not call_record:
        raise HTTPException(status_code=404, detail="Call record not found")
    
    return RawCallData(**call_record)


@router.get("/lead/{lead_id}", response_model=List[RawCallData])
async def get_calls_by_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    repo: RawCallDataRepository = Depends(get_raw_call_data_repo)
):
    """
    Get all call records for a specific lead.
    
    Args:
        lead_id: Lead's unique identifier
        current_user: Current authenticated user
        repo: Repository dependency
        
    Returns:
        List[RawCallData]: List of call records
    """
    records = await repo.get_calls_by_lead_id(lead_id)
    return [RawCallData(**record) for record in records]


@router.get("/campaign/{campaign_id}", response_model=List[RawCallData])
async def get_calls_by_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    repo: RawCallDataRepository = Depends(get_raw_call_data_repo)
):
    """
    Get all call records for a specific campaign.
    
    Args:
        campaign_id: Campaign's unique identifier
        current_user: Current authenticated user
        repo: Repository dependency
        
    Returns:
        List[RawCallData]: List of call records
    """
    records = await repo.get_calls_by_campaign_id(campaign_id)
    return [RawCallData(**record) for record in records]


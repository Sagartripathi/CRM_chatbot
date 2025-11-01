"""
Campaign service for campaign management.
Handles business logic for campaign operations.
"""

from typing import List, Optional
from fastapi import HTTPException, status, UploadFile
import csv
import io
from app.models import (
    Campaign, CampaignCreate, CampaignUpdate, CampaignLead, CallLog, CallLogCreate,
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
            current_user.id, current_user.role, current_user.client_id
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
    
    async def update_campaign(self, campaign_id: str, campaign_data: CampaignUpdate, current_user: User) -> Campaign:
        """
        Update campaign information.
        
        Args:
            campaign_id: Campaign's unique identifier
            campaign_data: Updated campaign data (partial update supported)
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
    
    async def upload_campaigns_csv(
        self,
        file: UploadFile,
        current_user: User,
        client_id: str,
        agent_id: str
    ) -> dict:
        """
        Upload campaigns from CSV file.
        
        Args:
            file: CSV file upload
            current_user: Current authenticated user
            client_id: Client ID to assign to all campaigns
            agent_id: Agent ID to assign to all campaigns
            
        Returns:
            dict: Upload results with statistics
            
        Raises:
            HTTPException: If file format is invalid or required columns missing
        """
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail=f"File must be a CSV file. Received: {file.filename}")
        
        # Validate client_id and agent_id
        allowed_clients = ['CLI-00001', 'CLI-00002', 'CLI-00003']
        if client_id not in allowed_clients:
            raise HTTPException(
                status_code=400,
                detail=f"client_id must be one of: {', '.join(allowed_clients)}"
            )
        
        allowed_agents = ['AGE-00001', 'AGE-00002', 'AGE-00003']
        if agent_id not in allowed_agents:
            raise HTTPException(
                status_code=400,
                detail=f"agent_id must be one of: {', '.join(allowed_agents)}"
            )
        
        # Read CSV content with multiple encoding support
        try:
            contents = await file.read()
            
            # Try different encodings
            decoded = None
            encodings_to_try = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
            
            for encoding in encodings_to_try:
                try:
                    decoded = contents.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if decoded is None:
                raise HTTPException(status_code=400, detail="Could not decode CSV file. Please ensure the file is saved as UTF-8 or a compatible encoding.")
            
            csv_reader = csv.DictReader(io.StringIO(decoded))
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")
        
        # Validate required columns
        required_columns = {'campaign_name', 'campaign_description'}
        if not required_columns.issubset(set(csv_reader.fieldnames or [])):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )
        
        created_campaigns = []
        skipped_campaigns = []
        errors = []
        
        # Valid timezone values
        valid_timezones = [
            'America/New_York', 'America/Chicago', 'America/Denver',
            'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
            'America/Toronto', 'America/Winnipeg', 'America/Edmonton',
            'America/Vancouver'
        ]
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validate required fields
                if not row.get('campaign_name') or not row['campaign_name'].strip():
                    errors.append(f"Row {row_num}: campaign_name is required")
                    continue
                
                if not row.get('campaign_description') or not row['campaign_description'].strip():
                    errors.append(f"Row {row_num}: campaign_description is required")
                    continue
                
                # Validate timezone if provided
                timezone_shared = row.get('timezone_shared', '').strip()
                if timezone_shared and timezone_shared not in valid_timezones:
                    errors.append(f"Row {row_num}: Invalid timezone '{timezone_shared}'. Must be one of: {', '.join(valid_timezones)}")
                    continue
                
                # Parse is_active
                is_active = False
                if row.get('is_active'):
                    is_active_str = str(row.get('is_active', '')).lower().strip()
                    if is_active_str in ['true', '1', 'yes']:
                        is_active = True
                    elif is_active_str in ['false', '0', 'no', '']:
                        is_active = False
                    else:
                        errors.append(f"Row {row_num}: Invalid is_active value '{row.get('is_active')}'. Must be true/false")
                        continue
                
                # Parse call scheduling fields
                start_call = row.get('start_call', '').strip() or None
                call_created_at = row.get('call_created_at', '').strip() or None
                call_updated_at = row.get('call_updated_at', '').strip() or None
                
                # Validate datetime formats if provided
                if call_created_at:
                    try:
                        from datetime import datetime
                        datetime.fromisoformat(call_created_at.replace('Z', '+00:00'))
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid call_created_at format '{call_created_at}'. Use YYYY-MM-DDTHH:MM format")
                        continue
                
                if call_updated_at:
                    try:
                        from datetime import datetime
                        datetime.fromisoformat(call_updated_at.replace('Z', '+00:00'))
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid call_updated_at format '{call_updated_at}'. Use YYYY-MM-DDTHH:MM format")
                        continue
                
                # Create campaign
                campaign_data = CampaignCreate(
                    campaign_name=row['campaign_name'].strip(),
                    campaign_description=row['campaign_description'].strip(),
                    client_id=client_id,
                    agent_id=agent_id,
                    timezone_shared=timezone_shared if timezone_shared else None,
                    is_active=is_active,
                    start_call=start_call,
                    call_created_at=call_created_at,
                    call_updated_at=call_updated_at,
                    lead_ids=[]  # No leads from CSV, can be added later
                )
                
                campaign = await self.campaign_repo.create_campaign(campaign_data, current_user.id)
                created_campaigns.append(campaign.dict() if hasattr(campaign, 'dict') else campaign)
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Upload complete: {len(created_campaigns)} campaigns created",
            "created_count": len(created_campaigns),
            "skipped_count": len(skipped_campaigns),
            "error_count": len(errors),
            "client_id": client_id,
            "agent_id": agent_id,
            "created_campaigns": created_campaigns[:10],  # Return first 10 for preview
            "skipped": skipped_campaigns[:10],
            "errors": errors[:10]
        }

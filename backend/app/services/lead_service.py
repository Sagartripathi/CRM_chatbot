"""
Lead service for lead management.
Handles business logic for lead operations.
"""

from typing import List, Optional
from fastapi import HTTPException, status, UploadFile
import csv
import io
from app.models import Lead, LeadCreate, User, UserRole, LeadStatus
from app.repositories import LeadRepository, UserRepository, CampaignRepository


class LeadService:
    """
    Service for lead management.
    Handles business logic for lead operations.
    """
    
    def __init__(self, lead_repository: LeadRepository, user_repository: UserRepository, campaign_repository: CampaignRepository):
        """
        Initialize lead service.
        
        Args:
            lead_repository: Lead repository instance
            user_repository: User repository instance
            campaign_repository: Campaign repository instance
        """
        self.lead_repo = lead_repository
        self.user_repo = user_repository
        self.campaign_repo = campaign_repository
    
    async def create_lead(self, lead_data: LeadCreate, current_user: User) -> Lead:
        """
        Create a new lead.
        
        Args:
            lead_data: Lead creation data
            current_user: Current authenticated user
            
        Returns:
            Lead: The created lead object
            
        Raises:
            HTTPException: If duplicate lead exists
        """
        # Check for duplicates by email or phone
        duplicate_lead = await self.lead_repo.check_duplicate_lead(
            email=lead_data.lead_email,
            phone=lead_data.lead_phone
        )
        
        if duplicate_lead:
            raise HTTPException(
                status_code=400, 
                detail="Lead with this email or phone already exists"
            )
        
        return await self.lead_repo.create_lead(lead_data, current_user.id)
    
    async def get_leads(
        self,
        current_user: User,
        status: Optional[LeadStatus] = None,
        source: Optional[str] = None,
        assigned_to: Optional[str] = None
    ) -> List[Lead]:
        """
        Get leads with role-based filtering.
        
        Args:
            current_user: Current authenticated user
            status: Filter by lead status
            source: Filter by lead source
            assigned_to: Filter by assigned user
            
        Returns:
            List[Lead]: List of lead objects
        """
        query_filter = {}
        
        # Role-based filtering - REMOVED to show ALL leads from database
        # All users (ADMIN, CLIENT, AGENT) will see all leads
        # Only apply optional assigned_to filter if specified by ADMIN
        if assigned_to and current_user.role == UserRole.ADMIN:
            query_filter["assigned_to"] = assigned_to
        
        leads = await self.lead_repo.get_leads_by_filters(
            status=status,
            source=source,
            query_filter=query_filter
        )
        
        # Log the number of leads retrieved from database
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Retrieved {len(leads)} leads from database for user {current_user.id} (role: {current_user.role})")
        
        # Convert leads to Lead models with error handling
        valid_leads = []
        
        for idx, lead_dict in enumerate(leads):
            try:
                # Ensure required fields have defaults if missing
                if not lead_dict.get("lead_type"):
                    lead_dict["lead_type"] = "individual"
                if not lead_dict.get("campaign_name"):
                    lead_dict["campaign_name"] = lead_dict.get("name", "Unknown Campaign")
                if not lead_dict.get("campaign_id"):
                    lead_dict["campaign_id"] = ""
                if not lead_dict.get("created_by"):
                    lead_dict["created_by"] = ""
                if not lead_dict.get("id"):
                    import uuid
                    lead_dict["id"] = str(uuid.uuid4())
                if not lead_dict.get("lead_id"):
                    import uuid
                    lead_dict["lead_id"] = f"L-{uuid.uuid4().hex[:7].upper()}"
                
                # Normalize status to lowercase if it's a string, but preserve null
                if "status" in lead_dict and lead_dict["status"] is not None:
                    if isinstance(lead_dict["status"], str):
                        lead_dict["status"] = lead_dict["status"].lower()
                # Keep null status as null
                
                # Normalize lead_type to lowercase if it's a string
                if "lead_type" in lead_dict and isinstance(lead_dict["lead_type"], str):
                    lead_dict["lead_type"] = lead_dict["lead_type"].lower()
                
                # Normalize source to lowercase if present
                if "source" in lead_dict and isinstance(lead_dict["source"], str):
                    lead_dict["source"] = lead_dict["source"].lower()
                
                # For organization leads, ensure null values are properly set (not missing keys)
                # This prevents Pydantic from raising validation errors
                if lead_dict.get("lead_type") == "organization":
                    # Ensure optional individual fields are explicitly set to None if missing/null
                    if "lead_first_name" not in lead_dict or lead_dict.get("lead_first_name") is None:
                        lead_dict["lead_first_name"] = None
                    if "lead_last_name" not in lead_dict or lead_dict.get("lead_last_name") is None:
                        lead_dict["lead_last_name"] = None
                    if "lead_phone" not in lead_dict or lead_dict.get("lead_phone") is None:
                        lead_dict["lead_phone"] = None
                    if "lead_email" not in lead_dict or lead_dict.get("lead_email") is None:
                        lead_dict["lead_email"] = None
                    if "leads_notes" not in lead_dict or lead_dict.get("leads_notes") is None:
                        lead_dict["leads_notes"] = None
                
                # Ensure batch_id is always a string (not None)
                if lead_dict.get("batch_id") is None:
                    lead_dict["batch_id"] = ""
                # updated_at_shared can be None (it's Optional in the model)
                # If it's None or missing, keep it as None
                if "updated_at_shared" not in lead_dict:
                    lead_dict["updated_at_shared"] = None
                
                valid_leads.append(Lead(**lead_dict))
            except Exception as e:
                # Log the error with detailed information including the lead data
                lead_id = lead_dict.get('id', 'unknown')
                lead_lead_id = lead_dict.get('lead_id', 'unknown')
                campaign_name = lead_dict.get('campaign_name', 'N/A')
                lead_type = lead_dict.get('lead_type', 'N/A')
                logger.error(
                    f"Error converting lead {idx + 1}/{len(leads)} to Lead model: {str(e)}",
                    extra={
                        "lead_id": lead_id,
                        "lead_lead_id": lead_lead_id,
                        "campaign_name": campaign_name,
                        "lead_type": lead_type,
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "lead_keys": list(lead_dict.keys()),
                        "lead_dict_sample": {k: v for k, v in list(lead_dict.items())[:10]}  # First 10 fields for debugging
                    }
                )
                # Continue to next lead instead of failing the entire request
                continue
        
        if len(valid_leads) < len(leads):
            skipped_count = len(leads) - len(valid_leads)
            logger.warning(f"Skipped {skipped_count} invalid leads out of {len(leads)} total")
        
        logger.info(f"Returning {len(valid_leads)} valid leads to frontend (filtered from {len(leads)} database leads)")
        
        return valid_leads
    
    async def get_lead_by_id(self, lead_id: str, current_user: User) -> Lead:
        """
        Get lead by ID with permission check.
        
        Args:
            lead_id: Lead's unique identifier
            current_user: Current authenticated user
            
        Returns:
            Lead: Lead object
            
        Raises:
            HTTPException: If lead not found or access denied
        """
        lead = await self.lead_repo.get_lead_by_id(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Check permissions
        if (current_user.role == UserRole.AGENT and lead["assigned_to"] != current_user.id and lead["assigned_to"] is not None) or \
           (current_user.role == UserRole.CLIENT and lead["created_by"] != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this lead")
        
        return Lead(**lead)
    
    async def update_lead(self, lead_id: str, lead_data: LeadCreate, current_user: User) -> Lead:
        """
        Update lead information.
        
        Args:
            lead_id: Lead's unique identifier
            lead_data: Updated lead data
            current_user: Current authenticated user
            
        Returns:
            Lead: Updated lead object
            
        Raises:
            HTTPException: If lead not found, access denied, or duplicate exists
        """
        # Find existing lead
        existing_lead = await self.lead_repo.get_lead_by_id(lead_id)
        if not existing_lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Check permissions
        if current_user.role == UserRole.AGENT:
            # Agents can only update leads assigned to them
            if existing_lead["assigned_to"] != current_user.id and existing_lead["assigned_to"] is not None:
                raise HTTPException(status_code=403, detail="Not authorized to update this lead")
        elif current_user.role == UserRole.CLIENT:
            # Clients can update leads from campaigns with their client_id
            client_id = getattr(current_user, 'client_id', None)
            if client_id:
                # Get the campaign for this lead to check client_id
                campaign_name = existing_lead.get("campaign_name")
                if campaign_name:
                    # Find campaign by name and check client_id
                    campaign = await self.campaign_repo.campaigns.find_one({"campaign_name": campaign_name})
                    if not campaign or campaign.get("client_id") != client_id:
                        raise HTTPException(status_code=403, detail="Not authorized to update this lead")
                else:
                    raise HTTPException(status_code=403, detail="Not authorized to update this lead")
            else:
                # Fallback: clients can only update leads they created
                if existing_lead["created_by"] != current_user.id:
                    raise HTTPException(status_code=403, detail="Not authorized to update this lead")
        
        # Check for duplicates (excluding current lead)
        if lead_data.lead_email and lead_data.lead_email != existing_lead.get("email"):
            duplicate = await self.lead_repo.check_duplicate_lead(email=lead_data.lead_email)
            if duplicate and duplicate["id"] != lead_id:
                raise HTTPException(status_code=400, detail="Lead with this email already exists")
        
        if lead_data.lead_phone and lead_data.lead_phone != existing_lead.get("phone"):
            duplicate = await self.lead_repo.check_duplicate_lead(phone=lead_data.lead_phone)
            if duplicate and duplicate["id"] != lead_id:
                raise HTTPException(status_code=400, detail="Lead with this phone already exists")
        
        # Update lead
        updated_lead = await self.lead_repo.update_lead(lead_id, lead_data.dict())
        return Lead(**updated_lead)
    
    async def delete_lead(self, lead_id: str, current_user: User) -> dict:
        """
        Delete a lead.
        
        Args:
            lead_id: Lead's unique identifier
            current_user: Current authenticated user
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If lead not found, access denied, or lead is in active campaigns
        """
        # Find existing lead
        existing_lead = await self.lead_repo.get_lead_by_id(lead_id)
        if not existing_lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Check permissions (only admin and agents can delete, clients cannot delete)
        if current_user.role == UserRole.CLIENT:
            raise HTTPException(status_code=403, detail="Clients are not authorized to delete leads")
        
        if current_user.role != UserRole.ADMIN and existing_lead["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this lead")
        
        # Check if lead is part of active campaigns
        # Note: This would require campaign repository access
        # For now, we'll skip this check in the service layer
        
        # Delete the lead
        await self.lead_repo.delete_lead(lead_id)
        
        return {"message": "Lead deleted successfully"}
    
    async def upload_leads_csv(
        self,
        file: UploadFile,
        current_user: User,
        campaign_id: Optional[str] = None
    ) -> dict:
        """
        Upload leads from CSV file.
        
        Args:
            file: CSV file upload
            current_user: Current authenticated user
            campaign_id: Campaign ID to assign all leads to (now mandatory)
            
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
        
        # Check content type as additional validation
        if file.content_type and file.content_type not in ['text/csv', 'application/csv', 'text/plain']:
            # Don't fail on content type alone, just log it
            pass
        
        # Validate campaign_id is provided
        if not campaign_id:
            raise HTTPException(status_code=400, detail="Campaign ID is required for CSV upload")
        
        # Validate campaign exists
        campaign = await self.campaign_repo.get_campaign_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID '{campaign_id}' not found")
        
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
        required_columns = {'lead_type', 'status'}
        if not required_columns.issubset(set(csv_reader.fieldnames or [])):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )
        
        # Check for individual or organization specific columns
        individual_columns = {'first_name', 'last_name', 'phone'}
        organization_columns = {'business_name', 'business_phone', 'business_address'}
        
        # Validate that we have either individual or organization columns
        has_individual = any(col in csv_reader.fieldnames for col in individual_columns)
        has_organization = any(col in csv_reader.fieldnames for col in organization_columns)
        
        if not (has_individual or has_organization):
            raise HTTPException(
                status_code=400,
                detail="CSV must contain either individual fields (first_name, last_name, phone) or organization fields (business_name, business_phone, business_address)"
            )
        
        created_leads = []
        skipped_leads = []
        errors = []
        
        # Valid status values from LeadStatus enum
        valid_statuses = ['new', 'ready', 'pending_preview', 'previewed', 'lost', 'no_response', 'converted']
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validate lead_type
                lead_type = row['lead_type'].lower()
                if lead_type not in ['individual', 'organization']:
                    errors.append(f"Row {row_num}: Invalid lead_type '{row['lead_type']}'. Must be 'individual' or 'organization'")
                    continue
                
                # Validate status
                status_value = row['status'].lower()
                if status_value not in valid_statuses:
                    errors.append(f"Row {row_num}: Invalid status '{row['status']}'. Must be one of: {', '.join(valid_statuses)}")
                    continue
                
                # Validate required fields based on lead type
                if lead_type == 'individual':
                    if not row.get('first_name') or not row.get('last_name') or not row.get('phone'):
                        errors.append(f"Row {row_num}: Individual leads require first_name, last_name, and phone")
                        continue
                elif lead_type == 'organization':
                    if not row.get('business_name') or not row.get('business_phone') or not row.get('business_address'):
                        errors.append(f"Row {row_num}: Organization leads require business_name, business_phone, and business_address")
                        continue
                
                # Check for duplicates
                duplicate_lead = await self.lead_repo.check_duplicate_lead(
                    email=row.get('email') or row.get('lead_email'),
                    phone=row.get('phone') or row.get('lead_phone') or row.get('business_phone')
                )
                
                if duplicate_lead:
                    skipped_leads.append({
                        "row": row_num,
                        "reason": f"Duplicate: {row.get('email') or row.get('lead_email') or row.get('phone') or row.get('lead_phone') or row.get('business_phone')}"
                    })
                    continue
                
                # Create lead with proper LeadCreate model based on type
                if lead_type == 'individual':
                    lead_data = LeadCreate(
                        # Required fields
                        lead_type="individual",
                        campaign_name=campaign.get('campaign_name', campaign.get('name', '')),
                        campaign_id=campaign_id,
                        
                        # Individual lead fields
                        lead_first_name=row['first_name'],
                        lead_last_name=row['last_name'],
                        lead_phone=row.get('phone'),
                        lead_email=row.get('email') or row.get('lead_email'),
                        leads_notes=row.get('leads_notes') or row.get('notes'),
                        
                        # Legacy fields for backward compatibility
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        phone=row.get('phone'),
                        email=row.get('email') or row.get('lead_email'),
                        notes=row.get('leads_notes') or row.get('notes'),
                        status=status_value,
                        source="csv_upload"
                    )
                else:  # organization
                    lead_data = LeadCreate(
                        # Required fields
                        lead_type="organization",
                        campaign_name=campaign.get('campaign_name', campaign.get('name', '')),
                        campaign_id=campaign_id,
                        
                        # Organization lead fields
                        business_name=row['business_name'],
                        business_phone=row['business_phone'],
                        business_address=row['business_address'],
                        business_summary=row.get('business_summary') or row.get('notes'),
                        
                        # Legacy fields for backward compatibility
                        first_name="",  # Empty for organization
                        last_name="",  # Empty for organization
                        phone=row['business_phone'],
                        email=row.get('email') or row.get('lead_email'),
                        notes=row.get('business_summary') or row.get('notes'),
                        status=status_value,
                        source="csv_upload"
                    )
                
                lead = await self.lead_repo.create_lead(lead_data, current_user.id)
                created_leads.append(lead.dict())
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Upload complete: {len(created_leads)} leads created and assigned to campaign '{campaign.get('campaign_name', campaign.get('name', campaign_id))}'",
            "created_count": len(created_leads),
            "skipped_count": len(skipped_leads),
            "error_count": len(errors),
            "campaign_id": campaign_id,
            "campaign_name": campaign.get('campaign_name', campaign.get('name', '')),
            "created_leads": created_leads[:10],  # Return first 10 for preview
            "skipped": skipped_leads[:10],
            "errors": errors[:10]
        }
    
    async def update_lead_campaign(
        self,
        lead_id: str,
        campaign_id: Optional[str],
        current_user: User
    ) -> Lead:
        """
        Update lead's campaign assignment.
        
        Args:
            lead_id: Lead's unique identifier
            campaign_id: New campaign ID (None to remove assignment)
            current_user: Current authenticated user
            
        Returns:
            Lead: Updated lead object
            
        Raises:
            HTTPException: If lead not found or access denied
        """
        # Find existing lead
        existing_lead = await self.lead_repo.get_lead_by_id(lead_id)
        if not existing_lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Check permissions
        if current_user.role != UserRole.ADMIN and existing_lead["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this lead")
        
        # Update lead campaign
        updated_lead = await self.lead_repo.update_lead_campaign(
            lead_id, campaign_id, current_user.id
        )
        
        return Lead(**updated_lead)

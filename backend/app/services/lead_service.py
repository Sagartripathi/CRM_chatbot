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
        
        # Role-based filtering
        if current_user.role == UserRole.AGENT:
            # Agents can see leads assigned to them OR unassigned leads
            query_filter["$or"] = [
                {"assigned_to": current_user.id},
                {"assigned_to": None}
            ]
        elif current_user.role == UserRole.CLIENT:
            query_filter["created_by"] = current_user.id
        
        # Additional filters
        if assigned_to and current_user.role == UserRole.ADMIN:
            query_filter["assigned_to"] = assigned_to
        
        leads = await self.lead_repo.get_leads_by_filters(
            status=status,
            source=source,
            query_filter=query_filter
        )
        
        return [Lead(**lead) for lead in leads]
    
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
        if (current_user.role == UserRole.AGENT and existing_lead["assigned_to"] != current_user.id and existing_lead["assigned_to"] is not None) or \
           (current_user.role == UserRole.CLIENT and existing_lead["created_by"] != current_user.id):
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
        
        # Check permissions (only creator or admin can delete)
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
        # Debug information
        print(f"Debug - File details:")
        print(f"  Filename: {file.filename}")
        print(f"  Content-Type: {file.content_type}")
        print(f"  Size: {file.size if hasattr(file, 'size') else 'Unknown'}")
        
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail=f"File must be a CSV file. Received: {file.filename}")
        
        # Check content type as additional validation
        if file.content_type and file.content_type not in ['text/csv', 'application/csv', 'text/plain']:
            # Don't fail on content type alone, just log it
            print(f"Warning: Unexpected content type {file.content_type} for file {file.filename}")
        
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
            print(f"Debug - File contents length: {len(contents)} bytes")
            
            # Try different encodings
            decoded = None
            encodings_to_try = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
            
            for encoding in encodings_to_try:
                try:
                    decoded = contents.decode(encoding)
                    print(f"Debug - Successfully decoded with {encoding}")
                    break
                except UnicodeDecodeError:
                    print(f"Debug - Failed to decode with {encoding}")
                    continue
            
            if decoded is None:
                raise HTTPException(status_code=400, detail="Could not decode CSV file. Please ensure the file is saved as UTF-8 or a compatible encoding.")
            
            print(f"Debug - Decoded content preview: {decoded[:200]}...")
            
            csv_reader = csv.DictReader(io.StringIO(decoded))
            print(f"Debug - CSV fieldnames: {csv_reader.fieldnames}")
            
        except Exception as e:
            print(f"Debug - Error reading file: {str(e)}")
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

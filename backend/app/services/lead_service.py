"""
Lead service for lead management.
Handles business logic for lead operations.
"""

from typing import List, Optional
from fastapi import HTTPException, status, UploadFile
import csv
import io
from app.models import Lead, LeadCreate, User, UserRole, LeadStatus
from app.repositories import LeadRepository, UserRepository


class LeadService:
    """
    Service for lead management.
    Handles business logic for lead operations.
    """
    
    def __init__(self, lead_repository: LeadRepository, user_repository: UserRepository):
        """
        Initialize lead service.
        
        Args:
            lead_repository: Lead repository instance
            user_repository: User repository instance
        """
        self.lead_repo = lead_repository
        self.user_repo = user_repository
    
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
            email=lead_data.email,
            phone=lead_data.phone
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
        if lead_data.email and lead_data.email != existing_lead.get("email"):
            duplicate = await self.lead_repo.check_duplicate_lead(email=lead_data.email)
            if duplicate and duplicate["id"] != lead_id:
                raise HTTPException(status_code=400, detail="Lead with this email already exists")
        
        if lead_data.phone and lead_data.phone != existing_lead.get("phone"):
            duplicate = await self.lead_repo.check_duplicate_lead(phone=lead_data.phone)
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
            campaign_id: Optional campaign ID to assign leads to
            
        Returns:
            dict: Upload results with statistics
            
        Raises:
            HTTPException: If file format is invalid or required columns missing
        """
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read CSV content
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        # Validate required columns
        required_columns = {'first_name', 'last_name', 'email', 'phone', 'status'}
        if not required_columns.issubset(set(csv_reader.fieldnames or [])):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )
        
        created_leads = []
        skipped_leads = []
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Get campaign_id from CSV or parameter
                lead_campaign_id = row.get('campaign_id') or campaign_id
                
                # Validate status
                status_value = row['status'].lower()
                if status_value not in ['new', 'contacted', 'converted', 'lost', 'no_response']:
                    errors.append(f"Row {row_num}: Invalid status '{row['status']}'")
                    continue
                
                # Check for duplicates
                duplicate_lead = await self.lead_repo.check_duplicate_lead(
                    email=row.get('email'),
                    phone=row.get('phone')
                )
                
                if duplicate_lead:
                    skipped_leads.append({
                        "row": row_num,
                        "reason": f"Duplicate: {row['email'] or row['phone']}"
                    })
                    continue
                
                # Create lead
                lead_data = LeadCreate(
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    email=row.get('email') or None,
                    phone=row.get('phone') or None,
                    status=status_value,
                    campaign_id=lead_campaign_id
                )
                
                lead = await self.lead_repo.create_lead(lead_data, current_user.id)
                created_leads.append(lead.dict())
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": f"Upload complete: {len(created_leads)} leads created",
            "created_count": len(created_leads),
            "skipped_count": len(skipped_leads),
            "error_count": len(errors),
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

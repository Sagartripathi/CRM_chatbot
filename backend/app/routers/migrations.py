"""
Migration API routes.
Allows running database migrations via HTTP endpoints (useful for Render free tier).
"""

from fastapi import APIRouter, Depends, HTTPException
from app.models import User, UserRole
from app.dependencies import get_current_user
from app.database import db

# Create router with prefix
router = APIRouter(prefix="/migrations", tags=["migrations"])


@router.post("/add-record-summary-field")
async def migrate_add_record_summary_field(
    current_user: User = Depends(get_current_user)
):
    """
    Add record_summary_shared field to all existing leads.
    Only accessible by admin users.
    
    Args:
        current_user: Current authenticated user (must be admin)
        
    Returns:
        dict: Migration results with statistics
        
    Raises:
        HTTPException: If user is not admin
    """
    # Only admins can run migrations
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only administrators can run migrations")
    
    leads_collection = db.database["leads"]
    
    # Count total leads
    total_leads = await leads_collection.count_documents({})
    
    if total_leads == 0:
        return {
            "message": "No leads found in database",
            "total_leads": 0,
            "modified": 0,
            "matched": 0
        }
    
    # Add the record_summary_shared field to all leads that don't have it
    result = await leads_collection.update_many(
        {"record_summary_shared": {"$exists": False}},
        {"$set": {"record_summary_shared": None}}
    )
    
    # Verify the migration
    leads_with_field = await leads_collection.count_documents(
        {"record_summary_shared": {"$exists": True}}
    )
    
    return {
        "message": "Migration completed successfully",
        "total_leads": total_leads,
        "modified": result.modified_count,
        "matched": result.matched_count,
        "verified": leads_with_field,
        "success": leads_with_field == total_leads
    }


@router.post("/fix-lead-status-values")
async def migrate_fix_lead_status_values(
    current_user: User = Depends(get_current_user)
):
    """
    Fix lead status values from hyphen to underscore format.
    Fixes: pending-review -> pending_preview, no-response -> no_response
    Only accessible by admin users.
    
    Args:
        current_user: Current authenticated user (must be admin)
        
    Returns:
        dict: Migration results with statistics
        
    Raises:
        HTTPException: If user is not admin
    """
    # Only admins can run migrations
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only administrators can run migrations")
    
    leads_collection = db.database["leads"]
    
    # Count total leads
    total_leads = await leads_collection.count_documents({})
    
    if total_leads == 0:
        return {
            "message": "No leads found in database",
            "total_leads": 0,
            "modified": 0
        }
    
    # Fix pending-review -> pending_preview
    result1 = await leads_collection.update_many(
        {"status": "pending-review"},
        {"$set": {"status": "pending_preview"}}
    )
    
    # Fix no-response -> no_response
    result2 = await leads_collection.update_many(
        {"status": "no-response"},
        {"$set": {"status": "no_response"}}
    )
    
    total_modified = result1.modified_count + result2.modified_count
    
    # Verify - check for any remaining hyphenated statuses
    remaining_hyphenated = await leads_collection.count_documents({
        "$or": [
            {"status": "pending-review"},
            {"status": "no-response"}
        ]
    })
    
    # Get current status distribution
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_counts = await leads_collection.aggregate(pipeline).to_list(None)
    status_distribution = {item['_id']: item['count'] for item in status_counts}
    
    return {
        "message": "Migration completed successfully",
        "total_leads": total_leads,
        "modified": total_modified,
        "pending_review_fixed": result1.modified_count,
        "no_response_fixed": result2.modified_count,
        "remaining_hyphenated": remaining_hyphenated,
        "status_distribution": status_distribution,
        "success": remaining_hyphenated == 0
    }


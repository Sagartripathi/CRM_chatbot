"""
Migration script to fix lead status values from hyphen to underscore format.
Fixes: pending-review -> pending_preview, no-response -> no_response
Run this script to update all existing lead documents in MongoDB.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


async def migrate_lead_statuses():
    """Fix lead status values from hyphen to underscore format."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.db_name]
    leads_collection = db["leads"]
    
    print("Starting migration: Fixing lead status values...")
    
    # Count total leads
    total_leads = await leads_collection.count_documents({})
    print(f"Total leads in database: {total_leads}")
    
    if total_leads == 0:
        print("No leads found in database.")
        client.close()
        return
    
    # Fix pending-review -> pending_preview
    result1 = await leads_collection.update_many(
        {"status": "pending-review"},
        {"$set": {"status": "pending_preview"}}
    )
    print(f"Fixed 'pending-review' -> 'pending_preview': {result1.modified_count} documents")
    
    # Fix no-response -> no_response
    result2 = await leads_collection.update_many(
        {"status": "no-response"},
        {"$set": {"status": "no_response"}}
    )
    print(f"Fixed 'no-response' -> 'no_response': {result2.modified_count} documents")
    
    print(f"\nMigration completed successfully!")
    print(f"Total modified: {result1.modified_count + result2.modified_count} documents")
    
    # Verify the migration - check for any remaining hyphenated statuses
    remaining_hyphenated = await leads_collection.count_documents({
        "$or": [
            {"status": "pending-review"},
            {"status": "no-response"}
        ]
    })
    
    if remaining_hyphenated > 0:
        print(f"\n⚠️  WARNING: {remaining_hyphenated} leads still have hyphenated statuses!")
    else:
        print(f"\n✅ Verification: All status values are now using underscore format")
    
    # Show current status distribution
    print("\n📊 Current status distribution:")
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_counts = await leads_collection.aggregate(pipeline).to_list(None)
    for item in status_counts:
        print(f"  - {item['_id']}: {item['count']} leads")
    
    # Close the connection
    client.close()


if __name__ == "__main__":
    print("=" * 70)
    print("Lead Migration: Fix Status Values (hyphen -> underscore)")
    print("=" * 70)
    asyncio.run(migrate_lead_statuses())
    print("=" * 70)


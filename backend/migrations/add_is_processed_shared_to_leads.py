"""
Migration script to add is_processed_shared field to existing leads.
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


async def migrate_leads():
    """Add is_processed_shared field to all existing leads."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.db_name]
    leads_collection = db["leads"]
    
    print("Starting migration: Adding is_processed_shared field to leads...")
    
    # Count total leads
    total_leads = await leads_collection.count_documents({})
    print(f"Total leads to update: {total_leads}")
    
    if total_leads == 0:
        print("No leads found in database.")
        client.close()
        return
    
    # Add the is_processed_shared field to all leads that don't have it
    result = await leads_collection.update_many(
        {"is_processed_shared": {"$exists": False}},
        {"$set": {"is_processed_shared": None}}
    )
    
    print(f"Migration completed successfully!")
    print(f"Modified {result.modified_count} documents")
    print(f"Matched {result.matched_count} documents")
    
    # Verify the migration
    leads_with_field = await leads_collection.count_documents(
        {"is_processed_shared": {"$exists": True}}
    )
    print(f"\nVerification: {leads_with_field} out of {total_leads} leads now have the is_processed_shared field")
    
    # Close the connection
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Lead Migration: Add is_processed_shared field")
    print("=" * 60)
    asyncio.run(migrate_leads())
    print("=" * 60)


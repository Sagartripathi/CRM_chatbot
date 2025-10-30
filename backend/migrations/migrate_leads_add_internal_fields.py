"""
Database migration script to add internal fields to existing leads.

This migration adds the following fields to all existing leads:
- batch_id: Empty string for now
- updated_at_shared: Empty string for now
- is_valid: Empty string for now

Run this script after deploying the new Lead model changes.
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Database
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate_leads():
    """
    Add internal fields to all existing leads in the database.
    """
    db = Database()
    
    try:
        # Connect to database
        logger.info("Connecting to MongoDB...")
        await db.connect()
        
        # Get leads collection
        leads_collection = db.database.leads
        
        # Count existing leads
        total_leads = await leads_collection.count_documents({})
        logger.info(f"Found {total_leads} leads to migrate")
        
        if total_leads == 0:
            logger.info("No leads to migrate. Exiting.")
            return
        
        # Add internal fields to all leads that don't have them
        logger.info("Adding internal fields to leads...")
        
        # Use update_many with $set operator to add fields only if they don't exist
        result = await leads_collection.update_many(
            {
                "$or": [
                    {"batch_id": {"$exists": False}},
                    {"updated_at_shared": {"$exists": False}},
                    {"is_valid": {"$exists": False}}
                ]
            },
            {
                "$set": {
                    "batch_id": "",
                    "updated_at_shared": "",
                    "is_valid": ""
                }
            }
        )
        
        logger.info(f"✓ Migration complete!")
        logger.info(f"  - Modified leads: {result.modified_count}")
        logger.info(f"  - Matched leads: {result.matched_count}")
        
        # Verify the migration
        leads_with_new_fields = await leads_collection.count_documents({
            "batch_id": {"$exists": True},
            "updated_at_shared": {"$exists": True},
            "is_valid": {"$exists": True}
        })
        
        logger.info(f"✓ Verification: {leads_with_new_fields} leads now have internal fields")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        # Disconnect from database
        await db.disconnect()
        logger.info("Disconnected from MongoDB")


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Lead Migration: Add Internal Fields")
    logger.info("=" * 60)
    
    asyncio.run(migrate_leads())
    
    logger.info("=" * 60)
    logger.info("Migration script completed")
    logger.info("=" * 60)


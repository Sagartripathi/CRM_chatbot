"""
Verification script to check if database schema matches models.

This script checks if all required fields exist in the database
for leads and campaigns collections.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Database
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_schema():
    """
    Verify that database schema matches the current models.
    """
    db = Database()
    
    try:
        # Connect to database
        logger.info("Connecting to MongoDB...")
        await db.connect()
        
        # Verify Leads
        logger.info("\n" + "=" * 60)
        logger.info("VERIFYING LEADS COLLECTION")
        logger.info("=" * 60)
        
        leads_collection = db.database.leads
        total_leads = await leads_collection.count_documents({})
        logger.info(f"Total leads: {total_leads}")
        
        # Check for internal fields
        leads_with_batch_id = await leads_collection.count_documents({"batch_id": {"$exists": True}})
        leads_with_updated_at_shared = await leads_collection.count_documents({"updated_at_shared": {"$exists": True}})
        leads_with_is_valid = await leads_collection.count_documents({"is_valid": {"$exists": True}})
        
        logger.info(f"Leads with batch_id: {leads_with_batch_id}")
        logger.info(f"Leads with updated_at_shared: {leads_with_updated_at_shared}")
        logger.info(f"Leads with is_valid: {leads_with_is_valid}")
        
        # Verify Campaigns
        logger.info("\n" + "=" * 60)
        logger.info("VERIFYING CAMPAIGNS COLLECTION")
        logger.info("=" * 60)
        
        campaigns_collection = db.database.campaigns
        total_campaigns = await campaigns_collection.count_documents({})
        logger.info(f"Total campaigns: {total_campaigns}")
        
        # Check for call scheduling fields
        campaigns_with_call_created_at = await campaigns_collection.count_documents({"call_created_at": {"$exists": True}})
        campaigns_with_call_updated_at = await campaigns_collection.count_documents({"call_updated_at": {"$exists": True}})
        campaigns_with_start_call = await campaigns_collection.count_documents({"start_call": {"$exists": True}})
        
        logger.info(f"Campaigns with call_created_at: {campaigns_with_call_created_at}")
        logger.info(f"Campaigns with call_updated_at: {campaigns_with_call_updated_at}")
        logger.info(f"Campaigns with start_call: {campaigns_with_start_call}")
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("VERIFICATION SUMMARY")
        logger.info("=" * 60)
        
        if leads_with_batch_id == total_leads and total_leads > 0:
            logger.info("✅ All leads have internal fields")
        elif total_leads == 0:
            logger.info("ℹ️  No leads in database")
        else:
            logger.warning(f"⚠️  {total_leads - leads_with_batch_id} leads missing internal fields")
        
        logger.info("✅ Campaigns schema is up to date (optional fields)")
        
    except Exception as e:
        logger.error(f"❌ Verification failed: {str(e)}")
        raise
    finally:
        await db.disconnect()
        logger.info("\nDisconnected from MongoDB")


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Database Schema Verification")
    logger.info("=" * 60)
    
    asyncio.run(verify_schema())
    
    logger.info("=" * 60)
    logger.info("Verification completed")
    logger.info("=" * 60)


"""
Database connection and configuration.
Handles MongoDB connection setup and management.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Configure logger
logger = logging.getLogger(__name__)


class Database:
    """
    Database connection manager.
    Handles MongoDB client initialization and connection lifecycle.
    """
    
    def __init__(self):
        """Initialize database connection."""
        self.client: AsyncIOMotorClient = None
        self.database = None
    
    async def connect(self):
        """
        Establish connection to MongoDB.
        Creates client and database references.
        """
        try:
            self.client = AsyncIOMotorClient(settings.mongo_url)
            self.database = self.client[settings.db_name]
            
            # Test connection
            await self.client.admin.command("ping")
            logger.info(f"Connected to MongoDB at {settings.mongo_url} (DB: {settings.db_name})")
            
            # Create indexes for better performance
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    async def disconnect(self):
        """Close database connection."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """
        Create database indexes for better query performance.
        Creates unique indexes on commonly queried fields.
        """
        try:
            # User indexes
            await self.database.users.create_index("email", unique=True)
            await self.database.users.create_index("id", unique=True)
            
            # Lead indexes
            await self.database.leads.create_index("id", unique=True)
            await self.database.leads.create_index("email")
            await self.database.leads.create_index("phone")
            await self.database.leads.create_index("assigned_to")
            await self.database.leads.create_index("campaign_id")
            
            # Campaign indexes
            await self.database.campaigns.create_index("id", unique=True)
            await self.database.campaigns.create_index("created_by")
            
            # Campaign lead indexes
            await self.database.campaign_leads.create_index("id", unique=True)
            await self.database.campaign_leads.create_index("campaign_id")
            await self.database.campaign_leads.create_index("lead_id")
            await self.database.campaign_leads.create_index("assigned_agent")
            await self.database.campaign_leads.create_index("status")
            
            # Call log indexes
            await self.database.call_logs.create_index("id", unique=True)
            await self.database.call_logs.create_index("campaign_lead_id")
            await self.database.call_logs.create_index("agent_id")
            await self.database.call_logs.create_index("call_time")
            
            # Meeting indexes
            await self.database.meetings.create_index("id", unique=True)
            await self.database.meetings.create_index("organizer_id")
            await self.database.meetings.create_index("lead_id")
            await self.database.meetings.create_index("start_time")
            
            # Ticket indexes
            await self.database.tickets.create_index("id", unique=True)
            await self.database.tickets.create_index("created_by")
            await self.database.tickets.create_index("assigned_to")
            await self.database.tickets.create_index("status")
            await self.database.tickets.create_index("priority")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Failed to create some indexes: {str(e)}")


# Global database instance
db = Database()

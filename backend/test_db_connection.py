#!/usr/bin/env python3
"""
Test script to verify MongoDB connection.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def test_connection():
    """Test MongoDB connection."""
    try:
        print(f"Testing connection to: {settings.mongo_url}")
        print(f"Database name: {settings.db_name}")
        
        # Add SSL configuration for MongoDB Atlas
        import ssl
        
        # Configure SSL context for MongoDB Atlas
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Create client with SSL configuration
        client = AsyncIOMotorClient(
            settings.mongo_url,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        
        # Test connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful!")
        
        # Test database access
        db = client[settings.db_name]
        collections = await db.list_collection_names()
        print(f"✅ Database '{settings.db_name}' accessible!")
        print(f"Collections: {collections}")
        
        # Test users collection
        users_collection = db.users
        user_count = await users_collection.count_documents({})
        print(f"✅ Users collection accessible! Count: {user_count}")
        
        # Try to insert a test user
        test_user = {
            "id": "test-123",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "role": "client",
            "is_active": True,
            "created_at": "2025-10-17T17:00:00Z",
            "updated_at": "2025-10-17T17:00:00Z",
            "password": "hashed_password"
        }
        
        result = await users_collection.insert_one(test_user)
        print(f"✅ Test user inserted! ID: {result.inserted_id}")
        
        # Clean up test user
        await users_collection.delete_one({"id": "test-123"})
        print("✅ Test user cleaned up!")
        
        client.close()
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())

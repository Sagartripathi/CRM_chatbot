#!/usr/bin/env python3
"""
Simple MongoDB Atlas connection test with minimal configuration.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_simple_connection():
    """Test MongoDB Atlas connection with minimal SSL configuration."""
    
    # MongoDB Atlas connection string
    mongo_url = "mongodb+srv://crm_admin:m8PA5zJBItAFYvcL@crm-db-cluster.nifzfbd.mongodb.net/?retryWrites=true&w=majority&appName=crm-db-cluster"
    
    print("🔍 Testing Simple MongoDB Atlas Connection")
    print("=" * 50)
    print(f"MongoDB URL: {mongo_url}")
    print()
    
    try:
        # Test 1: Minimal connection
        print("Test 1: Minimal connection (no SSL options)")
        client = AsyncIOMotorClient(mongo_url)
        await client.admin.command("ping")
        print("✅ Connection successful!")
        
        # Test 2: With basic SSL options
        print("\nTest 2: With basic SSL options")
        client2 = AsyncIOMotorClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
        await client2.admin.command("ping")
        print("✅ Connection with SSL options successful!")
        
        # Test 3: Access database
        print("\nTest 3: Access database")
        db = client2["crm_admin"]
        collections = await db.list_collection_names()
        print(f"✅ Database access successful! Collections: {collections}")
        
        client.close()
        client2.close()
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_simple_connection())
    if result:
        print("\n🎉 All tests passed! MongoDB Atlas connection is working.")
    else:
        print("\n💥 Connection failed. Check your MongoDB Atlas configuration.")

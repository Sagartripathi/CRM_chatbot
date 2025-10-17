#!/usr/bin/env python3
"""
Test your specific MongoDB Atlas connection string.
Replace <db_password> with your actual password.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_your_atlas_connection():
    """Test your specific MongoDB Atlas connection."""
    
    # Replace <db_password> with your actual password
    # URL encode special characters: @ → %40, ! → %21, # → %23, $ → %24, % → %25
    mongo_url = "mongodb+srv://crm_admin:<db_password>@crm-db-cluster.nifzfbd.mongodb.net/?retryWrites=true&w=majority&appName=crm-db-cluster"
    
    print("🔍 Testing your MongoDB Atlas connection...")
    print(f"URL: {mongo_url}")
    print("=" * 80)
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(
            mongo_url,
            tls=True,
            tlsAllowInvalidCertificates=True,
            connectTimeoutMS=30000,
            serverSelectionTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=10,
            retryWrites=True
        )
        
        # Test connection
        print("🔄 Testing connection...")
        await client.admin.command("ping")
        print("✅ Connection successful!")
        
        # Get database info
        db = client["crm_db"]
        collections = await db.list_collection_names()
        
        print(f"📊 Database: {db.name}")
        print(f"📁 Collections: {len(collections)}")
        if collections:
            print(f"   {', '.join(collections)}")
        else:
            print("   (No collections found)")
        
        print("\n🎉 Your MongoDB Atlas connection is working!")
        print("✅ Ready to update Render MONGO_URL environment variable")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Replace <db_password> with your actual password")
        print("2. URL encode special characters in password")
        print("3. Check MongoDB Atlas cluster is running")
        print("4. Verify IP is whitelisted in Atlas Network Access")
        return False
    
    finally:
        if 'client' in locals():
            client.close()

def main():
    """Main function."""
    print("🚀 MongoDB Atlas Connection Test")
    print("=" * 80)
    print("⚠️  IMPORTANT: Replace <db_password> with your actual password!")
    print("=" * 80)
    
    try:
        result = asyncio.run(test_your_atlas_connection())
        if result:
            print("\n✅ Test passed! Update Render with this connection string.")
        else:
            print("\n❌ Fix connection issues before deploying.")
    except KeyboardInterrupt:
        print("\n👋 Test cancelled")
    except Exception as e:
        print(f"\n❌ Test error: {e}")

if __name__ == "__main__":
    main()

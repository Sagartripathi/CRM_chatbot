#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test Script
Test your MongoDB Atlas connection string before deploying to production.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_mongodb_connection():
    """Test MongoDB Atlas connection with the provided connection string."""
    
    # Get connection string from environment or user input
    mongo_url = os.getenv("MONGO_URL")
    
    if not mongo_url:
        print("❌ MONGO_URL not found in environment variables.")
        print("\nPlease provide your MongoDB Atlas connection string:")
        print("Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority")
        mongo_url = input("MONGO_URL: ").strip()
        
        if not mongo_url:
            print("❌ No connection string provided. Exiting.")
            return False
    
    print(f"🔍 Testing connection to: {mongo_url}")
    print("=" * 60)
    
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
        
        # Test basic operations
        print("\n🔄 Testing basic operations...")
        
        # Test users collection
        users_count = await db.users.count_documents({})
        print(f"👥 Users collection: {users_count} documents")
        
        # Test leads collection
        leads_count = await db.leads.count_documents({})
        print(f"📋 Leads collection: {leads_count} documents")
        
        print("\n✅ All tests passed! Your MongoDB Atlas connection is working.")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check your MongoDB Atlas cluster is running")
        print("2. Verify username and password are correct")
        print("3. Ensure your IP is whitelisted in Atlas Network Access")
        print("4. Check that the cluster hostname is correct")
        print("5. URL encode special characters in password (@ → %40, ! → %21)")
        return False
    
    finally:
        if 'client' in locals():
            client.close()

def main():
    """Main function to run the connection test."""
    print("🚀 MongoDB Atlas Connection Test")
    print("=" * 60)
    
    try:
        result = asyncio.run(test_mongodb_connection())
        if result:
            print("\n🎉 Ready for production deployment!")
        else:
            print("\n⚠️  Fix connection issues before deploying to production.")
    except KeyboardInterrupt:
        print("\n👋 Test cancelled by user")
    except Exception as e:
        print(f"\n❌ Test error: {e}")

if __name__ == "__main__":
    main()

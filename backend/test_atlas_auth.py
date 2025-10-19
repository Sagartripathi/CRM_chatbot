#!/usr/bin/env python3
"""
MongoDB Atlas Authentication Test Script
Test your MongoDB Atlas connection with proper authentication.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_atlas_authentication():
    """Test MongoDB Atlas authentication with detailed error reporting."""
    
    print("🔍 MongoDB Atlas Authentication Test")
    print("=" * 60)
    
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
    
    print(f"🔗 Testing connection to: {mongo_url[:50]}...")
    print("=" * 60)
    
    try:
        # Create MongoDB client with authentication
        print("🔄 Creating MongoDB client...")
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
        
        # Test basic connection
        print("🔄 Testing basic connection...")
        await client.admin.command("ping")
        print("✅ Basic connection successful!")
        
        # Test database access
        print("🔄 Testing database access...")
        db = client["crm_db"]
        
        # List collections to test read access
        collections = await db.list_collection_names()
        print(f"✅ Database access successful!")
        print(f"📁 Collections found: {len(collections)}")
        if collections:
            print(f"   {', '.join(collections)}")
        else:
            print("   (No collections found - this is normal for new databases)")
        
        # Test write access
        print("🔄 Testing write access...")
        test_collection = db["auth_test"]
        test_doc = {"test": "authentication", "timestamp": "2024-01-01"}
        
        # Insert test document
        result = await test_collection.insert_one(test_doc)
        print(f"✅ Write access successful! Document ID: {result.inserted_id}")
        
        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        print("🧹 Test document cleaned up")
        
        print("\n🎉 All authentication tests passed!")
        print("✅ Your MongoDB Atlas connection is working correctly")
        print("✅ Username and password are correct")
        print("✅ User has proper read/write permissions")
        print("✅ Database access is working")
        
        return True
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Authentication failed: {error_msg}")
        
        print("\n🔧 Troubleshooting based on error:")
        
        if "authentication failed" in error_msg.lower():
            print("1. ❌ Username or password is incorrect")
            print("   - Check username: crm_admin")
            print("   - Verify password is correct")
            print("   - Ensure password is URL encoded (special characters)")
            print("   - Go to Atlas → Database Access → Edit user")
            
        elif "user not found" in error_msg.lower():
            print("1. ❌ User doesn't exist in MongoDB Atlas")
            print("   - Go to Atlas → Database Access")
            print("   - Create new user: crm_admin")
            print("   - Set password and permissions")
            
        elif "not authorized" in error_msg.lower():
            print("1. ❌ User doesn't have proper permissions")
            print("   - Go to Atlas → Database Access")
            print("   - Edit user: crm_admin")
            print("   - Set role: 'Read and write to any database'")
            
        elif "network" in error_msg.lower() or "timeout" in error_msg.lower():
            print("1. ❌ Network connectivity issue")
            print("   - Check IP whitelist in Atlas → Network Access")
            print("   - Add 0.0.0.0/0 for testing")
            print("   - Check cluster status")
            
        elif "cluster" in error_msg.lower():
            print("1. ❌ Cluster access issue")
            print("   - Check cluster is running (not paused)")
            print("   - Verify cluster name in connection string")
            print("   - Check cluster health in Atlas dashboard")
            
        else:
            print("1. ❌ Unknown error")
            print("   - Check connection string format")
            print("   - Verify all credentials")
            print("   - Check Atlas cluster status")
        
        print("\n📋 Next steps:")
        print("1. Fix the issue identified above")
        print("2. Update MONGO_URL in Render environment")
        print("3. Restart your Render service")
        print("4. Test again with this script")
        
        return False
    
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Connection closed")

def main():
    """Main function to run the authentication test."""
    try:
        result = asyncio.run(test_atlas_authentication())
        if result:
            print("\n🎉 Ready for production deployment!")
            print("✅ Update MONGO_URL in Render with this connection string")
        else:
            print("\n⚠️  Fix authentication issues before deploying to production.")
    except KeyboardInterrupt:
        print("\n👋 Test cancelled by user")
    except Exception as e:
        print(f"\n❌ Test error: {e}")

if __name__ == "__main__":
    main()

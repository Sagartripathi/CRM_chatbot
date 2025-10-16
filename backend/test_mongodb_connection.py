#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test Script
====================================
This script tests your MongoDB Atlas connection and verifies the setup.

Usage:
    python test_mongodb_connection.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_connection():
    """Test MongoDB connection and display status."""
    
    print("=" * 70)
    print("MongoDB Atlas Connection Test")
    print("=" * 70)
    print()
    
    # Display configuration (hide password)
    mongo_url = settings.mongo_url
    if '@' in mongo_url:
        # Hide password in URL
        parts = mongo_url.split('@')
        if '://' in parts[0]:
            protocol_user = parts[0].split('://')
            if ':' in protocol_user[1]:
                username = protocol_user[1].split(':')[0]
                display_url = f"{protocol_user[0]}://{username}:***@{parts[1]}"
            else:
                display_url = mongo_url
        else:
            display_url = mongo_url
    else:
        display_url = mongo_url
    
    print(f"📝 Configuration:")
    print(f"   MongoDB URL: {display_url}")
    print(f"   Database: {settings.db_name}")
    print()
    
    # Test 1: Create client
    print("🔌 Test 1: Creating MongoDB client...")
    try:
        client = AsyncIOMotorClient(settings.mongo_url)
        print("   ✅ Client created successfully")
    except Exception as e:
        print(f"   ❌ Failed to create client: {str(e)}")
        return False
    
    print()
    
    # Test 2: Ping server
    print("🏓 Test 2: Pinging MongoDB server...")
    try:
        await client.admin.command('ping')
        print("   ✅ Server responded to ping")
    except Exception as e:
        print(f"   ❌ Failed to ping server: {str(e)}")
        print()
        print("💡 Common issues:")
        print("   - Check your internet connection")
        print("   - Verify MongoDB Atlas cluster is running")
        print("   - Check Network Access (IP whitelist) in Atlas")
        print("   - Ensure username and password are correct")
        print("   - URL encode special characters in password")
        client.close()
        return False
    
    print()
    
    # Test 3: Access database
    print("🗄️  Test 3: Accessing database...")
    try:
        db = client[settings.db_name]
        print(f"   ✅ Database '{settings.db_name}' accessed")
    except Exception as e:
        print(f"   ❌ Failed to access database: {str(e)}")
        client.close()
        return False
    
    print()
    
    # Test 4: List collections
    print("📚 Test 4: Listing collections...")
    try:
        collections = await db.list_collection_names()
        if collections:
            print(f"   ✅ Found {len(collections)} collection(s):")
            for col in collections:
                count = await db[col].count_documents({})
                print(f"      - {col}: {count} document(s)")
        else:
            print("   ℹ️  No collections found (database is empty)")
    except Exception as e:
        print(f"   ⚠️  Could not list collections: {str(e)}")
    
    print()
    
    # Test 5: Write/Read test
    print("✍️  Test 5: Testing write and read operations...")
    try:
        test_collection = db['_connection_test']
        
        # Insert test document
        test_doc = {'test': True, 'message': 'Connection test successful'}
        result = await test_collection.insert_one(test_doc)
        print(f"   ✅ Test document inserted (ID: {result.inserted_id})")
        
        # Read test document
        found_doc = await test_collection.find_one({'_id': result.inserted_id})
        if found_doc:
            print(f"   ✅ Test document retrieved successfully")
        
        # Clean up test document
        await test_collection.delete_one({'_id': result.inserted_id})
        print(f"   🧹 Test document cleaned up")
        
    except Exception as e:
        print(f"   ❌ Write/read test failed: {str(e)}")
        client.close()
        return False
    
    print()
    
    # Test 6: Server info
    print("ℹ️  Test 6: Server information...")
    try:
        server_info = await client.server_info()
        print(f"   MongoDB Version: {server_info.get('version', 'Unknown')}")
        print(f"   Git Version: {server_info.get('gitVersion', 'Unknown')[:12]}...")
    except Exception as e:
        print(f"   ⚠️  Could not retrieve server info: {str(e)}")
    
    # Close connection
    client.close()
    
    print()
    print("=" * 70)
    print("✅ All tests passed! MongoDB Atlas connection is working correctly.")
    print("=" * 70)
    print()
    print("🚀 Next steps:")
    print("   1. Run your backend server: python run.py")
    print("   2. Create initial admin user")
    print("   3. Test API endpoints")
    print("   4. Connect frontend application")
    print()
    
    return True


async def main():
    """Main function."""
    try:
        success = await test_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())


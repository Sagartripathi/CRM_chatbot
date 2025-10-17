#!/usr/bin/env python3
"""
Test different SSL configurations for MongoDB Atlas connection.
"""

import asyncio
import ssl
from motor.motor_asyncio import AsyncIOMotorClient

async def test_ssl_configurations():
    """Test different SSL configurations."""
    
    base_url = "mongodb+srv://crm_admin:m8PA5zJBItAFYvcL@crm-db-cluster.nifzfbd.mongodb.net/?retryWrites=true&w=majority&appName=crm-db-cluster"
    
    print("🔍 Testing Different SSL Configurations")
    print("=" * 50)
    
    # Test 1: No SSL options
    print("Test 1: No SSL options")
    try:
        client = AsyncIOMotorClient(base_url)
        await client.admin.command("ping")
        print("✅ Success!")
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}...")
    
    # Test 2: Custom SSL context
    print("\nTest 2: Custom SSL context")
    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        client = AsyncIOMotorClient(base_url, ssl_context=ssl_context)
        await client.admin.command("ping")
        print("✅ Success!")
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}...")
    
    # Test 3: Different connection string format
    print("\nTest 3: Different connection string format")
    try:
        alt_url = "mongodb+srv://crm_admin:m8PA5zJBItAFYvcL@crm-db-cluster.nifzfbd.mongodb.net/crm_admin?retryWrites=true&w=majority"
        client = AsyncIOMotorClient(alt_url, tls=True, tlsAllowInvalidCertificates=True)
        await client.admin.command("ping")
        print("✅ Success!")
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}...")
    
    # Test 4: With direct SSL parameters
    print("\nTest 4: With direct SSL parameters")
    try:
        client = AsyncIOMotorClient(
            base_url,
            tls=True,
            tlsAllowInvalidCertificates=True,
            tlsInsecure=True,
            connectTimeoutMS=30000,
            serverSelectionTimeoutMS=30000
        )
        await client.admin.command("ping")
        print("✅ Success!")
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}...")
    
    return False

if __name__ == "__main__":
    result = asyncio.run(test_ssl_configurations())
    if result:
        print("\n🎉 Found working SSL configuration!")
    else:
        print("\n💥 All SSL configurations failed. This might be a network or MongoDB Atlas configuration issue.")

#!/usr/bin/env python3
"""
Test CORS configuration for the CRM API.
This script tests the CORS headers to ensure they're working correctly.
"""

import requests
import json

def test_cors_headers():
    """Test CORS headers on the API endpoints."""
    
    # Test URLs
    base_url = "https://crm-chatbot-ei2d.onrender.com"
    test_origin = "https://crm-chatbot-three.vercel.app"
    
    print("🔍 Testing CORS Configuration")
    print("=" * 50)
    print(f"Backend URL: {base_url}")
    print(f"Frontend Origin: {test_origin}")
    print()
    
    # Test endpoints
    endpoints = [
        "/api/health",
        "/api/auth/login",
        "/api/"
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"Testing: {url}")
        
        try:
            # Test OPTIONS request (preflight)
            headers = {
                'Origin': test_origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            response = requests.options(url, headers=headers, timeout=10)
            
            print(f"  Status: {response.status_code}")
            print(f"  CORS Headers:")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            for header, value in cors_headers.items():
                if value:
                    print(f"    {header}: {value}")
                else:
                    print(f"    {header}: ❌ MISSING")
            
            # Check if CORS is working
            if cors_headers['Access-Control-Allow-Origin']:
                if cors_headers['Access-Control-Allow-Origin'] == '*' or cors_headers['Access-Control-Allow-Origin'] == test_origin:
                    print(f"  ✅ CORS OK for {test_origin}")
                else:
                    print(f"  ❌ CORS BLOCKED - Origin not allowed")
            else:
                print(f"  ❌ CORS BLOCKED - No Access-Control-Allow-Origin header")
                
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Request failed: {e}")
        
        print()

if __name__ == "__main__":
    test_cors_headers()

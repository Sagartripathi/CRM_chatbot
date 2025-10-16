#!/usr/bin/env python3
"""
Generate Secure Secret Key for JWT
===================================
This script generates a cryptographically secure random key
for use as JWT_SECRET_KEY in your .env file.

Usage:
    python generate_secret_key.py
"""

import secrets
import string

def generate_secret_key(length=64):
    """
    Generate a secure random secret key.
    
    Args:
        length: Length of the key (default 64 characters)
    
    Returns:
        A secure random string suitable for JWT_SECRET_KEY
    """
    # Method 1: Hex string (recommended)
    hex_key = secrets.token_hex(length // 2)
    
    # Method 2: URL-safe base64
    urlsafe_key = secrets.token_urlsafe(length)
    
    # Method 3: Mixed alphanumeric + symbols
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    mixed_key = ''.join(secrets.choice(alphabet) for _ in range(length))
    
    return hex_key, urlsafe_key, mixed_key


def main():
    """Main function to generate and display secret keys."""
    print("=" * 70)
    print("JWT Secret Key Generator")
    print("=" * 70)
    print()
    print("Generating secure random keys...")
    print()
    
    hex_key, urlsafe_key, mixed_key = generate_secret_key(64)
    
    print("Option 1: Hexadecimal (Recommended)")
    print("-" * 70)
    print(hex_key)
    print()
    
    print("Option 2: URL-safe Base64")
    print("-" * 70)
    print(urlsafe_key)
    print()
    
    print("Option 3: Mixed (letters, numbers, symbols)")
    print("-" * 70)
    print(mixed_key)
    print()
    
    print("=" * 70)
    print("📝 How to use:")
    print("=" * 70)
    print()
    print("1. Copy one of the keys above (Option 1 is recommended)")
    print("2. Open backend/.env file")
    print("3. Replace the JWT_SECRET_KEY value:")
    print()
    print("   JWT_SECRET_KEY=" + hex_key)
    print()
    print("4. Save the file and restart your server")
    print()
    print("⚠️  IMPORTANT:")
    print("   - Keep this key SECRET! Never commit it to git")
    print("   - Don't share it publicly")
    print("   - Use different keys for dev/staging/production")
    print("   - If compromised, generate a new key immediately")
    print()
    print("=" * 70)


if __name__ == "__main__":
    main()


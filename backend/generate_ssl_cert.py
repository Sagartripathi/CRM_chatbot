#!/usr/bin/env python3
"""
Generate self-signed SSL certificates for development/testing.
For production, use certificates from a trusted CA (Let's Encrypt, etc.).
"""

import os
import subprocess
import sys
from pathlib import Path


def generate_self_signed_cert():
    """Generate self-signed SSL certificate for development."""
    
    # Create certificates directory
    cert_dir = Path(__file__).parent / "certs"
    cert_dir.mkdir(exist_ok=True)
    
    cert_path = cert_dir / "server.crt"
    key_path = cert_dir / "server.key"
    
    print("🔐 Generating self-signed SSL certificate for development...")
    print(f"📁 Certificate directory: {cert_dir}")
    
    # Check if OpenSSL is available
    try:
        subprocess.run(["openssl", "version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL not found. Please install OpenSSL:")
        print("   macOS: brew install openssl")
        print("   Ubuntu: sudo apt-get install openssl")
        print("   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html")
        return False
    
    # Generate private key
    print("🔑 Generating private key...")
    key_cmd = [
        "openssl", "genrsa",
        "-out", str(key_path),
        "2048"
    ]
    
    try:
        subprocess.run(key_cmd, check=True)
        print(f"✅ Private key generated: {key_path}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate private key: {e}")
        return False
    
    # Generate certificate
    print("📜 Generating certificate...")
    cert_cmd = [
        "openssl", "req",
        "-new", "-x509",
        "-key", str(key_path),
        "-out", str(cert_path),
        "-days", "365",
        "-subj", "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
    ]
    
    try:
        subprocess.run(cert_cmd, check=True)
        print(f"✅ Certificate generated: {cert_path}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate certificate: {e}")
        return False
    
    # Set proper permissions
    os.chmod(key_path, 0o600)  # Read/write for owner only
    os.chmod(cert_path, 0o644)  # Read for all, write for owner
    
    print("\n🎉 SSL certificate generation complete!")
    print("\n📝 To use these certificates, update your .env file:")
    print(f"   SSL_ENABLED=true")
    print(f"   SSL_CERT_PATH={cert_path}")
    print(f"   SSL_KEY_PATH={key_path}")
    print("\n⚠️  Note: This is a self-signed certificate for development only.")
    print("   For production, use certificates from a trusted CA.")
    
    return True


def main():
    """Main function."""
    print("=" * 60)
    print("SSL Certificate Generator for CRM Backend")
    print("=" * 60)
    
    success = generate_self_signed_cert()
    
    if success:
        print("\n🚀 Next steps:")
        print("   1. Update .env file with SSL configuration")
        print("   2. Restart backend server")
        print("   3. Update frontend proxy URL to https://localhost:8000")
        print("   4. Test HTTPS connection")
    else:
        print("\n💥 Certificate generation failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()

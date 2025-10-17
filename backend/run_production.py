"""
Production server entry point with SSL/HTTPS support.
Optimized for production deployment with proper SSL configuration.
"""

import uvicorn
from app.main import app
from app.config import settings
import os
import sys


def validate_ssl_config():
    """Validate SSL configuration for production."""
    if not settings.ssl_enabled:
        print("⚠️  SSL is disabled. For production, consider enabling SSL.")
        return False
    
    if not settings.ssl_cert_path or not settings.ssl_key_path:
        print("❌ SSL enabled but certificate paths not provided.")
        print("   Set SSL_CERT_PATH and SSL_KEY_PATH environment variables.")
        return False
    
    if not os.path.exists(settings.ssl_cert_path):
        print(f"❌ SSL certificate file not found: {settings.ssl_cert_path}")
        return False
    
    if not os.path.exists(settings.ssl_key_path):
        print(f"❌ SSL key file not found: {settings.ssl_key_path}")
        return False
    
    print("✅ SSL configuration validated")
    return True


def main():
    """Main production server function."""
    print("🚀 Starting CRM Backend Server (Production Mode)")
    print("=" * 50)
    
    # Validate SSL configuration
    ssl_valid = validate_ssl_config()
    
    # Configure SSL if enabled and valid
    ssl_config = {}
    if settings.ssl_enabled and ssl_valid:
        ssl_config = {
            "ssl_certfile": settings.ssl_cert_path,
            "ssl_keyfile": settings.ssl_key_path,
        }
        protocol = "https"
    else:
        protocol = "http"
        if settings.ssl_enabled:
            print("⚠️  SSL configuration invalid, falling back to HTTP")
    
    # Production server configuration
    server_config = {
        "app": "app.main:app",
        "host": settings.host,
        "port": settings.port,
        "workers": int(os.getenv("WORKERS", "4")),  # Number of worker processes
        "log_level": "info",
        "access_log": True,
        "use_colors": False,  # Disable colors in production logs
        "loop": "uvloop",  # Use uvloop for better performance
        "http": "httptools",  # Use httptools for better performance
    }
    
    # Add SSL configuration if enabled
    server_config.update(ssl_config)
    
    print(f"🌐 Server URL: {protocol}://{settings.host}:{settings.port}")
    print(f"👥 Workers: {server_config['workers']}")
    print(f"🔒 SSL: {'Enabled' if ssl_config else 'Disabled'}")
    print("=" * 50)
    
    try:
        uvicorn.run(**server_config)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

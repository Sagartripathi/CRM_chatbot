"""
Render.com production server entry point.
Optimized for Render's HTTPS environment and automatic SSL termination.
"""

import uvicorn
from app.main import app
from app.config import settings
import os


def main():
    """Main Render production server function."""
    print("🚀 Starting CRM Backend Server (Render Production Mode)")
    print("=" * 60)
    
    # Render automatically provides HTTPS, so we don't need SSL certificates
    # Render uses port from PORT environment variable
    port = int(os.getenv("PORT", 8000))
    
    # Render configuration
    server_config = {
        "app": "app.main:app",
        "host": "0.0.0.0",  # Render requires binding to 0.0.0.0
        "port": port,
        "workers": 1,  # Render recommends 1 worker for most applications
        "log_level": "info",
        "access_log": True,
        "use_colors": False,  # Disable colors in production logs
        "loop": "uvloop",  # Use uvloop for better performance
        "http": "httptools",  # Use httptools for better performance
    }
    
    print(f"🌐 Server URL: https://your-app.onrender.com")
    print(f"🔒 HTTPS: Enabled by Render")
    print(f"👥 Workers: {server_config['workers']}")
    print(f"🏠 Host: {server_config['host']}")
    print(f"🔌 Port: {server_config['port']}")
    print("=" * 60)
    
    try:
        uvicorn.run(**server_config)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        import sys
        sys.exit(1)


if __name__ == "__main__":
    main()

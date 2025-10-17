"""
Application entry point for local development and production.
Runs the FastAPI application with uvicorn with optional SSL support.
"""

import uvicorn
from app.main import app
from app.config import settings


if __name__ == "__main__":
    # Configure SSL if enabled
    ssl_config = {}
    if settings.ssl_enabled and settings.ssl_cert_path and settings.ssl_key_path:
        ssl_config = {
            "ssl_certfile": settings.ssl_cert_path,
            "ssl_keyfile": settings.ssl_key_path,
        }
        print(f"🔒 SSL enabled: {settings.ssl_cert_path}")
    
    # Determine protocol
    protocol = "https" if ssl_config else "http"
    print(f"🚀 Starting server at {protocol}://{settings.host}:{settings.port}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
        **ssl_config
    )

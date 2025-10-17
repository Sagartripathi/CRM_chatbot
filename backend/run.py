"""
Application entry point for local development.
Runs the FastAPI application with uvicorn.
"""

import uvicorn
from app.main import app
from app.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )

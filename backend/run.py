"""
Application entry point for local development.
Runs the FastAPI application with uvicorn.
"""

import os
import uvicorn
from app.main import app
from app.dependencies import get_current_user



if __name__ == "__main__":
    # Use 0.0.0.0 for production, 127.0.0.1 for local dev
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

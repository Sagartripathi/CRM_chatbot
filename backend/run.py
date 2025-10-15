"""
Application entry point for local development.
Runs the FastAPI application with uvicorn.
"""

import uvicorn
from app.main import app
from app.dependencies import get_current_user



if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

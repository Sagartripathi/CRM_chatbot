"""
Main FastAPI application.
Initializes the application with all routes and middleware.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.routers import (
    auth_router, leads_router, campaigns_router, 
    meetings_router, tickets_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main FastAPI application
app = FastAPI(
    title="CRM API",
    version="1.0.0",
    description="Customer Relationship Management API with lead tracking, campaigns, meetings, and support tickets"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(meetings_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")

# Root endpoint
@app.get("/api/")
async def root():
    """
    Root endpoint for API health check.
    
    Returns:
        dict: API information
    """
    return {
        "message": "CRM API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        dict: Health status and timestamp
    """
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.on_event("startup")
async def startup_event():
    """
    Application startup event.
    Initializes database connection and creates indexes.
    """
    try:
        await db.connect()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        if settings.skip_db_check:
            logger.info("SKIP_DB_CHECK=1 set — continuing without blocking startup")
        else:
            logger.error(
                "MongoDB is not reachable. Options to fix:\n"
                "1) Start Docker Desktop (if using Docker) and then run:\n"
                "   open --background -a Docker && docker run -d --name mongo -p 27017:27017 mongo\n"
                "2) Install & start MongoDB via Homebrew:\n"
                "   brew tap mongodb/brew\n"
                "   brew install mongodb-community@6.0\n"
                "   brew services start mongodb-community@6.0\n"
                "3) Use MongoDB Atlas and set MONGO_URL in backend/.env, e.g.:\n"
                "   MONGO_URL='mongodb+srv://<user>:<pass>@cluster0.example.mongodb.net'\n\n"
                "After starting MongoDB, restart the backend:\n"
                "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000\n"
            )


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event.
    Closes database connection.
    """
    await db.disconnect()
    logger.info("Application shutdown completed")


# Allow running the app directly for local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=True
    )

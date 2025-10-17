# """
# Main FastAPI application.
# Initializes the application with all routes and middleware.
# """


"""
CRM FastAPI Application
Entry point for local development and deployment.
Initializes routes, middleware, logging, and database connections.
"""

import logging
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.routers import (
    auth_router, leads_router, campaigns_router,
    meetings_router, tickets_router
)
from app.routers.debug import router as debug_router
import uvicorn


# ------------------ Logging Configuration ------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ------------------ FastAPI App Initialization ------------------
app = FastAPI(
    title="CRM API",
    version="1.0.0",
    description="Customer Relationship Management API with lead tracking, campaigns, meetings, and support tickets"
)


# ------------------ CORS Configuration ------------------
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------ Routers ------------------
app.include_router(auth_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(meetings_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")
app.include_router(debug_router, prefix="/api")


# ------------------ Root Endpoints ------------------
@app.get("/")
async def home():
    """Root route for the application"""
    return {
        "message": "Welcome to CRM API 🚀",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/api/")
async def root():
    """API root endpoint for quick health info"""
    return {
        "message": "CRM API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/test-db")
async def test_database():
    """Test database connection endpoint"""
    try:
        # Test database connection
        await db.client.admin.command("ping")
        
        # Test users collection
        user_count = await db.database.users.count_documents({})
        
        return {
            "status": "success",
            "message": "Database connection working",
            "user_count": user_count,
            "database_name": db.database.name
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}",
            "error_type": type(e).__name__
        }


# ------------------ Lifecycle Events ------------------
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB when app starts"""
    try:
        await db.connect()
        logger.info("✅ Database connection established successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        if settings.skip_db_check:
            logger.warning("SKIP_DB_CHECK=1 — continuing without database connection")
        else:
            logger.error(
                "MongoDB is not reachable.\n"
                "To fix this:\n"
                "1️⃣ Start Docker Desktop, then run:\n"
                "   docker run -d --name mongo -p 27017:27017 mongo\n"
                "2️⃣ Or install MongoDB locally:\n"
                "   brew tap mongodb/brew && brew install mongodb-community@6.0\n"
                "   brew services start mongodb-community@6.0\n"
                "3️⃣ Or use MongoDB Atlas — update MONGO_URL in backend/.env\n"
                "After setup, restart backend:\n"
                "   python3 main.py\n"
            )


@app.on_event("shutdown")
async def shutdown_event():
    """Disconnect from MongoDB on shutdown"""
    await db.disconnect()
    logger.info("🛑 Database connection closed successfully")


# ------------------ Run App ------------------
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",  # assuming this file is located at backend/app/main.py
        host=settings.host or "127.0.0.1",
        port=settings.port or 8000,
        reload=True,
        log_level="info"
    )

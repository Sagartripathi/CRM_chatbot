from fastapi import APIRouter, Request, Depends
from typing import Any, Dict
from app.dependencies import get_current_user_optional
from app.config import settings
import os

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/headers")
async def debug_headers(request: Request, current_user=Depends(get_current_user_optional)) -> Dict[str, Any]:
    """Development-only endpoint that returns the incoming request headers
    and the optional current user decoded from the Authorization header.

    NOTE: This endpoint should only be used in local/dev environments.
    """
    headers = dict(request.headers)
    user_info = None
    if current_user:
        # current_user may be a dict-like user object from the DB layer
        try:
            user_info = {
                "id": getattr(current_user, "id", None) or current_user.get("id"),
                "role": getattr(current_user, "role", None) or current_user.get("role"),
            }
        except Exception:
            user_info = str(current_user)

    return {"headers": headers, "current_user": user_info}


@router.get("/env")
async def debug_environment() -> Dict[str, Any]:
    """Debug endpoint to check environment variables (without sensitive data)."""
    return {
        "mongo_url_preview": settings.mongo_url[:20] + "..." if len(settings.mongo_url) > 20 else settings.mongo_url,
        "mongo_url_length": len(settings.mongo_url),
        "db_name": settings.db_name,
        "environment": settings.environment,
        "host": settings.host,
        "port": settings.port,
        "cors_origins": settings.cors_origins,
        "cors_origins_list": settings.cors_origins.split(","),
        "jwt_secret_length": len(settings.jwt_secret_key),
        "mongo_url_from_env": os.getenv("MONGO_URL", "NOT_SET")[:20] + "..." if os.getenv("MONGO_URL") and len(os.getenv("MONGO_URL")) > 20 else os.getenv("MONGO_URL", "NOT_SET"),
        "mongo_url_env_length": len(os.getenv("MONGO_URL", "")),
        "cors_origins_from_env": os.getenv("CORS_ORIGINS", "NOT_SET")
    }


@router.options("/cors-test")
async def cors_test_options():
    """Test CORS preflight request."""
    return {"message": "CORS preflight successful"}


@router.get("/cors-test")
async def cors_test():
    """Test CORS configuration."""
    return {
        "message": "CORS test successful",
        "cors_origins": settings.cors_origins,
        "cors_origins_list": settings.cors_origins.split(",")
    }

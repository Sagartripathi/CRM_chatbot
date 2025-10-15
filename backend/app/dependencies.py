"""
FastAPI dependencies for the CRM application.
Contains common dependencies used across routes.
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import db
from app.models import User
from app.utils import verify_token

# Configure logger
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Verify token and get user ID
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await db.database.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User | None:
    """
    Get the current authenticated user from JWT token if provided.
    Returns None if no credentials are given or token is invalid.
    """
    if not credentials:
        return None

    try:
        user_id = verify_token(credentials.credentials)
        if not user_id:
            return None

        user = await db.database.users.find_one({"id": user_id})
        if not user:
            return None

        return User(**user)
    except Exception as e:
        logger.debug(f"Optional user auth failed: {e}")
        return None

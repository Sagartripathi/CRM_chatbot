"""
Authentication API routes.
Handles user registration, login, and authentication endpoints.
"""

from fastapi import APIRouter, Depends
from app.models import User, UserCreate, UserLogin, Token
from app.services import AuthService
from app.repositories import UserRepository
from app.database import db
from app.dependencies import get_current_user

# Create router with prefix
router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_service() -> AuthService:
    """
    Dependency to get authentication service.
    
    Returns:
        AuthService: Authentication service instance
    """
    user_repo = UserRepository(db.database)
    return AuthService(user_repo)


@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register a new user.
    
    Args:
        user_data: User registration data
        auth_service: Authentication service dependency
        
    Returns:
        User: The created user object
        
    Raises:
        HTTPException: If email already exists
    """
    return await auth_service.register_user(user_data)


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user and return access token.
    
    Args:
        user_data: User login credentials
        auth_service: Authentication service dependency
        
    Returns:
        Token: Access token and user information
        
    Raises:
        HTTPException: If credentials are invalid
    """
    return await auth_service.authenticate_user(user_data)


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user from dependency
        
    Returns:
        User: Current user information
    """
    return current_user


@router.get("/clients")
async def get_available_clients():
    """
    Get list of available client IDs for registration.
    
    Returns:
        List[dict]: List of available client IDs with their information
    """
    return [
        {"client_id": "CLI-00001", "name": "Client 1"},
        {"client_id": "CLI-00002", "name": "Client 2"},
        {"client_id": "CLI-00003", "name": "Client 3"}
    ]

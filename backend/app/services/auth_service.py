"""
Authentication service for user management.
Handles user registration, login, and authentication logic.
"""

from typing import Optional
from fastapi import HTTPException, status
from app.models import User, UserCreate, UserLogin, Token
from app.repositories import UserRepository
from app.utils import get_password_hash, verify_password, create_access_token


class AuthService:
    """
    Service for authentication and user management.
    Handles business logic for user operations.
    """
    
    def __init__(self, user_repository: UserRepository):
        """
        Initialize authentication service.
        
        Args:
            user_repository: User repository instance
        """
        self.user_repo = user_repository
    
    async def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user.
        
        Args:
            user_data: User registration data
            
        Returns:
            User: The created user object
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        existing_user = await self.user_repo.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password and create user
        hashed_password = get_password_hash(user_data.password)
        return await self.user_repo.create_user(user_data, hashed_password)
    
    async def authenticate_user(self, login_data: UserLogin) -> Token:
        """
        Authenticate a user and return access token.
        
        Args:
            login_data: User login credentials
            
        Returns:
            Token: Access token and user information
            
        Raises:
            HTTPException: If credentials are invalid
        """
        # Find user by email
        user = await self.user_repo.get_user_by_email(login_data.email)
        if not user or not verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        user_obj = User(**{k: v for k, v in user.items() if k != "password"})
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_obj
        )
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Optional[User]: User object if found, None otherwise
        """
        user = await self.user_repo.get_user_by_id(user_id)
        if user:
            return User(**{k: v for k, v in user.items() if k != "password"})
        return None

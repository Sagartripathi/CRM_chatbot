"""
User-related Pydantic models.
Contains user data structures and authentication schemas.
"""

import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, EmailStr
from .enums import UserRole


class User(BaseModel):
    """
    User model representing a system user.
    Contains user profile information and role.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class UserCreate(BaseModel):
    """
    User creation schema.
    Used for user registration with password.
    """
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.CLIENT

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class UserLogin(BaseModel):
    """
    User login schema.
    Contains credentials for authentication.
    """
    email: EmailStr
    password: str


class Token(BaseModel):
    """
    Authentication token response.
    Contains JWT token and user information.
    """
    access_token: str
    token_type: str
    user: User

"""
User-related Pydantic models.
Contains user data structures and authentication schemas.
"""

import uuid
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, EmailStr, validator
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
    client_id: Optional[str] = Field(None, description="Client ID - required for client role users")
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
    client_id: Optional[str] = Field(None, description="Client ID - required if role is client")

    @validator('client_id')
    def validate_client_id(cls, v, values):
        """Validate client_id is provided when role is client."""
        role = values.get('role')
        if role == UserRole.CLIENT and not v:
            raise ValueError('client_id is required when role is client')
        if role == UserRole.CLIENT and v:
            allowed_clients = ['CLI-00001', 'CLI-00002', 'CLI-00003']
            if v not in allowed_clients:
                raise ValueError(f'client_id must be one of: {", ".join(allowed_clients)}')
        return v

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

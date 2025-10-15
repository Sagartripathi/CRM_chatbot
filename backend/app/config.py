"""
Configuration settings for the CRM application.
Handles environment variables and application settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Provides default values for local development.
    """
    
    # Database Configuration
    mongo_url: str = "mongodb://localhost:27017"
    db_name: str = "crm_db"
    
    # Security Configuration
    jwt_secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # CORS Configuration
    cors_origins: str = "*"
    
    # Server Configuration
    host: str = "127.0.0.1"
    port: int = 8000
    
    # Development flags
    skip_db_check: bool = False
    
    class Config:
        """Pydantic configuration."""
        env_file = Path(__file__).parent.parent / ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

"""
Configuration settings for the CRM application.
Handles environment variables and application settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Provides default values for local development.
    """
    
    # Database Configuration
    # For local MongoDB: mongodb://localhost:27017
    # For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name: str = os.getenv("DB_NAME", "crm_db")
    
    # Security Configuration
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # CORS Configuration
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")
    
    # Server Configuration
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    
    # Development flags
    skip_db_check: bool = os.getenv("SKIP_DB_CHECK", "false").lower() == "true"
    
    class Config:
        """Pydantic configuration."""
        env_file = Path(__file__).parent.parent / ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

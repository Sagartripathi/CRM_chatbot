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
    
    # SSL/HTTPS Configuration
    ssl_enabled: bool = os.getenv("SSL_ENABLED", "false").lower() == "true"
    ssl_cert_path: str = os.getenv("SSL_CERT_PATH", "")
    ssl_key_path: str = os.getenv("SSL_KEY_PATH", "")
    
    # Render/Production HTTPS Configuration
    environment: str = os.getenv("ENVIRONMENT", "development")
    force_https: bool = os.getenv("FORCE_HTTPS", "false").lower() == "true"
    
    # Database Connection Configuration
    db_connect_timeout: int = int(os.getenv("DB_CONNECT_TIMEOUT", "30000"))
    db_server_selection_timeout: int = int(os.getenv("DB_SERVER_SELECTION_TIMEOUT", "30000"))
    db_socket_timeout: int = int(os.getenv("DB_SOCKET_TIMEOUT", "30000"))
    db_max_pool_size: int = int(os.getenv("DB_MAX_POOL_SIZE", "10"))
    
    # API Configuration
    api_version: str = os.getenv("API_VERSION", "1.0.0")
    api_title: str = os.getenv("API_TITLE", "CRM API")
    api_description: str = os.getenv("API_DESCRIPTION", "Customer Relationship Management API with lead tracking, campaigns, meetings, and support tickets")
    
    # Pagination Configuration
    default_page_size: int = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
    max_page_size: int = int(os.getenv("MAX_PAGE_SIZE", "1000"))
    
    # Campaign Configuration
    max_campaign_attempts: int = int(os.getenv("MAX_CAMPAIGN_ATTEMPTS", "3"))
    campaign_retry_delay_hours: int = int(os.getenv("CAMPAIGN_RETRY_DELAY_HOURS", "1"))
    
    # Production Configuration
    workers: int = int(os.getenv("WORKERS", "4"))
    
    # Development flags
    skip_db_check: bool = os.getenv("SKIP_DB_CHECK", "false").lower() == "true"
    
    class Config:
        """Pydantic configuration."""
        env_file = Path(__file__).parent.parent / ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

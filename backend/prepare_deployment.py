#!/usr/bin/env python3
"""
Deployment Preparation Script
Helps verify your setup is ready for deployment to Render
"""

import os
import sys
import secrets
from pathlib import Path

# Try to import dotenv, but don't fail if not available
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("⚠️  python-dotenv not installed. Install with: pip install python-dotenv")
    print("    Continuing without .env file loading...\n")

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")

def print_success(message):
    """Print a success message"""
    print(f"✅ {message}")

def print_warning(message):
    """Print a warning message"""
    print(f"⚠️  {message}")

def print_error(message):
    """Print an error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print an info message"""
    print(f"ℹ️  {message}")

def check_env_file():
    """Check if .env file exists and is properly configured"""
    print_header("Checking Environment Configuration")
    
    env_path = Path(__file__).parent / ".env"
    
    if not env_path.exists():
        print_error(".env file not found!")
        print_info("Creating .env from template...")
        template_path = Path(__file__).parent / "env.template"
        if template_path.exists():
            with open(template_path, 'r') as template:
                with open(env_path, 'w') as env_file:
                    env_file.write(template.read())
            print_success(".env file created from template")
            print_warning("Please edit .env file with your actual values")
            return False
        else:
            print_error("env.template not found either!")
            return False
    
    print_success(".env file exists")
    
    # Load and check environment variables
    if DOTENV_AVAILABLE:
        load_dotenv(env_path)
    else:
        print_warning("Skipping .env validation (dotenv not installed)")
    
    required_vars = {
        'MONGO_URL': 'MongoDB connection string',
        'DB_NAME': 'Database name',
        'JWT_SECRET_KEY': 'JWT secret key'
    }
    
    missing_vars = []
    placeholder_vars = []
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            missing_vars.append(f"{var} ({description})")
            print_error(f"{var} is not set")
        elif '<' in value or 'placeholder' in value.lower() or 'change' in value.lower():
            placeholder_vars.append(f"{var} ({description})")
            print_warning(f"{var} still has placeholder value")
        else:
            print_success(f"{var} is configured")
    
    if missing_vars or placeholder_vars:
        if missing_vars:
            print_error(f"\nMissing variables: {', '.join(missing_vars)}")
        if placeholder_vars:
            print_warning(f"\nPlaceholder values need updating: {', '.join(placeholder_vars)}")
        return False
    
    return True

def generate_jwt_secret():
    """Generate a secure JWT secret key"""
    print_header("JWT Secret Key Generator")
    
    secret = secrets.token_hex(32)
    print_success("Generated secure JWT secret key:")
    print(f"\n{secret}\n")
    print_info("Copy this value and add it to your .env file as JWT_SECRET_KEY")
    print_info("Also add this to Render environment variables")
    
    return secret

def check_requirements():
    """Check if requirements.txt exists"""
    print_header("Checking Requirements")
    
    req_path = Path(__file__).parent / "requirements.txt"
    
    if not req_path.exists():
        print_error("requirements.txt not found!")
        return False
    
    print_success("requirements.txt exists")
    
    # Count dependencies
    with open(req_path, 'r') as f:
        deps = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    print_info(f"Found {len(deps)} dependencies")
    
    # Check for essential packages
    essential = ['fastapi', 'uvicorn', 'pymongo', 'motor', 'python-jose', 'passlib']
    missing = []
    
    for package in essential:
        if not any(package in dep.lower() for dep in deps):
            missing.append(package)
    
    if missing:
        print_warning(f"Missing essential packages: {', '.join(missing)}")
    else:
        print_success("All essential packages present")
    
    return True

def check_mongodb_connection():
    """Test MongoDB connection"""
    print_header("Testing MongoDB Connection")
    
    if DOTENV_AVAILABLE:
        load_dotenv(Path(__file__).parent / ".env")
    
    mongo_url = os.getenv('MONGO_URL')
    
    if not mongo_url or '<' in mongo_url:
        print_warning("MongoDB URL not configured, skipping connection test")
        return False
    
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        
        print_info("Attempting to connect to MongoDB...")
        client = MongoClient(mongo_url, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        
        print_success("MongoDB connection successful!")
        
        # Get database info
        db_name = os.getenv('DB_NAME', 'crm_db')
        db = client[db_name]
        collections = db.list_collection_names()
        
        print_info(f"Database: {db_name}")
        print_info(f"Collections: {len(collections)}")
        if collections:
            print_info(f"Collection names: {', '.join(collections)}")
        
        client.close()
        return True
        
    except ImportError:
        print_warning("pymongo not installed, skipping MongoDB connection test")
        print_info("To test connection, install: pip install pymongo")
        return False
    except Exception as e:
        print_error(f"MongoDB connection failed: {str(e)}")
        print_info("Make sure your MongoDB Atlas cluster is running")
        print_info("Check Network Access allows connections (0.0.0.0/0 for Render)")
        return False

def generate_deployment_info():
    """Generate deployment configuration information"""
    print_header("Deployment Configuration for Render")
    
    if DOTENV_AVAILABLE:
        load_dotenv(Path(__file__).parent / ".env")
    
    print("Copy these settings to Render:\n")
    
    print("Build Command:")
    print("  pip install -r requirements.txt\n")
    
    print("Start Command:")
    print("  uvicorn app.main:app --host 0.0.0.0 --port $PORT\n")
    
    print("Environment Variables to set in Render Dashboard:")
    env_vars = [
        ('MONGO_URL', os.getenv('MONGO_URL', '<your-mongodb-atlas-url>')),
        ('DB_NAME', os.getenv('DB_NAME', 'crm_db')),
        ('JWT_SECRET_KEY', '<generate-with-script>'),
        ('ALGORITHM', 'HS256'),
        ('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'),
        ('HOST', '0.0.0.0'),
        ('PORT', '8000'),
        ('CORS_ORIGINS', '*'),
        ('SKIP_DB_CHECK', 'false'),
        ('PYTHON_VERSION', '3.11.0'),
    ]
    
    for key, value in env_vars:
        # Mask sensitive values
        if key in ['MONGO_URL', 'JWT_SECRET_KEY'] and '<' not in value:
            display_value = value[:20] + '...' if len(value) > 20 else value
        else:
            display_value = value
        print(f"  {key}={display_value}")
    
    print()

def main():
    """Main function to run all checks"""
    print("\n" + "🚀" * 35)
    print("  Deployment Preparation for Render")
    print("🚀" * 35)
    
    checks_passed = []
    
    # Run all checks
    checks_passed.append(check_requirements())
    checks_passed.append(check_env_file())
    checks_passed.append(check_mongodb_connection())
    
    # Generate JWT secret
    print("\n")
    generate_jwt_secret()
    
    # Show deployment info
    generate_deployment_info()
    
    # Final summary
    print_header("Summary")
    
    if all(checks_passed):
        print_success("All checks passed! You're ready to deploy to Render! 🎉")
        print_info("Follow the steps in DEPLOYMENT_GUIDE.md to deploy")
    else:
        print_warning("Some checks failed. Please fix the issues above before deploying.")
        print_info("Refer to DEPLOYMENT_GUIDE.md for detailed instructions")
    
    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScript interrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)


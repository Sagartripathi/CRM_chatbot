#!/usr/bin/env python3
"""
Environment switcher for CRM Backend
Usage: python switch_env.py [dev|local|production]
"""

import sys
import os

def switch_environment(env_type):
    """Switch between different environment configurations"""
    
    env_file = ".env"
    
    if not os.path.exists(env_file):
        print("❌ .env file not found!")
        return
    
    # Read current .env file
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Create new content based on environment
    new_lines = []
    current_section = None
    
    for line in lines:
        # Check for section headers
        if "DEV ENVIRONMENT" in line:
            current_section = "dev"
        elif "LOCAL ENVIRONMENT" in line:
            current_section = "local"
        elif "PRODUCTION ENVIRONMENT" in line:
            current_section = "production"
        
        # Handle configuration lines
        if line.strip() and not line.startswith('#') and '=' in line:
            if current_section == env_type:
                # Uncomment for active environment
                new_lines.append(line)
            else:
                # Comment out for inactive environments
                new_lines.append('#' + line)
        else:
            # Keep headers and empty lines as is
            new_lines.append(line)
    
    # Write back to file
    with open(env_file, 'w') as f:
        f.writelines(new_lines)
    
    print(f"✅ Switched to {env_type.upper()} environment")
    print(f"📝 Updated .env file")

def main():
    if len(sys.argv) != 2:
        print("Usage: python switch_env.py [dev|local|production]")
        print("\nAvailable environments:")
        print("  dev        - Development environment (MongoDB Atlas dev cluster)")
        print("  local      - Local development (local MongoDB)")
        print("  production - Production environment (MongoDB Atlas production)")
        return
    
    env_type = sys.argv[1].lower()
    
    if env_type not in ['dev', 'local', 'production']:
        print("❌ Invalid environment. Use: dev, local, or production")
        return
    
    switch_environment(env_type)

if __name__ == "__main__":
    main()

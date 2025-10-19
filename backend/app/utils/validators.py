"""
Validation utilities for CRM data.
"""
import re
from typing import Optional


def validate_us_phone(phone: Optional[str]) -> Optional[str]:
    """
    Validate US phone number with optional extension.
    Format: +1-XXX-XXX-XXXX or +1XXXXXXXXXX (optional ext: XXXXX)
    
    Examples:
        +1-555-123-4567
        +1-555-123-4567 ext 12345
        +15551234567
        +15551234567x12345
    
    Args:
        phone: Phone number string to validate
        
    Returns:
        Validated phone number string
        
    Raises:
        ValueError: If phone number format is invalid
    """
    if not phone:
        return phone
    
    # Remove spaces and common separators for validation
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Pattern: +1 followed by 10 digits, optional extension (at least 5 digits)
    # Supports: ext, x, extension
    pattern = r'^\+1\d{10}(?:(?:ext|x|extension)\d{5,})?$'
    
    if not re.match(pattern, cleaned, re.IGNORECASE):
        raise ValueError(
            "Phone must be a valid US number in format: +1-XXX-XXX-XXXX "
            "with optional extension (min 5 digits). Example: +1-555-123-4567 ext 12345"
        )
    
    return phone


def generate_short_hash(length: int = 8) -> str:
    """
    Generate a short hash using random characters.
    Returns uppercase alphanumeric string.
    
    Args:
        length: Length of the hash to generate (default: 8)
        
    Returns:
        Random alphanumeric string
    """
    import secrets
    import string
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_campaign_id() -> str:
    """
    Generate campaign ID with format: C-XXXXX
    where X is a short hash (5 characters).
    
    Returns:
        Campaign ID string (e.g., "C-A1B2C")
    """
    return f"C-{generate_short_hash(5)}"


def generate_client_id() -> str:
    """
    Generate client ID with format: CLI-XXXXX
    Phase 1 default: CLI-00001
    
    TODO: Implement auto-increment logic in phase 2
    
    Returns:
        Client ID string
    """
    # For phase 1, return default
    # TODO: Implement auto-increment logic in phase 2
    return "CLI-00001"


def generate_agent_id() -> str:
    """
    Generate agent ID with format: AGE-XXXXX
    Phase 1 default: AGE-00001
    
    TODO: Implement auto-increment logic in phase 2
    
    Returns:
        Agent ID string
    """
    # For phase 1, return default
    # TODO: Implement auto-increment logic in phase 2
    return "AGE-00001"


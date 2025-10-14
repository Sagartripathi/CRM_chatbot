"""
Helper utility functions.
Contains common utility functions used throughout the application.
"""

from datetime import datetime
from typing import Any, Dict


def prepare_for_mongo(data: Any) -> Any:
    """
    Convert datetime objects to ISO strings for MongoDB storage.
    Recursively processes dictionaries and nested objects.
    
    Args:
        data: The data to prepare for MongoDB storage
        
    Returns:
        Any: The processed data with datetime objects converted to ISO strings
    """
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
    return data

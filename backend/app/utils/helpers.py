"""
Helper utility functions.
Contains common utility functions used throughout the application.
"""

from datetime import datetime, timezone
from typing import Any, Dict
import copy


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
        data = copy.deepcopy(data)
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) for item in value]
    elif isinstance(data, list):
        data = [prepare_for_mongo(item) for item in data]
    return data


def parse_from_mongo(data: Any) -> Any:
    """
    Convert ISO datetime strings from MongoDB back to datetime objects.
    Handles both strings and datetime objects (for compatibility).
    Recursively processes dictionaries and nested objects.
    
    Args:
        data: The data from MongoDB (may contain ISO datetime strings)
        
    Returns:
        Any: The processed data with ISO datetime strings converted to datetime objects
    """
    if isinstance(data, dict):
        data = copy.deepcopy(data)
        for key, value in data.items():
            # Check for datetime fields that might be strings
            if key in ['start_time', 'end_time', 'created_at', 'updated_at', 'requested_time', 'resolved_at']:
                if isinstance(value, datetime):
                    # Already a datetime object, keep it
                    pass
                elif isinstance(value, (int, float)):
                    # Handle Unix timestamps (numeric)
                    try:
                        data[key] = datetime.fromtimestamp(value, tz=timezone.utc)
                    except (ValueError, OverflowError):
                        pass
                elif isinstance(value, str):
                    # Try parsing as ISO format datetime string first
                    try:
                        # Handle 'Z' suffix for UTC
                        value_to_parse = value.replace('Z', '+00:00') if value.endswith('Z') else value
                        # Parse the ISO format string
                        data[key] = datetime.fromisoformat(value_to_parse)
                    except (ValueError, AttributeError):
                        # If ISO parsing fails, try parsing as timestamp string
                        try:
                            # Check if string represents a numeric timestamp
                            try:
                                timestamp = float(value)
                                data[key] = datetime.fromtimestamp(timestamp, tz=timezone.utc)
                            except (ValueError, TypeError, OverflowError):
                                # If all parsing fails, keep original value
                                pass
                        except Exception:
                            # If all parsing fails, keep original value
                            pass
            elif isinstance(value, dict):
                data[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                data[key] = [parse_from_mongo(item) for item in value]
    elif isinstance(data, list):
        data = [parse_from_mongo(item) for item in data]
    return data

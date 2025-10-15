"""
User repository for database operations.
Handles all user-related database interactions.
"""

from typing import Optional, List
from app.models import User, UserCreate
from app.utils import prepare_for_mongo


class UserRepository:
    """
    Repository for user database operations.
    Handles CRUD operations for users.
    """
    
    def __init__(self, database):
        """
        Initialize user repository.
        
        Args:
            database: MongoDB database instance
        """
        self.db = database.users
    
    async def create_user(self, user_data: UserCreate, hashed_password: str) -> User:
        """
        Create a new user in the database.
        
        Args:
            user_data: User creation data
            hashed_password: Hashed password for the user
            
        Returns:
            User: The created user object
        """
        user_dict = user_data.dict(exclude={"password"})
        user_obj = User(**user_dict)
        
        # Store user with hashed password
        user_with_password = user_obj.dict()
        user_with_password["password"] = hashed_password
        user_with_password = prepare_for_mongo(user_with_password)
        
        await self.db.insert_one(user_with_password)
        return user_obj
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """
        Get user by email address.
        
        Args:
            email: User's email address
            
        Returns:
            Optional[dict]: User document if found, None otherwise
        """
        return await self.db.find_one({"email": email})
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """
        Get user by ID.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Optional[dict]: User document if found, None otherwise
        """
        return await self.db.find_one({"id": user_id})
    
    async def get_all_users(self) -> List[dict]:
        """
        Get all users from the database.
        
        Returns:
            List[dict]: List of all user documents
        """
        return await self.db.find().to_list(1000)
    
    async def update_user(self, user_id: str, update_data: dict) -> Optional[dict]:
        """
        Update user information.
        
        Args:
            user_id: User's unique identifier
            update_data: Dictionary containing fields to update
            
        Returns:
            Optional[dict]: Updated user document if found, None otherwise
        """
        update_data = prepare_for_mongo(update_data)
        await self.db.update_one({"id": user_id}, {"$set": update_data})
        return await self.get_user_by_id(user_id)
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from the database.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            bool: True if user was deleted, False otherwise
        """
        result = await self.db.delete_one({"id": user_id})
        return result.deleted_count > 0

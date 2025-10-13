from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from enum import Enum
import re
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early (only once)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection (safe defaults for local development)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'crm_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Security configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default

# Use bcrypt by default for local development (easier to install)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="CRM API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "CRM API is running", "version": "1.0.0"}

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    AGENT = "agent"
    CLIENT = "client"

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CONVERTED = "converted"
    LOST = "lost"
    NO_RESPONSE = "no_response"

class CallOutcome(str, Enum):
    ANSWERED = "answered"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    VOICEMAIL = "voicemail"

class CampaignLeadStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class MeetingStatus(str, Enum):
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.CLIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None  # User ID
    campaign_id: Optional[str] = None  # Campaign ID
    campaign_history: List[dict] = Field(default_factory=list)  # Track campaign changes
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None
    campaign_id: Optional[str] = None

class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_by: str  # User ID
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_leads: int = 0
    completed_leads: int = 0

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    lead_ids: List[str] = []

class CampaignLead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    lead_id: str
    attempts_made: int = 0
    max_attempts: int = 3
    last_attempt_at: Optional[datetime] = None
    next_attempt_at: Optional[datetime] = None
    status: CampaignLeadStatus = CampaignLeadStatus.PENDING
    last_call_outcome: Optional[CallOutcome] = None
    notes: Optional[str] = None
    assigned_agent: Optional[str] = None  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CallLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_lead_id: str
    agent_id: str  # User ID
    outcome: CallOutcome
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    call_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CallLogCreate(BaseModel):
    campaign_lead_id: str
    outcome: CallOutcome
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None

class Meeting(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    organizer_id: str  # User ID
    title: Optional[str] = None
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    status: MeetingStatus = MeetingStatus.PROPOSED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MeetingCreate(BaseModel):
    lead_id: str
    title: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None

class MeetingProposal(BaseModel):
    lead_id: str
    requested_time: datetime
    duration_minutes: int = 60
    title: Optional[str] = None
    notes: Optional[str] = None

class SupportTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    created_by: str  # User ID
    assigned_to: Optional[str] = None  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class NextLeadResponse(BaseModel):
    campaign_lead: CampaignLead
    lead: Lead
    message: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return user_id
    except Exception as e:
        # Use logger for debug information
        logger.debug("Token verification failed: %s", str(e))
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
    return data

# Authentication routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict(exclude={"password"})
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_with_password = user_obj.dict()
    user_with_password["password"] = hashed_password
    user_with_password = prepare_for_mongo(user_with_password)
    
    await db.users.insert_one(user_with_password)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**{k: v for k, v in user.items() if k != "password"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj
    }

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Leads routes
@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, current_user: User = Depends(get_current_user)):
    # Check for duplicates by email or phone
    duplicate_query = []
    if lead_data.email:
        duplicate_query.append({"email": lead_data.email})
    if lead_data.phone:
        duplicate_query.append({"phone": lead_data.phone})
    
    if duplicate_query:
        existing_lead = await db.leads.find_one({"$or": duplicate_query})
        if existing_lead:
            raise HTTPException(status_code=400, detail="Lead with this email or phone already exists")
    
    lead_dict = lead_data.dict()
    lead_dict["created_by"] = current_user.id
    lead_obj = Lead(**lead_dict)
    lead_dict = prepare_for_mongo(lead_obj.dict())
    
    await db.leads.insert_one(lead_dict)
    return lead_obj

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.AGENT:
        # Agents can see leads assigned to them OR unassigned leads (for campaign creation)
        query["$or"] = [
            {"assigned_to": current_user.id},
            {"assigned_to": None}
        ]
    elif current_user.role == UserRole.CLIENT:
        query["created_by"] = current_user.id
    
    # Additional filters
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if assigned_to and current_user.role == UserRole.ADMIN:
        query["assigned_to"] = assigned_to
    
    leads = await db.leads.find(query).to_list(1000)
    return [Lead(**lead) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check permissions
    if (current_user.role == UserRole.AGENT and lead["assigned_to"] != current_user.id and lead["assigned_to"] is not None) or \
       (current_user.role == UserRole.CLIENT and lead["created_by"] != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this lead")
    
    return Lead(**lead)

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_data: LeadCreate, current_user: User = Depends(get_current_user)):
    # Find existing lead
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check permissions
    if (current_user.role == UserRole.AGENT and existing_lead["assigned_to"] != current_user.id and existing_lead["assigned_to"] is not None) or \
       (current_user.role == UserRole.CLIENT and existing_lead["created_by"] != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this lead")
    
    # Check for duplicates (excluding current lead)
    duplicate_query = []
    if lead_data.email and lead_data.email != existing_lead.get("email"):
        duplicate_query.append({"email": lead_data.email, "id": {"$ne": lead_id}})
    if lead_data.phone and lead_data.phone != existing_lead.get("phone"):
        duplicate_query.append({"phone": lead_data.phone, "id": {"$ne": lead_id}})
    
    if duplicate_query:
        duplicate_lead = await db.leads.find_one({"$or": duplicate_query})
        if duplicate_lead:
            raise HTTPException(status_code=400, detail="Lead with this email or phone already exists")
    
    # Update lead
    update_data = lead_data.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data = prepare_for_mongo(update_data)
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id})
    return Lead(**updated_lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    # Find existing lead
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check permissions (only creator or admin can delete)
    if current_user.role != UserRole.ADMIN and existing_lead["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this lead")
    
    # Check if lead is part of active campaigns
    active_campaign_lead = await db.campaign_leads.find_one({
        "lead_id": lead_id,
        "status": {"$in": ["pending", "in_progress"]}
    })
    
    if active_campaign_lead:
        raise HTTPException(status_code=400, detail="Cannot delete lead that is part of active campaigns")
    
    # Delete the lead
    await db.leads.delete_one({"id": lead_id})
    
    return {"message": "Lead deleted successfully"}

@api_router.post("/leads/upload-csv")
async def upload_leads_csv(
    file: UploadFile = File(...),
    campaign_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Upload leads from CSV file.
    Required CSV columns: first_name, last_name, email, phone, status
    Optional: campaign_id can be passed as parameter or in CSV
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Read CSV content
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    # Validate required columns
    required_columns = {'first_name', 'last_name', 'email', 'phone', 'status'}
    if not required_columns.issubset(set(csv_reader.fieldnames or [])):
        raise HTTPException(
            status_code=400, 
            detail=f"CSV must contain columns: {', '.join(required_columns)}"
        )
    
    # Validate campaign_id if provided
    if campaign_id:
        campaign = await db.campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    created_leads = []
    skipped_leads = []
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # Get campaign_id from CSV or parameter
            lead_campaign_id = row.get('campaign_id') or campaign_id
            
            # Validate status
            status_value = row['status'].lower()
            if status_value not in ['new', 'contacted', 'converted', 'lost', 'no_response']:
                errors.append(f"Row {row_num}: Invalid status '{row['status']}'")
                continue
            
            # Check for duplicates
            duplicate_query = []
            if row.get('email'):
                duplicate_query.append({"email": row['email']})
            if row.get('phone'):
                duplicate_query.append({"phone": row['phone']})
            
            if duplicate_query:
                existing_lead = await db.leads.find_one({"$or": duplicate_query})
                if existing_lead:
                    skipped_leads.append({
                        "row": row_num,
                        "reason": f"Duplicate: {row['email'] or row['phone']}"
                    })
                    continue
            
            # Create lead
            lead_data = {
                "first_name": row['first_name'],
                "last_name": row['last_name'],
                "email": row.get('email') or None,
                "phone": row.get('phone') or None,
                "status": status_value,
                "campaign_id": lead_campaign_id,
                "created_by": current_user.id
            }
            
            lead_obj = Lead(**lead_data)
            lead_dict = prepare_for_mongo(lead_obj.dict())
            
            await db.leads.insert_one(lead_dict)
            created_leads.append(lead_obj.dict())
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    return {
        "message": f"Upload complete: {len(created_leads)} leads created",
        "created_count": len(created_leads),
        "skipped_count": len(skipped_leads),
        "error_count": len(errors),
        "created_leads": created_leads[:10],  # Return first 10 for preview
        "skipped": skipped_leads[:10],
        "errors": errors[:10]
    }

@api_router.patch("/leads/{lead_id}/campaign")
async def update_lead_campaign(
    lead_id: str,
    campaign_id: Optional[str],
    current_user: User = Depends(get_current_user)
):
    """
    Update the campaign assignment for a lead.
    Tracks campaign change history.
    """
    # Find existing lead
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and existing_lead["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this lead")
    
    # Validate new campaign if provided
    if campaign_id:
        campaign = await db.campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Track campaign history
    old_campaign_id = existing_lead.get("campaign_id")
    campaign_history = existing_lead.get("campaign_history", [])
    
    if old_campaign_id != campaign_id:
        history_entry = {
            "from_campaign_id": old_campaign_id,
            "to_campaign_id": campaign_id,
            "changed_at": datetime.now(timezone.utc).isoformat(),
            "changed_by": current_user.id
        }
        campaign_history.append(history_entry)
    
    # Update lead
    update_data = {
        "campaign_id": campaign_id,
        "campaign_history": campaign_history,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    updated_lead = await db.leads.find_one({"id": lead_id})
    return Lead(**updated_lead)

# Campaign routes
@api_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign_data: CampaignCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.AGENT]:
        raise HTTPException(status_code=403, detail="Not authorized to create campaigns")
    
    campaign_dict = campaign_data.dict(exclude={"lead_ids"})
    campaign_dict["created_by"] = current_user.id
    campaign_dict["total_leads"] = len(campaign_data.lead_ids)
    campaign_obj = Campaign(**campaign_dict)
    campaign_dict = prepare_for_mongo(campaign_obj.dict())
    
    # Insert campaign
    await db.campaigns.insert_one(campaign_dict)
    
    # Create campaign-lead relationships
    for lead_id in campaign_data.lead_ids:
        # Verify lead exists
        lead = await db.leads.find_one({"id": lead_id})
        if lead:
            campaign_lead = CampaignLead(
                campaign_id=campaign_obj.id,
                lead_id=lead_id,
                assigned_agent=current_user.id if current_user.role == UserRole.AGENT else None
            )
            campaign_lead_dict = prepare_for_mongo(campaign_lead.dict())
            await db.campaign_leads.insert_one(campaign_lead_dict)
    
    return campaign_obj

@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns(current_user: User = Depends(get_current_user)):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.AGENT:
        # Get campaigns where user is assigned as agent
        campaign_leads = await db.campaign_leads.find({"assigned_agent": current_user.id}).to_list(1000)
        campaign_ids = [cl["campaign_id"] for cl in campaign_leads]
        query["id"] = {"$in": campaign_ids}
    elif current_user.role == UserRole.CLIENT:
        query["created_by"] = current_user.id
    
    campaigns = await db.campaigns.find(query).to_list(1000)
    return [Campaign(**campaign) for campaign in campaigns]

@api_router.post("/campaigns/{campaign_id}/start", response_model=NextLeadResponse)
async def start_campaign_agent(campaign_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.AGENT:
        raise HTTPException(status_code=403, detail="Only agents can start campaigns")
    
    # Find campaign
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Find next available lead for this agent
    next_campaign_lead = await db.campaign_leads.find_one({
        "campaign_id": campaign_id,
        "assigned_agent": current_user.id,
        "status": CampaignLeadStatus.PENDING,
        "attempts_made": {"$lt": 3}
    })
    
    if not next_campaign_lead:
        raise HTTPException(status_code=404, detail="No available leads in this campaign")
    
    # Get lead details
    lead = await db.leads.find_one({"id": next_campaign_lead["lead_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Update campaign lead status
    await db.campaign_leads.update_one(
        {"id": next_campaign_lead["id"]},
        {
            "$set": {
                "status": CampaignLeadStatus.IN_PROGRESS,
                "next_attempt_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update the campaign_lead object
    next_campaign_lead["status"] = CampaignLeadStatus.IN_PROGRESS
    next_campaign_lead["next_attempt_at"] = datetime.now(timezone.utc)
    
    return NextLeadResponse(
        campaign_lead=CampaignLead(**next_campaign_lead),
        lead=Lead(**lead),
        message="Next lead ready for contact"
    )

# Call logging routes
@api_router.post("/calls", response_model=CallLog)
async def log_call(call_data: CallLogCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.AGENT:
        raise HTTPException(status_code=403, detail="Only agents can log calls")
    
    # Get campaign lead
    campaign_lead = await db.campaign_leads.find_one({"id": call_data.campaign_lead_id})
    if not campaign_lead:
        raise HTTPException(status_code=404, detail="Campaign lead not found")
    
    # Create call log
    call_dict = call_data.dict()
    call_dict["agent_id"] = current_user.id
    call_obj = CallLog(**call_dict)
    call_dict = prepare_for_mongo(call_obj.dict())
    
    await db.call_logs.insert_one(call_dict)
    
    # Update campaign lead
    new_attempts = campaign_lead["attempts_made"] + 1
    update_data = {
        "attempts_made": new_attempts,
        "last_attempt_at": datetime.now(timezone.utc).isoformat(),
        "last_call_outcome": call_data.outcome,
    }
    
    # Set status based on outcome and attempts
    if call_data.outcome == CallOutcome.ANSWERED:
        update_data["status"] = CampaignLeadStatus.COMPLETED
    elif new_attempts >= 3:
        update_data["status"] = CampaignLeadStatus.FAILED
    else:
        # Schedule next attempt (example: 1 hour later)
        next_attempt = datetime.now(timezone.utc) + timedelta(hours=1)
        update_data["next_attempt_at"] = next_attempt.isoformat()
        update_data["status"] = CampaignLeadStatus.PENDING
    
    await db.campaign_leads.update_one(
        {"id": call_data.campaign_lead_id},
        {"$set": update_data}
    )
    
    # Update campaign completed count if lead is completed
    if update_data["status"] == CampaignLeadStatus.COMPLETED:
        await db.campaigns.update_one(
            {"id": campaign_lead["campaign_id"]},
            {"$inc": {"completed_leads": 1}}
        )
    
    return call_obj

@api_router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str, current_user: User = Depends(get_current_user)):
    # Get campaign
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get campaign leads stats
    total_leads = await db.campaign_leads.count_documents({"campaign_id": campaign_id})
    completed_leads = await db.campaign_leads.count_documents({
        "campaign_id": campaign_id,
        "status": CampaignLeadStatus.COMPLETED
    })
    in_progress_leads = await db.campaign_leads.count_documents({
        "campaign_id": campaign_id,
        "status": CampaignLeadStatus.IN_PROGRESS
    })
    failed_leads = await db.campaign_leads.count_documents({
        "campaign_id": campaign_id,
        "status": CampaignLeadStatus.FAILED
    })
    
    # Get call outcomes distribution
    call_logs_pipeline = [
        {
            "$lookup": {
                "from": "campaign_leads",
                "localField": "campaign_lead_id",
                "foreignField": "id",
                "as": "campaign_lead"
            }
        },
        {
            "$match": {
                "campaign_lead.campaign_id": campaign_id
            }
        },
        {
            "$group": {
                "_id": "$outcome",
                "count": {"$sum": 1}
            }
        }
    ]
    
    call_outcomes = {}
    async for result in db.call_logs.aggregate(call_logs_pipeline):
        call_outcomes[result["_id"]] = result["count"]
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign["name"],
        "total_leads": total_leads,
        "completed_leads": completed_leads,
        "in_progress_leads": in_progress_leads,
        "failed_leads": failed_leads,
        "pending_leads": total_leads - completed_leads - in_progress_leads - failed_leads,
        "call_outcomes": call_outcomes,
        "conversion_rate": (completed_leads / total_leads * 100) if total_leads > 0 else 0
    }

@api_router.put("/campaigns/{campaign_id}", response_model=Campaign)
async def update_campaign(campaign_id: str, campaign_data: CampaignCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.AGENT]:
        raise HTTPException(status_code=403, detail="Not authorized to update campaigns")
    
    # Find existing campaign
    existing_campaign = await db.campaigns.find_one({"id": campaign_id})
    if not existing_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check permissions (only creator or admin can edit)
    if current_user.role != UserRole.ADMIN and existing_campaign["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this campaign")
    
    # Update campaign basic info
    update_data = {
        "name": campaign_data.name,
        "description": campaign_data.description,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Handle lead changes if provided
    if hasattr(campaign_data, 'lead_ids') and campaign_data.lead_ids is not None:
        # Get current campaign leads
        current_leads = await db.campaign_leads.find({"campaign_id": campaign_id}).to_list(1000)
        current_lead_ids = {cl["lead_id"] for cl in current_leads}
        new_lead_ids = set(campaign_data.lead_ids)
        
        # Remove leads that are no longer in the campaign
        leads_to_remove = current_lead_ids - new_lead_ids
        if leads_to_remove:
            await db.campaign_leads.delete_many({
                "campaign_id": campaign_id,
                "lead_id": {"$in": list(leads_to_remove)},
                "status": {"$in": ["pending"]}  # Only remove pending leads
            })
        
        # Add new leads to the campaign
        leads_to_add = new_lead_ids - current_lead_ids
        for lead_id in leads_to_add:
            # Verify lead exists
            lead = await db.leads.find_one({"id": lead_id})
            if lead:
                campaign_lead = CampaignLead(
                    campaign_id=campaign_id,
                    lead_id=lead_id,
                    assigned_agent=current_user.id if current_user.role == UserRole.AGENT else None
                )
                campaign_lead_dict = prepare_for_mongo(campaign_lead.dict())
                await db.campaign_leads.insert_one(campaign_lead_dict)
        
        # Update total leads count
        total_leads_count = await db.campaign_leads.count_documents({"campaign_id": campaign_id})
        update_data["total_leads"] = total_leads_count
    
    update_data = prepare_for_mongo(update_data)
    await db.campaigns.update_one({"id": campaign_id}, {"$set": update_data})
    
    # Return updated campaign
    updated_campaign = await db.campaigns.find_one({"id": campaign_id})
    return Campaign(**updated_campaign)

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.AGENT]:
        raise HTTPException(status_code=403, detail="Not authorized to delete campaigns")
    
    # Find existing campaign
    existing_campaign = await db.campaigns.find_one({"id": campaign_id})
    if not existing_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check permissions (only creator or admin can delete)
    if current_user.role != UserRole.ADMIN and existing_campaign["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this campaign")
    
    # Check if campaign has active calls
    active_campaign_leads = await db.campaign_leads.find({
        "campaign_id": campaign_id,
        "status": "in_progress"
    }).to_list(10)
    
    if active_campaign_leads:
        raise HTTPException(status_code=400, detail="Cannot delete campaign with calls in progress")
    
    # Delete campaign leads and call logs
    await db.campaign_leads.delete_many({"campaign_id": campaign_id})
    
    # Delete call logs for this campaign
    campaign_lead_ids = await db.campaign_leads.find({"campaign_id": campaign_id}).to_list(1000)
    if campaign_lead_ids:
        campaign_lead_id_list = [cl["id"] for cl in campaign_lead_ids]
        await db.call_logs.delete_many({"campaign_lead_id": {"$in": campaign_lead_id_list}})
    
    # Delete the campaign
    await db.campaigns.delete_one({"id": campaign_id})
    
    return {"message": "Campaign deleted successfully"}

# Meetings routes
@api_router.post("/meetings", response_model=Meeting)
async def create_meeting(meeting_data: MeetingCreate, current_user: User = Depends(get_current_user)):
    # Calculate end time
    start_time = meeting_data.start_time
    end_time = start_time + timedelta(minutes=meeting_data.duration_minutes)
    
    # Check for conflicts (same user, overlapping time)
    conflict_query = {
        "organizer_id": current_user.id,
        "status": {"$in": ["confirmed", "proposed"]},
        "$or": [
            {
                "start_time": {"$lte": start_time.isoformat()},
                "end_time": {"$gte": start_time.isoformat()}
            },
            {
                "start_time": {"$lte": end_time.isoformat()},
                "end_time": {"$gte": end_time.isoformat()}
            }
        ]
    }
    
    existing_meeting = await db.meetings.find_one(conflict_query)
    if existing_meeting:
        raise HTTPException(status_code=400, detail="Time slot conflicts with existing meeting")
    
    # Create meeting
    meeting_dict = meeting_data.dict(exclude={"duration_minutes"})
    meeting_dict.update({
        "organizer_id": current_user.id,
        "end_time": end_time,
        "status": MeetingStatus.CONFIRMED
    })
    
    meeting_obj = Meeting(**meeting_dict)
    meeting_dict = prepare_for_mongo(meeting_obj.dict())
    
    await db.meetings.insert_one(meeting_dict)
    return meeting_obj

@api_router.post("/meetings/propose")
async def propose_meeting(proposal: MeetingProposal, current_user: User = Depends(get_current_user)):
    start_time = proposal.requested_time
    end_time = start_time + timedelta(minutes=proposal.duration_minutes)
    
    # Check for conflicts
    conflict_query = {
        "organizer_id": current_user.id,
        "status": {"$in": ["confirmed", "proposed"]},
        "$or": [
            {
                "start_time": {"$lte": start_time.isoformat()},
                "end_time": {"$gte": start_time.isoformat()}
            },
            {
                "start_time": {"$lte": end_time.isoformat()},
                "end_time": {"$gte": end_time.isoformat()}
            }
        ]
    }
    
    existing_meeting = await db.meetings.find_one(conflict_query)
    
    if not existing_meeting:
        # No conflict, create confirmed meeting
        meeting = Meeting(
            lead_id=proposal.lead_id,
            organizer_id=current_user.id,
            title=proposal.title or f"Meeting with Lead",
            start_time=start_time,
            end_time=end_time,
            notes=proposal.notes,
            status=MeetingStatus.CONFIRMED
        )
        meeting_dict = prepare_for_mongo(meeting.dict())
        await db.meetings.insert_one(meeting_dict)
        
        return {
            "status": "confirmed",
            "meeting": meeting,
            "message": "Meeting confirmed for requested time"
        }
    else:
        # Conflict exists, suggest alternative times
        # Simple logic: suggest 3 slots after the requested time
        alternatives = []
        for i in range(1, 4):
            alt_start = start_time + timedelta(hours=i)
            alt_end = alt_start + timedelta(minutes=proposal.duration_minutes)
            
            # Check if this alternative slot is free
            alt_conflict_query = {
                "organizer_id": current_user.id,
                "status": {"$in": ["confirmed", "proposed"]},
                "$or": [
                    {
                        "start_time": {"$lte": alt_start.isoformat()},
                        "end_time": {"$gte": alt_start.isoformat()}
                    },
                    {
                        "start_time": {"$lte": alt_end.isoformat()},
                        "end_time": {"$gte": alt_end.isoformat()}
                    }
                ]
            }
            
            alt_conflict = await db.meetings.find_one(alt_conflict_query)
            if not alt_conflict:
                alternatives.append({
                    "start_time": alt_start.isoformat(),
                    "end_time": alt_end.isoformat()
                })
        
        return {
            "status": "conflict",
            "message": "Requested time conflicts with existing meeting",
            "conflicting_meeting_id": existing_meeting["id"],
            "suggested_alternatives": alternatives
        }

@api_router.get("/meetings", response_model=List[Meeting])
async def get_meetings(current_user: User = Depends(get_current_user)):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.AGENT:
        query["organizer_id"] = current_user.id
    elif current_user.role == UserRole.CLIENT:
        query["organizer_id"] = current_user.id
    # Admin can see all meetings
    
    meetings = await db.meetings.find(query).sort("start_time", 1).to_list(1000)
    return [Meeting(**meeting) for meeting in meetings]

@api_router.put("/meetings/{meeting_id}", response_model=Meeting)
async def update_meeting(meeting_id: str, meeting_data: MeetingCreate, current_user: User = Depends(get_current_user)):
    existing_meeting = await db.meetings.find_one({"id": meeting_id})
    if not existing_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this meeting")
    
    # Update meeting
    update_data = meeting_data.dict(exclude={"duration_minutes"})
    update_data.update({
        "end_time": meeting_data.start_time + timedelta(minutes=meeting_data.duration_minutes),
        "updated_at": datetime.now(timezone.utc)
    })
    update_data = prepare_for_mongo(update_data)
    
    await db.meetings.update_one({"id": meeting_id}, {"$set": update_data})
    
    updated_meeting = await db.meetings.find_one({"id": meeting_id})
    return Meeting(**updated_meeting)

@api_router.patch("/meetings/{meeting_id}/status")
async def update_meeting_status(
    meeting_id: str, 
    status: MeetingStatus,
    current_user: User = Depends(get_current_user)
):
    existing_meeting = await db.meetings.find_one({"id": meeting_id})
    if not existing_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this meeting")
    
    # Update status
    await db.meetings.update_one(
        {"id": meeting_id}, 
        {"$set": {
            "status": status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_meeting = await db.meetings.find_one({"id": meeting_id})
    return Meeting(**updated_meeting)

@api_router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, current_user: User = Depends(get_current_user)):
    existing_meeting = await db.meetings.find_one({"id": meeting_id})
    if not existing_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and existing_meeting["organizer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this meeting")
    
    await db.meetings.delete_one({"id": meeting_id})
    return {"message": "Meeting deleted successfully"}

# Support Tickets routes
@api_router.post("/tickets", response_model=SupportTicket)
async def create_ticket(ticket_data: TicketCreate, current_user: User = Depends(get_current_user)):
    ticket_dict = ticket_data.dict()
    ticket_dict["created_by"] = current_user.id
    
    ticket_obj = SupportTicket(**ticket_dict)
    ticket_dict = prepare_for_mongo(ticket_obj.dict())
    
    await db.tickets.insert_one(ticket_dict)
    return ticket_obj

@api_router.get("/tickets", response_model=List[SupportTicket])
async def get_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.CLIENT:
        query["created_by"] = current_user.id
    elif current_user.role == UserRole.AGENT:
        # Agents can see tickets assigned to them or unassigned tickets
        query["$or"] = [
            {"assigned_to": current_user.id},
            {"assigned_to": None}
        ]
    # Admin can see all tickets
    
    # Additional filters
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tickets = await db.tickets.find(query).sort("created_at", -1).to_list(1000)
    return [SupportTicket(**ticket) for ticket in tickets]

@api_router.put("/tickets/{ticket_id}", response_model=SupportTicket)
async def update_ticket(ticket_id: str, ticket_data: TicketUpdate, current_user: User = Depends(get_current_user)):
    existing_ticket = await db.tickets.find_one({"id": ticket_id})
    if not existing_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == UserRole.CLIENT and existing_ticket["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
    
    # Prepare update data
    update_data = {k: v for k, v in ticket_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Handle status changes
    if ticket_data.status == TicketStatus.RESOLVED and existing_ticket["status"] != TicketStatus.RESOLVED:
        update_data["resolved_at"] = datetime.now(timezone.utc)
    
    update_data = prepare_for_mongo(update_data)
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_data})
    
    updated_ticket = await db.tickets.find_one({"id": ticket_id})
    return SupportTicket(**updated_ticket)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging (kept near top of module behavior)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Startup event: verify DB connectivity and create simple indexes
@app.on_event("startup")
async def startup_db_checks():
    try:
        await client.admin.command("ping")
        logger.info("Connected to MongoDB at %s (DB: %s)", mongo_url, db_name)

        # Create common indexes if they don't exist (id/email uniqueness)
        await db.users.create_index("email", unique=True)
        await db.leads.create_index("id", unique=True)
        await db.campaigns.create_index("id", unique=True)
        await db.campaign_leads.create_index("id", unique=True)
        await db.call_logs.create_index("id", unique=True)
        await db.meetings.create_index("id", unique=True)
        await db.tickets.create_index("id", unique=True)
    except Exception as e:
        # Better, actionable error message for local macOS users
        logger.warning("MongoDB connectivity check failed: %s", str(e))
        if os.environ.get("SKIP_DB_CHECK") == "1":
            logger.info("SKIP_DB_CHECK=1 set — continuing without blocking startup (requests will fail if DB is used).")
            return
        logger.error(
            "MongoDB is not reachable. Options to fix:\n"
            "1) Start Docker Desktop (if using Docker) and then run:\n"
            "   open --background -a Docker && docker run -d --name mongo -p 27017:27017 mongo\n"
            "2) Install & start MongoDB via Homebrew:\n"
            "   brew tap mongodb/brew\n"
            "   brew install mongodb-community@6.0\n"
            "   brew services start mongodb-community@6.0\n"
            "3) Use MongoDB Atlas and set MONGO_URL in backend/.env, e.g.:\n"
            "   MONGO_URL='mongodb+srv://<user>:<pass>@cluster0.example.mongodb.net'\n\n"
            "After starting MongoDB, restart the backend:\n"
            "   uvicorn backend.server:app --reload --host 127.0.0.1 --port 8000\n"
        )
        # Do not raise here so developer can see logs; set SKIP_DB_CHECK=1 to bypass check.

# Allow running the app directly for local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", 8000)),
        reload=True
    )

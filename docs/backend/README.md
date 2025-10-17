# 🐍 Backend Documentation

Documentation for the CRM Chatbot FastAPI backend.

---

## 🛠 Tech Stack

- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver
- **MongoDB Atlas** - Cloud database
- **JWT** - Authentication
- **Pydantic** - Data validation
- **Bcrypt** - Password hashing
- **Python 3.11** - Runtime

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── models/          → Data models (Pydantic)
│   │   ├── user.py
│   │   ├── lead.py
│   │   ├── campaign.py
│   │   ├── meeting.py
│   │   ├── ticket.py
│   │   └── enums.py
│   ├── repositories/    → Database operations
│   │   ├── user_repository.py
│   │   ├── lead_repository.py
│   │   ├── campaign_repository.py
│   │   ├── meeting_repository.py
│   │   └── ticket_repository.py
│   ├── routers/         → API endpoints
│   │   ├── auth.py
│   │   ├── leads.py
│   │   ├── campaigns.py
│   │   ├── meetings.py
│   │   └── tickets.py
│   ├── services/        → Business logic
│   │   ├── auth_service.py
│   │   ├── lead_service.py
│   │   ├── campaign_service.py
│   │   ├── meeting_service.py
│   │   └── ticket_service.py
│   ├── utils/           → Utilities
│   │   ├── auth.py
│   │   └── helpers.py
│   ├── config.py        → Configuration
│   ├── database.py      → Database connection
│   ├── dependencies.py  → FastAPI dependencies
│   └── main.py          → Application entry point
├── requirements.txt     → Python dependencies
├── run.py              → Development server
├── env.template        → Environment template
└── test_mongodb_connection.py
```

---

## 🏗️ Architecture

### Layer Pattern

```
Routers (API)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (MongoDB)
```

### Key Concepts

- **Routers**: Handle HTTP requests, validation
- **Services**: Business logic, orchestration
- **Repositories**: Database CRUD operations
- **Models**: Data schemas with validation
- **Dependencies**: Shared functionality (auth, etc.)

---

## 🚀 Quick Start

### Local Development

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp env.template .env
# Edit .env with your values

# Run server
python run.py

# Server runs on: http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Environment Variables

See [env.template](../../backend/env.template) for all variables.

Required:

```env
MONGO_URL=mongodb+srv://...
DB_NAME=crm_db
JWT_SECRET_KEY=<generate-secure-key>
```

---

## 🔐 Authentication

### JWT Flow

```python
# 1. User registers/logs in
POST /api/auth/register
POST /api/auth/login

# 2. Receive JWT token
{"access_token": "eyJ...", "user": {...}}

# 3. Include in subsequent requests
Headers: {"Authorization": "Bearer eyJ..."}

# 4. Validate on protected routes
@router.get("/protected")
async def protected(current_user: User = Depends(get_current_user)):
    return {"user": current_user}
```

### Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])
hashed = pwd_context.hash(password)
is_valid = pwd_context.verify(password, hashed)
```

---

## 📊 Database Models

### User

- Authentication & profile
- Roles: admin, agent, client
- Fields: email, password, name, role

### Lead

- Customer leads
- Fields: name, email, phone, status, source

### Campaign

- Marketing campaigns
- Fields: name, type, status, metrics

### Meeting

- Scheduled meetings
- Fields: title, date, participants, notes

### Ticket

- Support tickets
- Fields: subject, description, priority, status

---

## 🌐 API Endpoints

### Authentication

```
POST   /api/auth/register  - Register new user
POST   /api/auth/login     - Login user
GET    /api/auth/me        - Get current user
```

### Leads

```
GET    /api/leads          - List leads
POST   /api/leads          - Create lead
GET    /api/leads/{id}     - Get lead
PUT    /api/leads/{id}     - Update lead
DELETE /api/leads/{id}     - Delete lead
```

### Campaigns

```
GET    /api/campaigns      - List campaigns
POST   /api/campaigns      - Create campaign
GET    /api/campaigns/{id} - Get campaign
PUT    /api/campaigns/{id} - Update campaign
DELETE /api/campaigns/{id} - Delete campaign
```

### Meetings

```
GET    /api/meetings       - List meetings
POST   /api/meetings       - Create meeting
GET    /api/meetings/{id}  - Get meeting
PUT    /api/meetings/{id}  - Update meeting
DELETE /api/meetings/{id}  - Delete meeting
```

### Tickets

```
GET    /api/tickets        - List tickets
POST   /api/tickets        - Create ticket
GET    /api/tickets/{id}   - Get ticket
PUT    /api/tickets/{id}   - Update ticket
DELETE /api/tickets/{id}   - Delete ticket
```

Full API docs: http://localhost:8000/docs

---

## 🔧 Configuration

### Settings (config.py)

```python
class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    jwt_secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    cors_origins: str
    host: str
    port: int
```

Loads from environment variables or `.env` file.

---

## 🗄️ Database Operations

### Repository Pattern

```python
class LeadRepository:
    async def create(self, lead: LeadCreate) -> Lead:
        # Insert into database

    async def get_by_id(self, lead_id: str) -> Lead:
        # Retrieve from database

    async def update(self, lead_id: str, updates: dict) -> Lead:
        # Update in database

    async def delete(self, lead_id: str) -> bool:
        # Delete from database
```

### Service Layer

```python
class LeadService:
    def __init__(self, repo: LeadRepository):
        self.repo = repo

    async def create_lead(self, data: LeadCreate) -> Lead:
        # Business logic
        lead = await self.repo.create(data)
        # Send notifications, etc.
        return lead
```

---

## 🧪 Testing

```bash
# Test MongoDB connection
python test_mongodb_connection.py

# Run API tests
pytest

# Check code style
flake8 app/
black app/ --check
mypy app/
```

---

## 🚀 Deployment

See [../deployment/](../deployment/) for complete deployment guides.

### Quick Deploy to Render

1. Set Root Directory: `backend`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy!

---

## 🔧 Troubleshooting

### MongoDB Connection Issues

```bash
# Test connection
python test_mongodb_connection.py

# Check:
# - Connection string correct?
# - Password URL-encoded?
# - IP whitelist includes your IP?
# - Cluster not paused?
```

### Import Errors

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use

```bash
# Find process on port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

---

## 📖 Architecture Details

For detailed architecture documentation, see:

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system design

---

## 🎯 Development Tips

1. **Use Type Hints**: Python 3.11+ type hints everywhere
2. **Pydantic Models**: Validate all data
3. **Async/Await**: Use async for I/O operations
4. **Repository Pattern**: Separate data access
5. **Service Layer**: Business logic isolation
6. **Dependency Injection**: FastAPI Depends()
7. **Error Handling**: Proper HTTP exceptions
8. **Logging**: Use logging module
9. **Documentation**: Write docstrings
10. **Testing**: Write tests for critical paths

---

## 📚 Additional Resources

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Motor Docs](https://motor.readthedocs.io)
- [Pydantic Docs](https://docs.pydantic.dev)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)
- [Deployment Guide](../deployment/START_DEPLOYMENT_HERE.md)

---

**Need help? Check the main [docs README](../README.md) or deployment guides!**

# CRM Backend - Refactored Structure

This document describes the new organized structure of the CRM backend after refactoring from a single `server.py` file.

## 🏗️ New Directory Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py              # Package initialization
│   ├── main.py                  # FastAPI app initialization
│   ├── config.py                # Configuration settings
│   ├── database.py             # Database connection
│   ├── dependencies.py         # FastAPI dependencies
│   ├── models/                 # Pydantic models
│   │   ├── __init__.py
│   │   ├── enums.py            # Enumeration definitions
│   │   ├── user.py             # User models
│   │   ├── lead.py             # Lead models
│   │   ├── campaign.py         # Campaign models
│   │   ├── meeting.py          # Meeting models
│   │   └── ticket.py           # Ticket models
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── lead_repository.py
│   │   ├── campaign_repository.py
│   │   ├── meeting_repository.py
│   │   └── ticket_repository.py
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── lead_service.py
│   │   ├── campaign_service.py
│   │   ├── meeting_service.py
│   │   └── ticket_service.py
│   ├── routers/                # API routes
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication routes
│   │   ├── leads.py            # Lead management routes
│   │   ├── campaigns.py        # Campaign routes
│   │   ├── meetings.py         # Meeting routes
│   │   └── tickets.py          # Support ticket routes
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── auth.py             # Authentication utilities
│       └── helpers.py          # Helper functions
├── tests/                      # Test files
├── requirements.txt            # Dependencies
├── run.py                     # Application entry point
└── README_REFACTORED.md       # This file
```

## 🎯 Key Improvements

### 1. **Separation of Concerns**

- **Models**: Data structures and validation
- **Repositories**: Database operations
- **Services**: Business logic and rules
- **Routers**: API endpoints only
- **Utils**: Reusable functions

### 2. **Better Maintainability**

- Easy to find specific functionality
- Changes in one area don't affect others
- Clear separation between layers
- Comprehensive documentation

### 3. **Improved Scalability**

- Easy to add new features
- Team members can work on different modules
- Better code reusability
- Cleaner dependency management

### 4. **Enhanced Testing**

- Each layer can be tested independently
- Mock dependencies easily
- Better test coverage
- Isolated unit tests

## 🚀 How to Run

### Option 1: Using the new run script

```bash
cd backend
python run.py
```

### Option 2: Using uvicorn directly

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Option 3: Using the main module

```bash
cd backend
python -m app.main
```

## 📋 API Endpoints (Unchanged)

All API endpoints remain exactly the same:

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Leads

- `GET /api/leads` - Get leads
- `POST /api/leads` - Create lead
- `GET /api/leads/{lead_id}` - Get lead by ID
- `PUT /api/leads/{lead_id}` - Update lead
- `DELETE /api/leads/{lead_id}` - Delete lead
- `POST /api/leads/upload-csv` - Upload leads from CSV
- `PATCH /api/leads/{lead_id}/campaign` - Update lead campaign

### Campaigns

- `GET /api/campaigns` - Get campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/{campaign_id}/start` - Start campaign
- `POST /api/calls` - Log call
- `GET /api/campaigns/{campaign_id}/stats` - Get campaign stats
- `PUT /api/campaigns/{campaign_id}` - Update campaign
- `DELETE /api/campaigns/{campaign_id}` - Delete campaign

### Meetings

- `GET /api/meetings` - Get meetings
- `POST /api/meetings` - Create meeting
- `POST /api/meetings/propose` - Propose meeting
- `GET /api/meetings/{meeting_id}` - Get meeting by ID
- `PUT /api/meetings/{meeting_id}` - Update meeting
- `PATCH /api/meetings/{meeting_id}/status` - Update meeting status
- `DELETE /api/meetings/{meeting_id}` - Delete meeting

### Support Tickets

- `GET /api/tickets` - Get tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/{ticket_id}` - Get ticket by ID
- `PUT /api/tickets/{ticket_id}` - Update ticket
- `DELETE /api/tickets/{ticket_id}` - Delete ticket
- `GET /api/tickets/stats/overview` - Get ticket statistics

## 🔧 Configuration

The application uses environment variables for configuration. Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=crm_db

# Security Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS Configuration
CORS_ORIGINS=*

# Server Configuration
HOST=127.0.0.1
PORT=8000

# Development flags
SKIP_DB_CHECK=false
```

## 🧪 Testing

The refactored structure makes testing much easier:

```python
# Example test for a service
from app.services.lead_service import LeadService
from app.repositories.lead_repository import LeadRepository

# Mock the repository
mock_repo = Mock(spec=LeadRepository)
service = LeadService(mock_repo, mock_user_repo)

# Test business logic
result = await service.create_lead(lead_data, user)
```

## 📚 Benefits of the New Structure

1. **Maintainability**: Easy to find and modify specific functionality
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new features without affecting existing code
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Code Reusability**: Services and repositories can be reused
6. **Documentation**: Each module is well-documented with docstrings
7. **Type Safety**: Better type hints and validation
8. **Error Handling**: Centralized error handling and logging

## 🔄 Migration Notes

- All existing API endpoints work exactly the same
- No changes needed in the frontend
- Database schema remains unchanged
- Authentication flow is identical
- All business logic is preserved

## 🎉 Next Steps

1. **Add Unit Tests**: Create comprehensive test coverage
2. **Add Integration Tests**: Test API endpoints end-to-end
3. **Add Logging**: Implement structured logging
4. **Add Monitoring**: Add health checks and metrics
5. **Add Documentation**: Generate API documentation with FastAPI
6. **Add Validation**: Enhanced input validation
7. **Add Caching**: Implement caching for better performance

The refactored backend is now much more maintainable, scalable, and follows best practices for FastAPI applications!

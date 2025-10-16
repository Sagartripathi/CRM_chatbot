# CRM Chatbot Application

A modern Customer Relationship Management (CRM) system with AI-powered chatbot capabilities built with FastAPI (backend) and React (frontend).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Additional Documentation](#additional-documentation)

---

## ✨ Features

- 👥 **User Management** - Admin, Agent, and Client roles with authentication
- 📞 **Lead Management** - Track and manage customer leads
- 📧 **Campaign Management** - Create and monitor marketing campaigns
- 📅 **Meeting Scheduling** - Schedule and track meetings with leads
- 🎫 **Support Tickets** - Manage customer support requests
- 🔐 **JWT Authentication** - Secure authentication with role-based access
- ☁️ **Cloud Database** - MongoDB Atlas for scalable data storage

---

## 🛠 Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Motor** - Async MongoDB driver
- **JWT** - JSON Web Token authentication
- **Pydantic** - Data validation
- **Bcrypt** - Password hashing

### Frontend

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Component library

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 16+
- MongoDB Atlas account (free tier)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CRM_chatbot
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp env.template .env

# Edit .env file with your MongoDB Atlas credentials
# See Configuration section below
```

#### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (M0 Free tier)
3. Create a database user
4. Whitelist your IP address
5. Get your connection string
6. Update `backend/.env` with your connection string

See `docs/START_HERE.md` for detailed MongoDB Atlas setup instructions.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start
```

### 4. Run the Application

**Backend:**

```bash
cd backend
source .venv/bin/activate
python run.py
```

Backend will run on: http://localhost:8000

**Frontend:**

```bash
cd frontend
npm start
```

Frontend will run on: http://localhost:3000

---

## 📁 Project Structure

```
CRM_chatbot/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic models
│   │   ├── repositories/    # Database operations
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database connection
│   │   └── main.py          # FastAPI app
│   ├── .env                 # Environment variables (not in git)
│   ├── env.template         # Template for .env
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Application entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                    # Documentation
│   ├── START_HERE.md       # Getting started guide
│   ├── SETUP_CHECKLIST.md  # Setup checklist
│   └── reference/          # Reference materials
│
└── README.md               # This file
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` file with the following variables:

```env
# MongoDB Atlas Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db

# Security Configuration
JWT_SECRET_KEY=your-generated-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Configuration
HOST=127.0.0.1
PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Generate JWT Secret Key

```bash
cd backend
source .venv/bin/activate
python generate_secret_key.py
```

Copy the generated key to `JWT_SECRET_KEY` in your `.env` file.

### MongoDB Atlas Connection String

Your MongoDB Atlas connection string should look like:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**Important:**

- Replace `<username>`, `<password>`, and `<cluster>` with your actual values
- URL encode special characters in password (@ → %40, ! → %21, etc.)

---

## 📚 API Documentation

Once the backend is running, visit:

- **Interactive API Docs (Swagger):** http://localhost:8000/docs
- **Alternative API Docs (ReDoc):** http://localhost:8000/redoc

### Main Endpoints

| Endpoint             | Method   | Description            |
| -------------------- | -------- | ---------------------- |
| `/api/auth/register` | POST     | Register new user      |
| `/api/auth/login`    | POST     | Login user             |
| `/api/auth/me`       | GET      | Get current user       |
| `/api/leads`         | GET/POST | Manage leads           |
| `/api/campaigns`     | GET/POST | Manage campaigns       |
| `/api/meetings`      | GET/POST | Manage meetings        |
| `/api/tickets`       | GET/POST | Manage support tickets |

### User Registration

```json
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "your_password",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```

### User Login

```json
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Response includes JWT token for authenticated requests.

---

## 🧪 Testing

### Test MongoDB Connection

```bash
cd backend
source .venv/bin/activate
python test_mongodb_connection.py
```

This will verify:

- ✅ Database connection
- ✅ Authentication
- ✅ Read/write operations
- ✅ Server information

### Health Check

```bash
curl http://localhost:8000/api/health
```

---

## 🚢 Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend Deployment

1. Build: `npm run build`
2. Deploy the `build/` directory to your hosting platform

### Environment Variables for Production

Update these in production:

```env
# Use strong, unique secret key
JWT_SECRET_KEY=<generate-new-strong-key>

# Update CORS to your production domain
CORS_ORIGINS=https://yourdomain.com

# Consider using 0.0.0.0 to accept external connections
HOST=0.0.0.0
```

---

## 🐛 Troubleshooting

### Backend won't start

**Issue:** Port 8000 already in use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### CORS Errors

If you see CORS errors in the browser:

1. Check `CORS_ORIGINS` in `backend/.env`
2. Ensure it includes your frontend URL (e.g., `http://localhost:3000`)
3. Restart the backend server

### MongoDB Connection Failed

1. Verify MongoDB Atlas credentials in `.env`
2. Check IP whitelist in MongoDB Atlas (Network Access)
3. Test connection: `python test_mongodb_connection.py`
4. Ensure special characters in password are URL encoded

### Login Returns 401 Unauthorized

**Common cause:** User missing required fields

**Solution:** Users must be registered with these required fields:

- `email`
- `password`
- `first_name` ← Required
- `last_name` ← Required
- `role`

---

## 📖 Additional Documentation

### Setup Guides

- **[START_HERE.md](docs/START_HERE.md)** - Quick start guide for MongoDB Atlas setup
- **[SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md)** - Complete setup checklist
- **[SETUP_COMPLETE.md](docs/SETUP_COMPLETE.md)** - Configuration summary

### Reference

- **[MONGODB_ATLAS_QUICKSTART.md](docs/MONGODB_ATLAS_QUICKSTART.md)** - Detailed MongoDB Atlas guide
- **[MONGODB_ATLAS_QUICK_REFERENCE.md](docs/MONGODB_ATLAS_QUICK_REFERENCE.md)** - Quick reference card

### Backend Reference

- **[README_REFACTORED.md](backend/README_REFACTORED.md)** - Backend architecture details

---

## 🛠 Utility Scripts

### Backend Utilities

| Script                       | Purpose                        |
| ---------------------------- | ------------------------------ |
| `test_mongodb_connection.py` | Test MongoDB Atlas connection  |
| `generate_secret_key.py`     | Generate secure JWT secret key |
| `run.py`                     | Start the backend server       |

### Usage

```bash
cd backend
source .venv/bin/activate

# Test database connection
python test_mongodb_connection.py

# Generate JWT secret
python generate_secret_key.py

# Start server
python run.py
```

---

## 🔐 Security Notes

### Important Security Practices

1. **Never commit `.env` file to git** (already in `.gitignore`)
2. **Use strong JWT secret keys** (generate with `generate_secret_key.py`)
3. **Use different secrets for dev/staging/production**
4. **URL encode special characters in MongoDB password**
5. **In production, restrict CORS_ORIGINS to your actual domain**
6. **Keep MongoDB Atlas IP whitelist updated**
7. **Use strong passwords for MongoDB users**

---

## 👥 User Roles

| Role       | Description          | Permissions                     |
| ---------- | -------------------- | ------------------------------- |
| **admin**  | System administrator | Full access to all features     |
| **agent**  | Sales/support agent  | Manage leads, meetings, tickets |
| **client** | End customer         | Limited access                  |

---

## 🔄 Database Schema

### Collections

- **users** - User accounts and authentication
- **leads** - Customer leads
- **campaigns** - Marketing campaigns
- **campaign_leads** - Campaign-lead associations
- **call_logs** - Call history
- **meetings** - Scheduled meetings
- **tickets** - Support tickets

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review documentation in `docs/` folder
3. Check MongoDB Atlas dashboard for database issues
4. Review backend logs for API errors

---

## 📝 License

[Add your license here]

---

## 👨‍💻 For New Engineers

### First Time Setup (Step by Step)

1. **Read this README** - Understand the project structure
2. **Follow Quick Start** - Set up your development environment
3. **Read `docs/START_HERE.md`** - MongoDB Atlas setup
4. **Test the connection** - Run `python test_mongodb_connection.py`
5. **Start both servers** - Backend (port 8000) and Frontend (port 3000)
6. **Create an admin user** - Use `/api/auth/register` endpoint
7. **Login** - Test the login flow
8. **Explore API docs** - Visit http://localhost:8000/docs

### Development Workflow

1. **Backend changes:**

   - Make changes in `backend/app/`
   - Server auto-reloads (using uvicorn --reload)
   - Test via http://localhost:8000/docs

2. **Frontend changes:**

   - Make changes in `frontend/src/`
   - React auto-reloads
   - Test in browser at http://localhost:3000

3. **Database changes:**
   - Models defined in `backend/app/models/`
   - Repositories in `backend/app/repositories/`
   - MongoDB Atlas dashboard for direct database access

### Common Tasks

**Add a new API endpoint:**

1. Create model in `backend/app/models/`
2. Create repository in `backend/app/repositories/`
3. Create service in `backend/app/services/`
4. Create router in `backend/app/routers/`
5. Register router in `backend/app/main.py`

**Add a new frontend page:**

1. Create component in `frontend/src/components/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation in `GlobalSidebar.tsx`

---

## 🎯 Current Status

✅ **Production Ready**

- MongoDB Atlas configured and connected
- Authentication working (registration + login)
- CORS configured for development
- All core features implemented

✅ **Ready for Development**

- Development environment set up
- Hot reload enabled
- API documentation available
- Database indexes created

---

**Last Updated:** October 17, 2025  
**MongoDB:** Atlas Cloud Database  
**Backend:** FastAPI + Python 3.10+  
**Frontend:** React + TypeScript  
**Database:** MongoDB Atlas (Free Tier M0)

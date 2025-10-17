# ⚙️ Setup Documentation

Initial setup and configuration guides for the CRM Chatbot.

---

## 🎯 Start Here

**New to the project?** → [START_HERE.md](START_HERE.md)

This is your complete getting started guide!

---

## 📚 Setup Guides

| Guide                                                   | Purpose                   |
| ------------------------------------------------------- | ------------------------- |
| [Start Here](START_HERE.md)                             | Complete initial setup    |
| [MongoDB Atlas Quickstart](MONGODB_ATLAS_QUICKSTART.md) | Database setup (quick)    |
| [MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md)           | Database setup (detailed) |
| [Setup Checklist](SETUP_CHECKLIST.md)                   | Verify your configuration |
| [Setup Complete](SETUP_COMPLETE.md)                     | Configuration summary     |

---

## 🚀 Quick Setup Path

### 1. Prerequisites

Install these first:

```bash
# Python 3.11+
python3 --version

# Node 18+
node --version

# Yarn
yarn --version

# Git
git --version
```

### 2. Clone & Configure

```bash
# Clone repository
git clone <your-repo-url>
cd CRM_chatbot

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env.template .env
# Edit .env with your values

# Frontend setup
cd ../frontend
yarn install
```

### 3. MongoDB Atlas

Follow: [MONGODB_ATLAS_QUICKSTART.md](MONGODB_ATLAS_QUICKSTART.md)

1. Create free cluster
2. Create database user
3. Whitelist IP (0.0.0.0/0 for now)
4. Get connection string
5. Add to backend/.env

### 4. Test Everything

```bash
# Test MongoDB connection
cd backend
python test_mongodb_connection.py

# Start backend
python run.py
# Should see: "Application startup complete"

# In new terminal, start frontend
cd frontend
yarn start
# Opens http://localhost:3000
```

### 5. Create First User

```bash
# Use the /docs interface at http://localhost:8000/docs
# Or register through frontend at http://localhost:3000
```

---

## 📋 Setup Checklist

Use [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) to verify:

- [ ] Python 3.11+ installed
- [ ] Node 18+ and Yarn installed
- [ ] Git installed
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelisted
- [ ] Connection string in .env
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] MongoDB connection successful
- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] Can create user and login

---

## 🗄️ MongoDB Atlas Setup

### Quick Setup (5 minutes)

1. Go to https://cloud.mongodb.com
2. Sign up / Log in
3. Create free M0 cluster (Shared)
4. Wait 3-5 minutes for provisioning
5. Database Access → Add user
6. Network Access → Allow all (0.0.0.0/0)
7. Connect → Application → Copy string
8. Paste in backend/.env as MONGO_URL

Detailed guide: [MONGODB_ATLAS_QUICKSTART.md](MONGODB_ATLAS_QUICKSTART.md)

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

⚠️ **Important**: URL-encode special characters in password!

- `@` → `%40`
- `!` → `%21`
- `#` → `%23`

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/...
DB_NAME=crm_db

# Security
JWT_SECRET_KEY=<generate-with-script>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server
HOST=127.0.0.1
PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000

# Development
SKIP_DB_CHECK=false
```

Generate JWT secret:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (Optional)

For local development, frontend uses proxy in package.json.
For production, see [deployment docs](../deployment/).

---

## 🐛 Common Setup Issues

### Issue: MongoDB Connection Failed

**Solutions**:

1. Check connection string format
2. Verify password is URL-encoded
3. Ensure IP is whitelisted (0.0.0.0/0)
4. Check cluster is not paused
5. Test: `python test_mongodb_connection.py`

### Issue: Module Not Found

**Solutions**:

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Issue: Port Already in Use

**Solutions**:

```bash
# Find process on port
lsof -i :8000  # or :3000

# Kill it
kill -9 <PID>
```

### Issue: CORS Errors

**Solutions**:

1. Check CORS_ORIGINS in backend/.env
2. Should include: `http://localhost:3000`
3. Restart backend after changing

---

## 📖 Detailed Setup Guides

### Complete Setup

[START_HERE.md](START_HERE.md) - Step-by-step setup for new developers

### MongoDB Setup

- [MONGODB_ATLAS_QUICKSTART.md](MONGODB_ATLAS_QUICKSTART.md) - Quick 5-minute setup
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - Detailed setup with screenshots
- [MONGODB_ATLAS_QUICK_REFERENCE.md](MONGODB_ATLAS_QUICK_REFERENCE.md) - Quick reference card

### Verification

[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Complete checklist to verify setup

### Summary

[SETUP_COMPLETE.md](SETUP_COMPLETE.md) - What you've set up and next steps

---

## 🎓 Next Steps

After setup is complete:

1. **Explore the Application**

   - Try creating leads, campaigns, meetings
   - Test all features

2. **Read Documentation**

   - [Backend Architecture](../backend/ARCHITECTURE.md)
   - [Frontend Guide](../frontend/README.md)

3. **Deploy to Production**
   - See [Deployment Guides](../deployment/)

---

## 🔗 Reference Scripts

Located in `reference/`:

- `run_mongo.sh` - Start local MongoDB
- `run_mongo_auth.sh` - Start MongoDB with auth

---

## 📚 Additional Resources

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Docs](https://react.dev)

---

**Setup complete? Move on to [Development](../README.md) or [Deployment](../deployment/)!** 🚀

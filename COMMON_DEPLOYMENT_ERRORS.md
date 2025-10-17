# ⚠️ Common Deployment Errors & Solutions

Quick reference for fixing the most common deployment issues.

---

## Error 1: "No open ports detected"

### Error Message

```
==> No open ports detected, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
```

### ❌ What You Did Wrong

Used wrong start command:

- `python run.py` ❌
- `python main.py` ❌
- `uvicorn app.main:app --host 127.0.0.1` ❌

### ✅ How to Fix

Change Start Command to:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Why This Works

- `0.0.0.0` = Listen on all network interfaces (not just localhost)
- `$PORT` = Use Render's dynamically assigned port
- `run.py` binds to localhost only, which Render can't access

---

## Error 2: SSL Handshake Failed (MongoDB)

### Error Message

```
SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR]
tlsv1 alert internal error (_ssl.c:1028)
```

### ❌ What Went Wrong

- Python/OpenSSL version mismatch
- Missing SSL configuration
- Invalid MongoDB connection string

### ✅ How to Fix (Do All)

**1. Add Python Version**
Render Environment variables:

```
PYTHON_VERSION=3.11.0
```

**2. URL-Encode Password**
If password has special characters:

```
Original: MyP@ss!123
Encoded:  MyP%40ss%21123

@ → %40
! → %21
# → %23
$ → %24
```

**3. Update database.py (Already Done)**
The code has been updated with proper SSL handling.

**4. Check MongoDB Atlas**

- Network Access → Add `0.0.0.0/0`
- Cluster not paused
- Database user has readWrite permission

---

## Error 3: CORS Policy Block

### Error Message (Browser Console)

```
Access to fetch at 'https://backend.onrender.com/api/...'
from origin 'https://app.vercel.app' has been blocked by CORS policy
```

### ❌ What Went Wrong

Backend doesn't allow your frontend domain.

### ✅ How to Fix

1. Render Dashboard → Your Backend Service
2. Environment tab
3. Update `CORS_ORIGINS`:
   ```
   https://your-app.vercel.app
   ```
4. Save (auto-redeploys)
5. Wait 2-3 minutes
6. Refresh frontend

---

## Error 4: Frontend Shows "Network Error"

### Error Message

```
Network Error
Cannot connect to backend
```

### ❌ What Went Wrong

- Missing `REACT_APP_API_URL` in Vercel
- Wrong backend URL
- Backend not running

### ✅ How to Fix

**1. Check Backend is Running**

```bash
curl https://your-backend.onrender.com/api/health
```

Should return: `{"status":"healthy"}`

**2. Add Environment Variable in Vercel**

```
REACT_APP_API_URL=https://your-backend.onrender.com
```

**3. Redeploy Frontend**
Vercel → Deployments → Redeploy

---

## Error 5: 401 Unauthorized (Login)

### Error Message

```
401 Unauthorized
Invalid credentials
```

### ❌ Possible Causes

- Wrong email/password
- JWT_SECRET_KEY mismatch
- User doesn't exist
- Token expired

### ✅ How to Fix

**1. Register New User First**
Test with `/api/auth/register` endpoint

**2. Check JWT Secret**
Ensure `JWT_SECRET_KEY` is set in Render Environment

**3. Test API Directly**
Use backend's `/docs` to test authentication

---

## Error 6: MongoDB Connection Timeout

### Error Message

```
Failed to connect to MongoDB
Connection timeout
ServerSelectionTimeoutError
```

### ❌ What Went Wrong

- MongoDB Atlas Network Access blocks Render
- Cluster is paused
- Wrong connection string
- Database user permissions

### ✅ How to Fix

**1. MongoDB Atlas Network Access**

```
Atlas → Network Access → Add IP Address → 0.0.0.0/0
```

**2. Check Cluster Status**

```
Atlas → Clusters → Ensure not paused
```

**3. Test Connection String**
Copy fresh connection string from Atlas:

```
Atlas → Connect → Connect your application
```

**4. Verify Database User**

```
Atlas → Database Access
- User exists ✓
- Password correct ✓
- Role: readWrite ✓
```

---

## Error 7: Build Failed (Render)

### Error Message

```
pip install -r requirements.txt failed
ModuleNotFoundError: No module named 'app'
```

### ❌ What Went Wrong

- Root Directory not set to `backend`
- `requirements.txt` missing
- Wrong file structure

### ✅ How to Fix

**1. Set Root Directory**

```
Render Settings → Root Directory → backend
```

**2. Verify File Structure**

```
backend/
├── app/
├── requirements.txt  ← Must be here
└── ...
```

**3. Check requirements.txt**
Ensure file exists and has content

---

## Error 8: Build Failed (Vercel)

### Error Message

```
Module not found: Can't resolve 'react'
Build failed
```

### ❌ What Went Wrong

- Root Directory not set to `frontend`
- `package.json` missing
- Dependencies not installed

### ✅ How to Fix

**1. Set Root Directory**

```
Vercel Settings → Root Directory → frontend
```

**2. Verify package.json**

```
frontend/
├── package.json  ← Must be here
└── src/
```

**3. Test Build Locally**

```bash
cd frontend
yarn install
yarn build
```

---

## Error 9: Application Startup Timeout

### Error Message (Render)

```
Application failed to start
Health check timeout
```

### ❌ What Went Wrong

- Database connection blocks startup
- Environment variables missing
- Application crashed

### ✅ How to Fix

**1. Check Render Logs**
Look for actual error message

**2. Verify All Environment Variables**
See `RENDER_ENV_TEMPLATE.txt` for complete list

**3. Test Database Connection**
Ensure MongoDB is accessible

**4. Check Health Endpoint**
Health check path should be: `/api/health`

---

## Error 10: Data Not Persisting

### Problem

Data saves but disappears after restart.

### ❌ What Went Wrong

- Writing to wrong database
- Using in-memory storage
- Database name mismatch

### ✅ How to Fix

**1. Verify DB_NAME**

```
Render Environment → DB_NAME=crm_db
```

**2. Check MongoDB Atlas**

```
Atlas → Browse Collections
- See your database
- See data in collections
```

**3. Check Application Logs**
Should see:

```
Connected to MongoDB at mongodb+srv://...
Database: crm_db
```

---

## Quick Checklist

Before asking for help, verify:

### Backend (Render)

- [ ] ✅ Root Directory = `backend`
- [ ] ✅ Start Command = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] ✅ All 10 environment variables set
- [ ] ✅ `PYTHON_VERSION=3.11.0`
- [ ] ✅ MongoDB password URL-encoded
- [ ] ✅ Health check returns 200 OK

### Frontend (Vercel)

- [ ] ✅ Root Directory = `frontend`
- [ ] ✅ `REACT_APP_API_URL` set correctly
- [ ] ✅ Build succeeds
- [ ] ✅ Frontend loads without errors
- [ ] ✅ No CORS errors in console

### MongoDB Atlas

- [ ] ✅ Cluster is running (not paused)
- [ ] ✅ Network Access allows `0.0.0.0/0`
- [ ] ✅ Database user has readWrite permission
- [ ] ✅ Connection string is correct

---

## Still Getting Errors?

See `DEPLOYMENT_TROUBLESHOOTING.md` for detailed solutions.

**Remember**: 90% of deployment errors are due to:

1. Wrong start command (use exact command above)
2. Missing environment variables
3. MongoDB network access
4. Wrong Root Directory

Fix these first! 🚀

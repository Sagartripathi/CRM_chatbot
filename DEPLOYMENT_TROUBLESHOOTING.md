# 🔧 Deployment Troubleshooting Guide

Quick solutions to common deployment issues.

---

## 🚨 Render: "No open ports detected"

### Problem

```
==> No open ports detected, continuing to scan...
```

### Cause

Your start command is binding to localhost (`127.0.0.1`) instead of all interfaces.

### Solution

Update your **Start Command** in Render to:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### What NOT to Use

❌ `python run.py` - Binds to localhost only
❌ `uvicorn app.main:app --host 127.0.0.1` - Same issue
❌ `python main.py` - Wrong entry point

### Where to Fix

1. Render Dashboard → Your Service
2. Settings → Build & Deploy
3. Update "Start Command"
4. Save Changes

---

## 🚨 MongoDB: SSL Handshake Failed

### Problem

```
SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR] tlsv1 alert internal error
```

### Causes

1. Python/OpenSSL version incompatibility
2. Missing SSL certificates
3. MongoDB connection string issues

### Solutions

#### Solution 1: Update database.py (Already Done ✅)

The `backend/app/database.py` file has been updated with proper SSL handling.

#### Solution 2: Add Python Version

In Render Environment variables, add:

```
PYTHON_VERSION=3.11.0
```

#### Solution 3: Update MongoDB URL

Ensure your `MONGO_URL` includes proper parameters:

```
mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority&tls=true
```

#### Solution 4: URL-Encode Password

Special characters in password must be encoded:

- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`
- `*` → `%2A`

#### Solution 5: Check MongoDB Atlas Network Access

1. Go to MongoDB Atlas Dashboard
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (Allow from anywhere)
4. Save

#### Solution 6: Temporary Workaround

If all else fails, add to connection string:

```
mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true
```

⚠️ Not recommended for production, but helps diagnose the issue.

---

## 🚨 Render: Build Failed

### Problem

```
pip install failed
ModuleNotFoundError
```

### Solutions

#### Check Root Directory

Ensure Root Directory is set to: `backend`

#### Verify requirements.txt

File must be at: `backend/requirements.txt`

#### Check Python Version

Add environment variable:

```
PYTHON_VERSION=3.11.0
```

#### View Build Logs

Render Dashboard → Your Service → Logs → Build Logs

---

## 🚨 Vercel: Frontend Not Connecting to Backend

### Problem

Frontend shows "Network Error" or CORS errors.

### Solutions

#### Solution 1: Check Environment Variable

Ensure `REACT_APP_API_URL` is set in Vercel:

1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Check `REACT_APP_API_URL` value
4. Should be: `https://your-backend.onrender.com`

#### Solution 2: Redeploy Frontend

After adding env var, redeploy:

1. Vercel Dashboard → Deployments
2. Latest deployment → Actions → Redeploy

#### Solution 3: Update CORS on Backend

In Render Environment variables:

```
CORS_ORIGINS=https://your-app.vercel.app
```

#### Solution 4: Check Browser Console

1. Open frontend in browser
2. Press F12 (Developer Tools)
3. Check Console tab for errors
4. Check Network tab for failed requests

---

## 🚨 CORS Errors in Browser

### Problem

```
Access to fetch has been blocked by CORS policy
```

### Solution

1. Go to Render Dashboard → Your Backend Service
2. Environment tab
3. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
4. Save Changes (triggers automatic redeploy)
5. Wait 2-3 minutes for redeploy
6. Clear browser cache
7. Test again

### Important

- ✅ Use exact Vercel URL
- ❌ No trailing slash
- ❌ No wildcards in production
- ✅ Multiple origins: `https://app1.com,https://app2.com`

---

## 🚨 Authentication Not Working

### Problem

Login returns 401 or token errors.

### Solutions

#### Check JWT_SECRET_KEY

1. Render Environment → Verify JWT_SECRET_KEY is set
2. Should be 32+ character random string
3. Generate new: `python3 -c "import secrets; print(secrets.token_hex(32))"`

#### Check Frontend API URL

1. Verify `REACT_APP_API_URL` in Vercel
2. Test backend directly: `https://backend.onrender.com/api/health`

#### Check Token Storage

1. Open browser DevTools → Application
2. Local Storage → Check for token
3. If missing, login is failing

---

## 🚨 MongoDB: Cannot Connect

### Problem

```
Failed to connect to MongoDB
Connection timeout
```

### Solutions

#### Check Atlas Network Access

1. MongoDB Atlas → Network Access
2. Ensure `0.0.0.0/0` is allowed
3. Or add specific Render IPs

#### Check Cluster Status

1. Atlas Dashboard → Clusters
2. Ensure cluster is not paused
3. Free tier pauses after inactivity

#### Check Connection String

1. Atlas → Connect → Connect your application
2. Copy fresh connection string
3. Update in Render Environment variables

#### Check Database User

1. Atlas → Database Access
2. Verify user exists
3. Check permissions (readWrite)
4. Verify password is correct

#### Test Connection

```bash
cd backend
python3 -c "
from pymongo import MongoClient
client = MongoClient('YOUR_MONGO_URL_HERE')
print(client.admin.command('ping'))
"
```

---

## 🚨 Render: Service Keeps Restarting

### Problem

Service starts then immediately restarts.

### Causes & Solutions

#### Missing Environment Variables

- Check all required env vars are set
- See `RENDER_ENV_TEMPLATE.txt`

#### Database Connection Issues

- MongoDB not reachable
- See MongoDB troubleshooting above

#### Port Binding Issues

- Use `--host 0.0.0.0 --port $PORT`
- Don't hardcode ports

#### Memory Issues

- Free tier has 512MB RAM limit
- Check for memory leaks
- Optimize application

---

## 🚨 Vercel: Build Failed

### Problem

```
Build failed
Module not found
```

### Solutions

#### Check Root Directory

Should be set to: `frontend`

#### Check Build Command

Should be: `yarn build` or `npm run build`

#### Check package.json

Ensure file exists at: `frontend/package.json`

#### Install Dependencies Locally

```bash
cd frontend
yarn install
yarn build
```

If this fails locally, fix errors first.

#### Check Node Version

Vercel uses Node 18 by default.
Test locally with same version.

---

## 🚨 Database: Data Not Persisting

### Problem

Data disappears after restart.

### Cause

Using wrong database or collection.

### Solutions

#### Check DB_NAME

Render Environment → Verify `DB_NAME=crm_db`

#### Check MongoDB Atlas

1. Atlas Dashboard → Browse Collections
2. Verify data is in correct database
3. Check collection names

#### Check Application Logs

Render logs should show:

```
Connected to MongoDB at mongodb+srv://...
Database indexes created successfully
```

---

## 🆘 General Debugging Steps

### 1. Check Render Logs

```
Render Dashboard → Your Service → Logs tab
```

Look for:

- ✅ Application startup complete
- ✅ Connected to MongoDB
- ✅ Uvicorn running on 0.0.0.0
- ❌ Any ERROR messages

### 2. Check Vercel Logs

```
Vercel Dashboard → Your Project → Deployments → View Logs
```

Look for:

- ✅ Build completed
- ❌ Build errors
- ❌ Runtime errors

### 3. Test Components Individually

**Backend Health:**

```bash
curl https://your-backend.onrender.com/api/health
```

Should return: `{"status":"healthy",...}`

**Backend API Docs:**

```
https://your-backend.onrender.com/docs
```

Should open interactive API documentation.

**Frontend:**

```
https://your-app.vercel.app
```

Should load without errors.

### 4. Check Browser Console

1. Open frontend
2. Press F12
3. Console tab → Check for errors
4. Network tab → Check failed requests

### 5. Verify Environment Variables

**Render:**

```
✅ MONGO_URL
✅ DB_NAME
✅ JWT_SECRET_KEY
✅ CORS_ORIGINS
✅ All 10 variables set
```

**Vercel:**

```
✅ REACT_APP_API_URL
```

---

## 📞 Still Stuck?

### Check Platform Status

- **Render**: https://status.render.com
- **Vercel**: https://www.vercel-status.com
- **MongoDB**: https://status.mongodb.com

### Review Deployment Guides

- `RENDER_DEPLOYMENT_FIX.md` - Quick fixes
- `DEPLOYMENT_GUIDE.md` - Complete reference
- `DEPLOYMENT_CHECKLIST.md` - Verification

### Common Issues Summary

| Issue         | Quick Fix                                              |
| ------------- | ------------------------------------------------------ |
| No open ports | Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| SSL handshake | Add `PYTHON_VERSION=3.11.0`, URL-encode password       |
| CORS errors   | Update `CORS_ORIGINS` with Vercel URL                  |
| Can't connect | Check MongoDB Atlas Network Access                     |
| Build failed  | Verify Root Directory and build commands               |

---

**Remember: Check logs first! They usually tell you exactly what's wrong. 🔍**

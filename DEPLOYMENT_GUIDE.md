# 🚀 Complete Deployment Guide: CRM Chatbot

This guide covers deploying your CRM Chatbot application with:

- **Frontend**: React/TypeScript app on **Vercel**
- **Backend**: Python FastAPI on **Render**
- **Database**: MongoDB Atlas (already configured)

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ MongoDB Atlas cluster running with connection string
- ✅ Git repository with your code (GitHub, GitLab, or Bitbucket)
- ✅ Vercel account (free tier works) - https://vercel.com
- ✅ Render account (free tier works) - https://render.com
- ✅ Your backend `.env` file with MongoDB credentials

---

# Part 1: Backend Deployment on Render 🐍

## Step 1.1: Prepare Backend for Render

### 1.1.1 Verify Your `.env` File

Make sure your `/backend/.env` file exists with these settings:

```env
# MongoDB Atlas connection
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db

# Security (generate a secure key!)
JWT_SECRET_KEY=your-secret-key-change-in-production-use-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Configuration for production
HOST=0.0.0.0
PORT=8000

# CORS - Will update after getting Vercel URL
CORS_ORIGINS=*

# Development flags
SKIP_DB_CHECK=false
```

⚠️ **IMPORTANT**: Generate a secure JWT secret key:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 1.1.2 Files Already Created

✅ `backend/requirements.txt` - Already exists
✅ `backend/app/main.py` - Already configured

## Step 1.2: Deploy to Render

### 1.2.1 Create Render Account & New Web Service

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Select your repository from the list

### 1.2.2 Configure Web Service Settings

Fill in the following settings:

| Setting            | Value                                              |
| ------------------ | -------------------------------------------------- |
| **Name**           | `crm-chatbot-backend` (or your choice)             |
| **Region**         | Choose closest to your users                       |
| **Branch**         | `main` (or your default branch)                    |
| **Root Directory** | `backend`                                          |
| **Runtime**        | `Python 3`                                         |
| **Build Command**  | `pip install -r requirements.txt`                  |
| **Start Command**  | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

⚠️ **DO NOT use** `python run.py` - it binds to localhost only and Render can't detect ports!
| **Instance Type** | `Free` (or paid for better performance) |

⚠️ **CRITICAL**:

- Use `$PORT` variable - Render assigns port dynamically!
- Use `--host 0.0.0.0` - Allows Render to access the service
- Don't use `python run.py` - It only binds to localhost

### 1.2.3 Add Environment Variables

In the **"Environment Variables"** section, add:

| Key                           | Value                             | Notes                                |
| ----------------------------- | --------------------------------- | ------------------------------------ |
| `MONGO_URL`                   | `mongodb+srv://<user>:<pass>@...` | Your MongoDB Atlas connection string |
| `DB_NAME`                     | `crm_db`                          | Your database name                   |
| `JWT_SECRET_KEY`              | `<your-generated-key>`            | Generate with command above          |
| `ALGORITHM`                   | `HS256`                           | JWT algorithm                        |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440`                            | 24 hours                             |
| `HOST`                        | `0.0.0.0`                         | Allow external connections           |
| `PORT`                        | `8000`                            | Default port (Render overrides this) |
| `SKIP_DB_CHECK`               | `false`                           | Enable DB health checks              |
| `CORS_ORIGINS`                | `*`                               | Temporarily allow all (update later) |
| `PYTHON_VERSION`              | `3.11.0`                          | Specify Python version               |

### 1.2.4 Deploy Backend

1. Click **"Create Web Service"**
2. Render will start building (takes 3-5 minutes)
3. Wait for deployment to complete
4. Your backend URL will be: `https://crm-chatbot-backend.onrender.com`

### 1.2.5 Test Backend Deployment

Open these URLs in your browser:

```
https://crm-chatbot-backend.onrender.com/
https://crm-chatbot-backend.onrender.com/api/health
https://crm-chatbot-backend.onrender.com/docs
```

✅ All should return valid responses!

---

# Part 2: Frontend Deployment on Vercel ⚛️

## Step 2.1: Prepare Frontend for Vercel

### 2.1.1 Create Frontend Environment Configuration

Create `.env.production` in the `frontend/` directory (this will be done automatically below).

### 2.1.2 Update Frontend to Use Environment Variable

The frontend needs to use the backend URL from environment variables instead of proxy.

## Step 2.2: Deploy to Vercel

### 2.2.1 Create Vercel Account & New Project

1. Go to https://vercel.com and sign up/login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select your repository from the list

### 2.2.2 Configure Project Settings

| Setting              | Value                             |
| -------------------- | --------------------------------- |
| **Framework Preset** | `Create React App`                |
| **Root Directory**   | `frontend`                        |
| **Build Command**    | `yarn build` (or `npm run build`) |
| **Output Directory** | `build`                           |
| **Install Command**  | `yarn install` (or `npm install`) |

### 2.2.3 Add Environment Variables

In the **"Environment Variables"** section, add:

| Key                 | Value                                      |
| ------------------- | ------------------------------------------ |
| `REACT_APP_API_URL` | `https://crm-chatbot-backend.onrender.com` |

⚠️ Replace with YOUR actual Render backend URL!

### 2.2.4 Deploy Frontend

1. Click **"Deploy"**
2. Vercel will build and deploy (takes 2-3 minutes)
3. Your frontend URL will be something like: `https://crm-chatbot-xyz.vercel.app`

### 2.2.5 Test Frontend Deployment

1. Open your Vercel URL
2. Try logging in with test credentials
3. Check browser console for any errors

---

# Part 3: Final Configuration & CORS Setup 🔒

## Step 3.1: Update CORS Origins in Backend

Now that you have your Vercel URL, update CORS settings:

1. Go to Render Dashboard → Your Web Service
2. Go to **"Environment"** tab
3. Update `CORS_ORIGINS` environment variable:
   ```
   https://crm-chatbot-xyz.vercel.app,https://crm-chatbot-xyz.vercel.app
   ```
   ⚠️ Replace with YOUR actual Vercel URL(s)
4. Click **"Save Changes"**
5. Render will automatically redeploy

## Step 3.2: Update MongoDB Atlas Network Access

Ensure your MongoDB Atlas allows connections from Render:

1. Go to MongoDB Atlas Dashboard
2. Navigate to **"Network Access"**
3. Click **"Add IP Address"**
4. Click **"Allow Access From Anywhere"** (or add Render's IP ranges)
5. Click **"Confirm"**

⚠️ For better security, you can add specific Render IP ranges instead of allowing all.

---

# Part 4: Testing Full Deployment 🧪

## Step 4.1: Test Backend API

```bash
# Health check
curl https://crm-chatbot-backend.onrender.com/api/health

# API root
curl https://crm-chatbot-backend.onrender.com/api/

# API docs (open in browser)
open https://crm-chatbot-backend.onrender.com/docs
```

## Step 4.2: Test Frontend Application

1. **Open Frontend URL**: https://crm-chatbot-xyz.vercel.app
2. **Test Login**: Try logging in with your credentials
3. **Test Features**:
   - Create a lead
   - View campaigns
   - Create a meeting
   - Check support tickets
4. **Check Browser Console**: No CORS errors should appear

## Step 4.3: Test End-to-End Flow

1. Register a new user from frontend
2. Login with new user
3. Create a lead
4. Create a campaign
5. Schedule a meeting
6. Create a support ticket
7. Verify all data persists in MongoDB Atlas

---

# Part 5: Monitoring & Maintenance 📊

## 5.1 Render Monitoring

- **Logs**: View in Render Dashboard → Your Service → "Logs" tab
- **Metrics**: Check CPU/Memory usage in "Metrics" tab
- **Health Checks**: Render automatically pings `/api/health`

## 5.2 Vercel Monitoring

- **Analytics**: Built-in Web Vitals in Vercel Dashboard
- **Logs**: View deployment and function logs in "Deployments" tab
- **Domain**: Add custom domain in "Settings" → "Domains"

## 5.3 MongoDB Atlas Monitoring

- **Metrics**: Database size, connections, operations
- **Alerts**: Set up email alerts for issues
- **Backups**: Enable automated backups

---

# Part 6: Troubleshooting 🔧

## Common Issues & Solutions

### Issue 1: Backend "Application failed to start"

**Solution**:

- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure `requirements.txt` includes all dependencies
- Check MongoDB connection string is correct

### Issue 2: Frontend shows "Network Error"

**Solution**:

- Verify `REACT_APP_API_URL` is set correctly in Vercel
- Check browser console for actual error
- Ensure backend CORS includes your Vercel domain
- Test backend API endpoint directly

### Issue 3: CORS Errors in Browser

**Solution**:

- Update `CORS_ORIGINS` in Render to include Vercel URL
- Ensure no trailing slashes in CORS_ORIGINS
- Redeploy backend after changing CORS settings

### Issue 4: MongoDB Connection Errors

**Solution**:

- Check MongoDB Atlas Network Access allows all IPs or Render IPs
- Verify connection string has correct password (URL encoded!)
- Test connection using MongoDB Compass
- Check if cluster is paused (Atlas pauses free clusters after inactivity)

### Issue 5: Authentication Not Working

**Solution**:

- Verify JWT_SECRET_KEY is same across deployments
- Check token is being stored in localStorage
- Ensure backend is generating valid JWT tokens
- Test `/api/auth/login` endpoint directly

---

# Part 7: Production Best Practices 🌟

## 7.1 Security

- ✅ Use strong JWT secret key (min 32 characters)
- ✅ Enable HTTPS only (both platforms do this by default)
- ✅ Restrict CORS to specific domains (no `*` in production)
- ✅ URL encode special characters in MongoDB password
- ✅ Rotate JWT secrets periodically
- ✅ Enable MongoDB Atlas IP whitelist

## 7.2 Performance

- ✅ Enable caching in Vercel (automatic)
- ✅ Use MongoDB indexes for frequently queried fields
- ✅ Optimize API response payloads
- ✅ Consider upgrading to paid Render tier for better performance
- ✅ Use CDN for static assets (Vercel does this automatically)

## 7.3 Monitoring

- ✅ Set up error tracking (Sentry, Rollbar, etc.)
- ✅ Enable MongoDB Atlas monitoring alerts
- ✅ Monitor API response times
- ✅ Set up uptime monitoring (UptimeRobot, Pingdom)
- ✅ Review logs regularly

## 7.4 Backups

- ✅ Enable MongoDB Atlas automated backups
- ✅ Export environment variables regularly
- ✅ Keep deployment documentation updated
- ✅ Test disaster recovery procedures

---

# Part 8: Custom Domains (Optional) 🌐

## 8.1 Custom Domain for Frontend (Vercel)

1. Go to Vercel Dashboard → Your Project → "Settings" → "Domains"
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Follow Vercel's instructions to update DNS records
4. Vercel automatically provisions SSL certificate

## 8.2 Custom Domain for Backend (Render)

1. Go to Render Dashboard → Your Service → "Settings"
2. Scroll to "Custom Domain"
3. Add your custom domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Render automatically provisions SSL certificate

## 8.3 Update CORS After Custom Domains

Don't forget to update `CORS_ORIGINS` environment variable in Render with your new custom domains!

---

# Part 9: CI/CD (Automatic Deployments) 🔄

Both Vercel and Render support automatic deployments:

## 9.1 Vercel Auto-Deploy

✅ **Already Enabled!** Vercel automatically deploys when you push to your main branch.

**Configure**:

- Production Branch: `main`
- Preview Branches: All other branches get preview URLs

## 9.2 Render Auto-Deploy

✅ **Already Enabled!** Render automatically deploys when you push to your main branch.

**Configure**:

- Go to Settings → "Build & Deploy"
- Enable "Auto-Deploy" for main branch
- Set up branch deploys for staging if needed

---

# 🎉 Deployment Complete!

Your CRM Chatbot is now live in production!

## Quick Reference URLs

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`
- **MongoDB Atlas**: https://cloud.mongodb.com

## Next Steps

1. Add custom domain names
2. Set up error monitoring
3. Configure email notifications
4. Add analytics tracking
5. Implement rate limiting
6. Set up automated backups
7. Create staging environment

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev

---

Made with ❤️ for production deployment success!

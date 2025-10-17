# 🚀 Quick Start Deployment Guide

**Time Required**: ~1 hour total
**Difficulty**: Beginner-friendly

This is the condensed version. For detailed explanations, see `DEPLOYMENT_GUIDE.md`.

---

## 📦 What You'll Deploy

- **Backend** (FastAPI/Python) → Render.com
- **Frontend** (React/TypeScript) → Vercel.com
- **Database** (MongoDB) → Already on Atlas ✅

---

## Step 1: Deploy Backend to Render (30 min)

### 1.1 Prepare

```bash
# Generate JWT secret key
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy the output - you'll need it!
```

### 1.2 Deploy to Render

1. Go to https://render.com → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Select your repository

**Configure Settings:**

```
Name: crm-chatbot-backend
Region: Oregon (or closest to you)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

⚠️ **CRITICAL**: Use the exact start command above, NOT `python run.py`!

**Add Environment Variables:**

```
MONGO_URL=mongodb+srv://your-connection-string
DB_NAME=crm_db
JWT_SECRET_KEY=<paste-generated-key-from-step-1.1>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
SKIP_DB_CHECK=false
PYTHON_VERSION=3.11.0
```

5. Click **"Create Web Service"**
6. Wait 3-5 minutes for deployment
7. Copy your Render URL: `https://crm-chatbot-backend-xxxx.onrender.com`

### 1.3 Test Backend

Open these URLs:

- Health: `https://your-backend.onrender.com/api/health`
- Docs: `https://your-backend.onrender.com/docs`

✅ Both should work!

---

## Step 2: Deploy Frontend to Vercel (20 min)

### 2.1 Deploy to Vercel

1. Go to https://vercel.com → Sign up/Login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Select your repository

**Configure Settings:**

```
Framework Preset: Create React App
Root Directory: frontend
Build Command: yarn build
Output Directory: build
Install Command: yarn install
```

**Add Environment Variable:**

```
Key: REACT_APP_API_URL
Value: https://your-backend.onrender.com
```

⚠️ **IMPORTANT**: Use YOUR actual Render URL from Step 1.3!

5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Copy your Vercel URL: `https://your-app-xxxx.vercel.app`

### 2.2 Test Frontend

1. Open your Vercel URL
2. Try to log in (you might see CORS error - that's okay, we'll fix next!)

---

## Step 3: Update CORS (5 min)

### 3.1 Fix CORS in Backend

1. Go back to Render Dashboard
2. Click your backend service
3. Go to **"Environment"** tab
4. Edit `CORS_ORIGINS`:
   ```
   https://your-app-xxxx.vercel.app
   ```
   ⚠️ Use YOUR actual Vercel URL from Step 2.1!
5. Click **"Save Changes"**
6. Wait 2-3 minutes for automatic redeploy

### 3.2 Test Again

1. Open your Vercel URL
2. Open browser console (F12)
3. Try to log in
4. ✅ Should work with no CORS errors!

---

## Step 4: Final Verification (10 min)

### Test Everything:

- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Register new user works
- [ ] Create a lead
- [ ] View campaigns
- [ ] Create meeting
- [ ] Create support ticket
- [ ] No console errors
- [ ] Data saves to MongoDB

---

## 🎉 You're Done!

### Your Live URLs:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`

### Save These for Your Records:

```
Frontend URL: ___________________________
Backend URL: ___________________________
MongoDB URL: ___________________________
JWT Secret: ___________________________  (Keep this secret!)
```

---

## 🔧 Troubleshooting

### Issue: "Backend not responding"

- Check Render logs in dashboard
- Verify all environment variables are set
- Test health endpoint: `/api/health`

### Issue: "CORS error in browser"

- Verify CORS_ORIGINS includes your Vercel URL
- No trailing slashes in URL
- Render service redeployed after change

### Issue: "Login not working"

- Check browser console for actual error
- Verify REACT_APP_API_URL is correct in Vercel
- Test backend `/docs` endpoint

### Issue: "Can't connect to MongoDB"

- Check MongoDB Atlas cluster is not paused
- Network Access allows all IPs (0.0.0.0/0)
- Connection string has correct password (URL-encoded!)

---

## 📚 Next Steps

1. ✅ **Add custom domain** (Optional)
2. ✅ **Set up monitoring** (UptimeRobot, etc.)
3. ✅ **Enable backups** (MongoDB Atlas)
4. ✅ **Add error tracking** (Sentry, etc.)
5. ✅ **Share with team!** 🎉

---

## 🆘 Need Help?

- **Detailed Guide**: See `DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Made with ❤️ - Happy deploying! 🚀**

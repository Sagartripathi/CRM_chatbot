# 📋 Pre-Deployment Checklist

Use this checklist before deploying to ensure everything is ready.

## ✅ Backend Preparation

- [ ] **MongoDB Atlas is running**

  - [ ] Cluster is active (not paused)
  - [ ] Connection string is available
  - [ ] Network access allows all IPs or Render IPs
  - [ ] Database user has read/write permissions

- [ ] **Environment Variables Ready**

  - [ ] `MONGO_URL` - MongoDB Atlas connection string
  - [ ] `DB_NAME` - Database name (e.g., `crm_db`)
  - [ ] `JWT_SECRET_KEY` - Generate with: `python3 -c "import secrets; print(secrets.token_hex(32))"`
  - [ ] `ALGORITHM` - Set to `HS256`
  - [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` - Set to `1440` (24 hours)
  - [ ] `HOST` - Set to `0.0.0.0`
  - [ ] `PORT` - Set to `8000`
  - [ ] `CORS_ORIGINS` - Initially set to `*`, update after frontend deployment

- [ ] **Backend Files Check**

  - [ ] `backend/requirements.txt` exists and is up to date
  - [ ] `backend/app/main.py` exists
  - [ ] `backend/.env` file configured (for local testing)
  - [ ] Backend runs locally without errors

- [ ] **Git Repository**
  - [ ] All code committed to Git
  - [ ] Pushed to GitHub/GitLab/Bitbucket
  - [ ] Repository is accessible
  - [ ] No sensitive data in Git (check .gitignore)

---

## ✅ Frontend Preparation

- [ ] **Environment Configuration**

  - [ ] Know your backend URL (will get after Render deployment)
  - [ ] `frontend/src/config.ts` created (done automatically)
  - [ ] Ready to add `REACT_APP_API_URL` in Vercel

- [ ] **Frontend Files Check**

  - [ ] `frontend/package.json` exists
  - [ ] `vercel.json` exists in project root
  - [ ] Frontend builds successfully locally: `cd frontend && yarn build`
  - [ ] No build errors or warnings

- [ ] **Git Repository**
  - [ ] All frontend changes committed
  - [ ] Pushed to remote repository

---

## ✅ Account Setup

- [ ] **Render Account**

  - [ ] Created account at https://render.com
  - [ ] Connected Git repository
  - [ ] Credit card added (even for free tier)

- [ ] **Vercel Account**
  - [ ] Created account at https://vercel.com
  - [ ] Connected GitHub/GitLab account
  - [ ] Ready to import project

---

## 🚀 Deployment Order

Follow this exact order:

### Step 1: Deploy Backend to Render (20-30 minutes)

1. [ ] Sign in to Render
2. [ ] Create new Web Service
3. [ ] Connect Git repository
4. [ ] Configure service settings
5. [ ] Add all environment variables
6. [ ] Deploy and wait for completion
7. [ ] Test backend endpoints
8. [ ] Copy Render URL for frontend

### Step 2: Deploy Frontend to Vercel (15-20 minutes)

1. [ ] Sign in to Vercel
2. [ ] Import project from Git
3. [ ] Configure build settings
4. [ ] Add `REACT_APP_API_URL` environment variable
5. [ ] Deploy and wait for completion
6. [ ] Test frontend application
7. [ ] Copy Vercel URL for CORS

### Step 3: Update CORS in Backend (5 minutes)

1. [ ] Go back to Render dashboard
2. [ ] Update `CORS_ORIGINS` with Vercel URL
3. [ ] Save changes (triggers automatic redeploy)
4. [ ] Wait for redeployment
5. [ ] Test full application

### Step 4: Final Testing (10 minutes)

1. [ ] Test login/register
2. [ ] Test all CRUD operations
3. [ ] Check browser console for errors
4. [ ] Verify MongoDB data persistence
5. [ ] Test on mobile browser

---

## 🔍 Pre-Deployment Tests

Run these tests locally before deploying:

### Backend Tests

```bash
cd backend

# Test MongoDB connection
python test_mongodb_connection.py

# Test backend startup
python run.py

# Test API health
curl http://localhost:8000/api/health

# View API docs
open http://localhost:8000/docs
```

### Frontend Tests

```bash
cd frontend

# Install dependencies
yarn install

# Test development build
yarn start

# Test production build
yarn build

# Check for TypeScript errors
yarn type-check
```

---

## 📝 Information to Collect

Fill this out before deployment:

### MongoDB Atlas

- **Connection String**: `mongodb+srv://_______________`
- **Database Name**: `_______________`
- **Cluster Status**: [ ] Active

### JWT Configuration

- **JWT Secret Key**: `_______________` (Generate new one!)
- **Algorithm**: `HS256`
- **Token Expire Minutes**: `1440`

### Git Repository

- **Repository URL**: `_______________`
- **Branch to Deploy**: `_______________` (usually `main`)

### After Backend Deployment

- **Render Backend URL**: `_______________`
- **Backend Health Check**: [ ] Working

### After Frontend Deployment

- **Vercel Frontend URL**: `_______________`
- **Login Works**: [ ] Yes
- **No CORS Errors**: [ ] Confirmed

---

## ⚠️ Common Mistakes to Avoid

1. **Don't** commit `.env` files to Git
2. **Don't** forget to URL-encode special characters in MongoDB password
3. **Don't** use `localhost` URLs in production environment variables
4. **Don't** forget to update CORS after getting Vercel URL
5. **Don't** use `*` for CORS in production (security risk)
6. **Do** test backend endpoints before deploying frontend
7. **Do** keep a copy of all environment variables in a secure location
8. **Do** enable MongoDB Atlas Network Access for all IPs (or specific Render IPs)

---

## 🆘 Emergency Contacts & Resources

- **Render Status**: https://status.render.com
- **Vercel Status**: https://www.vercel-status.com
- **MongoDB Atlas Status**: https://status.mongodb.com
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## ✨ Post-Deployment Tasks

After successful deployment:

- [ ] Add custom domains (optional)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure automated backups
- [ ] Set up uptime monitoring
- [ ] Update CORS to specific domains only
- [ ] Document all environment variables
- [ ] Share URLs with team
- [ ] Update project README with live URLs
- [ ] Test all features in production
- [ ] Monitor logs for first 24 hours

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Backend health check returns 200 OK
✅ Frontend loads without errors
✅ Login/Register works
✅ All CRUD operations work
✅ No CORS errors in browser console
✅ Data persists in MongoDB
✅ Mobile browser works correctly
✅ API documentation accessible

---

**Ready to deploy? Start with DEPLOYMENT_GUIDE.md for detailed steps!**

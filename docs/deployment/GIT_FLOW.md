# Git Flow for CRM Chatbot Deployment

This document outlines the complete git workflow for deploying the CRM Chatbot application to Vercel (frontend) and Render (backend).

## 🚀 Deployment Flow

### **Automatic Deployments**

When you merge to `main` branch, the following happens automatically:

1. **GitHub Actions** triggers deployment workflow
2. **Vercel** automatically deploys frontend
3. **Render** automatically deploys backend (via webhook)

### **Manual Deployments**

For immediate deployment without merging:

```bash
# Deploy to Vercel (frontend)
vercel --prod

# Deploy to Render (backend) - via Render dashboard or CLI
```

## 📋 Git Workflow

### **1. Development Workflow**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
git add .
git commit -m "feat: add your feature"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# GitHub will run PR checks automatically
```

### **2. Production Deployment**

```bash
# Merge to main (triggers automatic deployment)
git checkout main
git merge feature/your-feature-name
git push origin main

# Or merge via GitHub UI (recommended)
# This triggers both Vercel and Render deployments
```

## 🔧 Setup Requirements

### **GitHub Secrets Required**

Add these secrets to your GitHub repository settings:

#### **For Vercel Deployment:**
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID  
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### **How to get Vercel secrets:**
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create new token → Copy `VERCEL_TOKEN`
3. Go to your project settings → Copy `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

### **Render Setup**

1. **Connect GitHub Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select `main` branch

2. **Configure Environment Variables:**
   ```
   MONGO_URL=mongodb+srv://...
   DB_NAME=crm_database
   JWT_SECRET_KEY=your-secret-key
   CORS_ORIGINS=https://crm-chatbot-tau.vercel.app
   ```

## 🎯 Branch Strategy

### **Main Branches:**
- `main` - Production branch (auto-deploys)
- `deployment-fix` - Current development branch

### **Feature Branches:**
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/documentation` - Documentation updates

## 📊 Deployment Status

### **Check Deployment Status:**

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- Your project: `crm-chatbot-tau`

**Render:**
- Dashboard: https://dashboard.render.com
- Your service: `crm-chatbot-ei2d`

**GitHub Actions:**
- Go to your repository → "Actions" tab
- Check workflow runs

## 🔄 Complete Workflow Example

```bash
# 1. Start new feature
git checkout -b feature/user-authentication
# ... make changes ...
git add .
git commit -m "feat: add user authentication"
git push origin feature/user-authentication

# 2. Create PR on GitHub
# GitHub runs checks automatically

# 3. Merge to main (triggers deployment)
git checkout main
git merge feature/user-authentication
git push origin main

# 4. Deployments happen automatically:
# - Vercel deploys frontend
# - Render deploys backend
# - Both services are updated
```

## 🚨 Troubleshooting

### **If Vercel doesn't deploy:**
1. Check GitHub Actions logs
2. Verify Vercel secrets are set
3. Check Vercel project settings

### **If Render doesn't deploy:**
1. Check Render dashboard
2. Verify GitHub webhook connection
3. Check environment variables

### **If deployments fail:**
1. Check GitHub Actions logs
2. Check Vercel/Render logs
3. Verify all secrets are configured

## 📝 Best Practices

1. **Always test locally** before pushing
2. **Use descriptive commit messages**
3. **Create PRs for review** before merging to main
4. **Monitor deployment logs** after merging
5. **Keep secrets secure** and never commit them

## 🎉 Success Indicators

After merging to `main`, you should see:
- ✅ GitHub Actions workflow completes
- ✅ Vercel deployment succeeds
- ✅ Render deployment succeeds
- ✅ Frontend accessible at Vercel URL
- ✅ Backend accessible at Render URL
- ✅ Login/register functionality works

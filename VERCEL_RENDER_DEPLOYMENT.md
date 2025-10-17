# Vercel + Render Deployment Guide

## Overview

This guide covers deploying the frontend on Vercel and backend on Render with proper HTTPS configuration.

## Architecture

```
Frontend (Vercel) → HTTPS → Backend (Render)
     ↓                    ↓
https://your-app.vercel.app  https://your-backend.onrender.com
```

## Frontend Environment Variables

### Vercel Configuration

The frontend environment variables remain the same, but you'll configure them in Vercel's dashboard instead of Render.

### Required Environment Variables

```bash
# Backend Configuration
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
REACT_APP_PROXY_URL=https://your-backend.onrender.com

# UI Configuration
REACT_APP_LEADS_PER_PAGE=20

# Development Configuration
DISABLE_HOT_RELOAD=true
```

### Optional Environment Variables

```bash
# Additional UI settings
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ENVIRONMENT=production
```

## Backend Environment Variables (Render)

### Required Variables

```bash
# Environment
ENVIRONMENT=production
FORCE_HTTPS=true

# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=app-name
DB_NAME=crm_db

# Security
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server
HOST=0.0.0.0
PORT=8000

# CORS (replace with your Vercel frontend URL)
CORS_ORIGINS=https://your-app.vercel.app
```

## Deployment Steps

### 1. Deploy Backend to Render

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect your GitHub repository**
3. **Configure the service:**

```
Name: crm-backend
Environment: Python 3
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && python run_render.py
```

4. **Set environment variables** (see Backend Environment Variables above)
5. **Deploy and note your backend URL:** `https://crm-backend.onrender.com`

### 2. Deploy Frontend to Vercel

1. **Go to Vercel Dashboard** → **New Project**
2. **Import your GitHub repository**
3. **Configure the project:**

```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
```

4. **Set environment variables** in Vercel dashboard:

```bash
REACT_APP_BACKEND_URL=https://crm-backend.onrender.com
REACT_APP_PROXY_URL=https://crm-backend.onrender.com
REACT_APP_LEADS_PER_PAGE=20
DISABLE_HOT_RELOAD=true
```

5. **Deploy and note your frontend URL:** `https://your-app.vercel.app`

### 3. Update CORS Configuration

After both services are deployed:

1. **Go to Render Dashboard** → **Backend Service** → **Environment**
2. **Update CORS_ORIGINS:**
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```
3. **Redeploy the backend service**

## Environment Variable Configuration

### Vercel Environment Variables

#### Dashboard Configuration

1. **Go to Project Settings** → **Environment Variables**
2. **Add each variable:**

| Name                       | Value                              | Environment                      |
| -------------------------- | ---------------------------------- | -------------------------------- |
| `REACT_APP_BACKEND_URL`    | `https://crm-backend.onrender.com` | Production, Preview, Development |
| `REACT_APP_PROXY_URL`      | `https://crm-backend.onrender.com` | Production, Preview, Development |
| `REACT_APP_LEADS_PER_PAGE` | `20`                               | Production, Preview, Development |
| `DISABLE_HOT_RELOAD`       | `true`                             | Production, Preview, Development |

#### CLI Configuration

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add REACT_APP_BACKEND_URL
vercel env add REACT_APP_PROXY_URL
vercel env add REACT_APP_LEADS_PER_PAGE
vercel env add DISABLE_HOT_RELOAD
```

### Render Environment Variables

#### Dashboard Configuration

1. **Go to Service** → **Environment**
2. **Add each variable:**

| Name             | Value                         |
| ---------------- | ----------------------------- |
| `ENVIRONMENT`    | `production`                  |
| `FORCE_HTTPS`    | `true`                        |
| `MONGO_URL`      | `mongodb+srv://...`           |
| `DB_NAME`        | `crm_db`                      |
| `JWT_SECRET_KEY` | `your-secret-key`             |
| `CORS_ORIGINS`   | `https://your-app.vercel.app` |
| `HOST`           | `0.0.0.0`                     |
| `PORT`           | `8000`                        |

## HTTPS Configuration

### Vercel HTTPS

- **Automatic HTTPS**: Vercel provides SSL certificates automatically
- **Custom Domains**: Supports custom domains with SSL
- **CDN**: Global CDN with HTTPS

### Render HTTPS

- **Automatic HTTPS**: Render provides SSL certificates automatically
- **SSL Termination**: Render handles SSL termination
- **No Configuration**: No manual SSL setup required

### Cross-Origin HTTPS

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://crm-backend.onrender.com`
- **CORS**: Configured for HTTPS origins
- **No Mixed Content**: All communications use HTTPS

## Testing Deployment

### 1. Test Backend

```bash
# Test API endpoint
curl https://crm-backend.onrender.com/api/

# Test health check
curl https://crm-backend.onrender.com/api/health
```

### 2. Test Frontend

1. **Visit:** `https://your-app.vercel.app`
2. **Check browser console for errors**
3. **Test API calls from frontend**

### 3. Test HTTPS

- **Verify HTTPS is working:** Check browser shows lock icon
- **Test mixed content:** Ensure no HTTP requests from HTTPS page
- **Check CORS:** Verify frontend can call backend API

## Vercel-Specific Configuration

### vercel.json Configuration

Create `vercel.json` in the frontend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "s-maxage=31536000,immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_BACKEND_URL": "https://crm-backend.onrender.com",
    "REACT_APP_PROXY_URL": "https://crm-backend.onrender.com"
  }
}
```

### Build Configuration

Update `package.json` build script:

```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "npm run build"
  }
}
```

## Performance Optimization

### Vercel Optimizations

- **Automatic Code Splitting**: Vercel optimizes bundle splitting
- **Image Optimization**: Automatic image optimization
- **CDN**: Global CDN for static assets
- **Edge Functions**: Serverless functions at the edge

### Render Optimizations

- **Auto-scaling**: Automatic scaling based on traffic
- **Health Checks**: Automatic health monitoring
- **Logs**: Centralized logging
- **Metrics**: Performance monitoring

## Monitoring and Debugging

### Vercel Monitoring

- **Analytics**: Built-in analytics dashboard
- **Performance**: Core Web Vitals monitoring
- **Errors**: Error tracking and reporting
- **Deployments**: Deployment history and status

### Render Monitoring

- **Logs**: Real-time log streaming
- **Metrics**: CPU, memory, and response time metrics
- **Alerts**: Custom alert configuration
- **Health Checks**: Automatic health monitoring

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Frontend can't call backend API
**Solution:**

- Update CORS_ORIGINS with exact Vercel URL
- Ensure backend allows credentials
- Check environment variables

#### 2. Environment Variable Issues

**Problem:** Frontend not using correct backend URL
**Solution:**

- Verify REACT_APP_BACKEND_URL is set correctly
- Check Vercel environment variable configuration
- Redeploy after changing environment variables

#### 3. Build Failures

**Problem:** Frontend build fails on Vercel
**Solution:**

- Check build command configuration
- Verify all dependencies are in package.json
- Check for missing environment variables

#### 4. SSL/Mixed Content Errors

**Problem:** HTTPS page loading HTTP resources
**Solution:**

- Ensure all URLs use HTTPS
- Check REACT_APP_BACKEND_URL is HTTPS
- Verify CORS configuration

### Debugging Steps

1. **Check Vercel logs:**

   - Project → Functions → Logs
   - Check build logs for errors

2. **Check Render logs:**

   - Service → Logs
   - Monitor real-time logs

3. **Test API directly:**

   ```bash
   curl -v https://crm-backend.onrender.com/api/health
   ```

4. **Check environment variables:**
   - Vercel: Project Settings → Environment Variables
   - Render: Service → Environment

## Cost Considerations

### Vercel Pricing

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use
- **Enterprise**: Custom pricing

### Render Pricing

- **Free Plan**: Limited resources, sleep after inactivity
- **Starter Plan**: $7/month for always-on service
- **Standard Plan**: $25/month for better performance

## Security Best Practices

### Vercel Security

- **HTTPS**: Automatic HTTPS for all domains
- **Security Headers**: Automatic security headers
- **DDoS Protection**: Built-in DDoS protection
- **Environment Variables**: Secure environment variable storage

### Render Security

- **HTTPS**: Automatic HTTPS termination
- **Security Headers**: Configurable security headers
- **Environment Variables**: Secure environment variable storage
- **Network Security**: Isolated network environment

## Summary

### Environment Variables Remain the Same

- **Frontend**: Same environment variables, configured in Vercel
- **Backend**: Same environment variables, configured in Render
- **HTTPS**: Both platforms provide automatic HTTPS
- **CORS**: Configured for cross-origin HTTPS communication

### Key Differences

- **Frontend Hosting**: Vercel instead of Render
- **Configuration**: Environment variables set in Vercel dashboard
- **Deployment**: Vercel's automatic deployment from GitHub
- **Performance**: Vercel's global CDN and optimization

### Benefits

- **Performance**: Vercel's optimized frontend hosting
- **Scalability**: Render's backend scaling
- **HTTPS**: Automatic HTTPS on both platforms
- **Monitoring**: Built-in monitoring and analytics
- **Cost**: Free tiers available for both platforms

The environment variables remain the same when hosting the frontend on Vercel and backend on Render. The only difference is where you configure them (Vercel dashboard vs Render dashboard).

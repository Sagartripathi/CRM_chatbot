# Render.com Deployment Guide

## Overview

This guide covers deploying the CRM application to Render.com with proper HTTPS configuration.

## Prerequisites

1. Render.com account
2. MongoDB Atlas cluster
3. GitHub repository with your code

## Backend Deployment

### 1. Create Backend Service

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect your GitHub repository**
3. **Configure the service:**

```
Name: crm-backend
Environment: Python 3
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && python run_render.py
```

### 2. Environment Variables

Set these environment variables in Render dashboard:

#### Required Variables:

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

# CORS (replace with your frontend URL)
CORS_ORIGINS=https://your-frontend-app.onrender.com
```

#### Optional Variables:

```bash
# Database Configuration
DB_CONNECT_TIMEOUT=30000
DB_SERVER_SELECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=30000
DB_MAX_POOL_SIZE=10

# API Configuration
API_VERSION=1.0.0
API_TITLE=CRM API
API_DESCRIPTION=Customer Relationship Management API...

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=1000

# Campaign Configuration
MAX_CAMPAIGN_ATTEMPTS=3
CAMPAIGN_RETRY_DELAY_HOURS=1

# Production
WORKERS=1
SKIP_DB_CHECK=false
```

### 3. Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment to complete**
3. **Note your backend URL:** `https://crm-backend.onrender.com`

## Frontend Deployment

### 1. Create Frontend Service

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect your GitHub repository**
3. **Configure the service:**

```
Name: crm-frontend
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/build
```

### 2. Environment Variables

Set these environment variables:

```bash
# Backend Configuration (replace with your backend URL)
REACT_APP_BACKEND_URL=https://crm-backend.onrender.com
REACT_APP_PROXY_URL=https://crm-backend.onrender.com

# UI Configuration
REACT_APP_LEADS_PER_PAGE=20

# Development Configuration
DISABLE_HOT_RELOAD=true
```

### 3. Deploy Frontend

1. **Click "Create Static Site"**
2. **Wait for deployment to complete**
3. **Note your frontend URL:** `https://crm-frontend.onrender.com`

## Update CORS Configuration

After both services are deployed:

1. **Go to Backend Service** → **Environment**
2. **Update CORS_ORIGINS:**
   ```
   CORS_ORIGINS=https://crm-frontend.onrender.com
   ```
3. **Redeploy the backend service**

## HTTPS Configuration

### Render Automatic HTTPS

- Render automatically provides HTTPS certificates
- All HTTP traffic is redirected to HTTPS
- No SSL certificate configuration needed

### Backend HTTPS Handling

The backend is configured to:

- Handle HTTPS headers from Render's proxy
- Add security headers for production
- Support HTTPS redirects

### Frontend HTTPS Configuration

The frontend is configured to:

- Use HTTPS backend URLs
- Handle HTTPS proxy connections
- Work with Render's HTTPS environment

## Testing Deployment

### 1. Test Backend

```bash
# Test API endpoint
curl https://crm-backend.onrender.com/api/

# Test health check
curl https://crm-backend.onrender.com/api/health
```

### 2. Test Frontend

1. **Visit:** `https://crm-frontend.onrender.com`
2. **Check browser console for errors**
3. **Test API calls from frontend**

### 3. Test HTTPS

- **Verify HTTPS is working:** Check browser shows lock icon
- **Test mixed content:** Ensure no HTTP requests from HTTPS page
- **Check CORS:** Verify frontend can call backend API

## Troubleshooting

### Common Issues

#### 1. SSL/Mixed Content Errors

**Problem:** Frontend (HTTPS) calling backend (HTTP)
**Solution:**

- Ensure backend uses HTTPS URL
- Update CORS_ORIGINS to HTTPS
- Check REACT_APP_BACKEND_URL is HTTPS

#### 2. CORS Errors

**Problem:** Frontend can't call backend API
**Solution:**

- Update CORS_ORIGINS with exact frontend URL
- Ensure backend allows credentials
- Check environment variables

#### 3. Database Connection Issues

**Problem:** Backend can't connect to MongoDB
**Solution:**

- Verify MONGO_URL is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

#### 4. Build Failures

**Problem:** Frontend/backend build fails
**Solution:**

- Check build commands
- Verify all dependencies are in requirements.txt/package.json
- Check for missing environment variables

### Debugging Steps

1. **Check Render logs:**

   - Backend: Service → Logs
   - Frontend: Service → Logs

2. **Test API directly:**

   ```bash
   curl -v https://crm-backend.onrender.com/api/health
   ```

3. **Check environment variables:**

   - Verify all required variables are set
   - Check for typos in variable names

4. **Test database connection:**
   - Use MongoDB Atlas connection test
   - Verify network access settings

## Production Checklist

- [ ] Backend deployed with HTTPS
- [ ] Frontend deployed with HTTPS
- [ ] CORS_ORIGINS updated with frontend URL
- [ ] Environment variables set correctly
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Frontend can call backend API
- [ ] No mixed content errors
- [ ] Security headers enabled
- [ ] HTTPS redirects working

## Security Considerations

### Production Security

- Use strong JWT secrets
- Enable security headers
- Use HTTPS for all communications
- Configure CORS properly
- Use environment-specific configurations

### MongoDB Security

- Use strong database passwords
- Enable IP whitelisting
- Use connection string with SSL
- Regular security updates

## Monitoring

### Render Monitoring

- Use Render's built-in monitoring
- Set up alerts for service failures
- Monitor response times
- Check error rates

### Application Monitoring

- Monitor API response times
- Track database connection health
- Monitor frontend performance
- Set up error tracking

## Scaling

### Backend Scaling

- Upgrade to paid plan for better performance
- Increase workers for higher traffic
- Use Redis for session storage
- Implement caching

### Frontend Scaling

- Use CDN for static assets
- Implement service worker for caching
- Optimize bundle size
- Use lazy loading

## Support

For issues with Render deployment:

1. Check Render documentation
2. Review service logs
3. Test API endpoints directly
4. Verify environment variables
5. Check CORS configuration

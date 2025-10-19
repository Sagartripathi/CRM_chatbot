# Environment Setup Guide

This guide explains how to switch between different environments for the CRM Backend.

## 🚀 Quick Start

### Option 1: Manual Switching

Edit the `.env` file and comment/uncomment the appropriate sections:

**For DEV environment (current):**

```bash
# DEV section is active (uncommented)
# LOCAL section is commented out
# PRODUCTION section is commented out
```

**For LOCAL environment:**

```bash
# DEV section is commented out
# LOCAL section is active (uncommented)
# PRODUCTION section is commented out
```

### Option 2: Using the Switch Script

```bash
# Switch to dev environment
python switch_env.py dev

# Switch to local environment
python switch_env.py local

# Switch to production environment
python switch_env.py production
```

## 📋 Environment Configurations

### 🔧 DEV Environment

- **Database**: MongoDB Atlas dev cluster
- **URL**: `mongodb+srv://dev-crm:...@dev-crm.lpczyaq.mongodb.net/`
- **Database Name**: `dev-crm`
- **CORS**: Includes dev frontend URL
- **Use Case**: Development branch deployment

### 🏠 LOCAL Environment

- **Database**: Local MongoDB instance
- **URL**: `mongodb://localhost:27017`
- **Database Name**: `crm_db`
- **CORS**: Only localhost URLs
- **Use Case**: Local development

### 🚀 PRODUCTION Environment

- **Database**: MongoDB Atlas production cluster
- **URL**: `mongodb+srv://crm_admin:...@crm-db-cluster.nifzfbd.mongodb.net/`
- **Database Name**: `crm_db`
- **CORS**: Production frontend URL
- **Use Case**: Main branch deployment

## 🔄 Switching Workflow

### For Local Development:

```bash
python switch_env.py local
python run.py
```

### For Dev Deployment:

```bash
python switch_env.py dev
# Deploy to Render dev service
```

### For Production Deployment:

```bash
python switch_env.py production
# Deploy to Render production service
```

## ⚠️ Important Notes

1. **Always check your current environment** before starting the server
2. **Update passwords** in the production section with real values
3. **Verify CORS origins** match your frontend URLs
4. **Test database connections** after switching environments

## 🧪 Testing Your Setup

```bash
# Check current environment
curl http://localhost:8000/api/debug/env

# Test database connection
curl http://localhost:8000/api/test-db

# Check health
curl http://localhost:8000/api/health
```

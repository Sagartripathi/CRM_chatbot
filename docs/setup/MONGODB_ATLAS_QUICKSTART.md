# 🚀 MongoDB Atlas Quick Start Guide

## Step-by-Step Setup (5 minutes)

### ✅ Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up (use Google/GitHub for faster signup)
3. Verify email

### ✅ Step 2: Create Your First Cluster

When prompted, select:

#### **Cluster Configuration:**

```
Deployment Type: Shared (Free)
Cloud Provider: AWS (recommended)
Tier: M0 Sandbox (FREE - 512 MB)
```

#### **Naming:**

```
Cluster Name: CRM-Cluster
```

#### **Region Selection (CHOOSE ONE):**

| 🌍 Your Location | 📍 Best Region | 🏷️ Code          |
| ---------------- | -------------- | ---------------- |
| 🇺🇸 USA East      | N. Virginia    | `us-east-1`      |
| 🇺🇸 USA West      | Oregon         | `us-west-2`      |
| 🇪🇺 Europe        | Ireland        | `eu-west-1`      |
| 🇩🇪 Germany       | Frankfurt      | `eu-central-1`   |
| 🇮🇳 India         | Mumbai         | `ap-south-1`     |
| 🇸🇬 Singapore     | Singapore      | `ap-southeast-1` |
| 🇯🇵 Japan         | Tokyo          | `ap-northeast-1` |
| 🇦🇺 Australia     | Sydney         | `ap-southeast-2` |

**💡 Tip**: Choose the region closest to you or your users for best performance.

Click **"Create Deployment"**

---

### ✅ Step 3: Security Setup

#### A. Create Database User

You'll see a popup to create a user:

```
Username: crm_admin
Password: [Click "Autogenerate Secure Password"]
         👆 IMPORTANT: Copy and save this password!
```

Or create your own password (min 8 chars, strong recommended)

Click **"Create Database User"**

#### B. Set Network Access

Choose one:

**Option 1: For Development (Recommended for testing)**

```
Click: "Add My Current IP Address"
```

**Option 2: For Dynamic IP / Production**

```
IP Address: 0.0.0.0/0
Description: Allow from anywhere
⚠️ Less secure but convenient if you have dynamic IP
```

Click **"Add Entry"** → **"Finish and Close"**

---

### ✅ Step 4: Get Connection String

1. Wait for cluster to finish creating (~3-5 minutes)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose:
   - **Driver**: Python
   - **Version**: 3.12 or later
5. **Copy** the connection string:

```
mongodb+srv://crm_admin:<password>@crm-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ IMPORTANT**: Replace `<password>` with your actual password!

---

### ✅ Step 5: Configure Your Application

#### Create `.env` file:

```bash
cd backend
cp env.template .env
```

#### Edit `.env` file:

Open `backend/.env` and update:

```env
# Replace <username>, <password>, and <cluster> with your values
MONGO_URL=mongodb+srv://crm_admin:YourPassword123@crm-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db

# Generate a secure secret key (run this command):
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-generated-secret-key-here

HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=*
```

#### 🔐 Password with Special Characters?

If your password has special characters, URL encode them:

| Character | Encoded | Character | Encoded |
| --------- | ------- | --------- | ------- |
| `@`       | `%40`   | `!`       | `%21`   |
| `#`       | `%23`   | `$`       | `%24`   |
| `%`       | `%25`   | `^`       | `%5E`   |
| `&`       | `%26`   | `*`       | `%2A`   |
| `/`       | `%2F`   | `:`       | `%3A`   |

**Example:**

```
Password: MyP@ss!123
Encoded:  MyP%40ss%21123
Full URL: mongodb+srv://crm_admin:MyP%40ss%21123@crm-cluster.xxx.mongodb.net/...
```

---

### ✅ Step 6: Test Connection

```bash
cd backend
python test_mongodb_connection.py
```

**Expected output:**

```
======================================================================
MongoDB Atlas Connection Test
======================================================================

📝 Configuration:
   MongoDB URL: mongodb+srv://crm_admin:***@crm-cluster.xxxxx.mongodb.net...
   Database: crm_db

🔌 Test 1: Creating MongoDB client...
   ✅ Client created successfully

🏓 Test 2: Pinging MongoDB server...
   ✅ Server responded to ping

🗄️  Test 3: Accessing database...
   ✅ Database 'crm_db' accessed

📚 Test 4: Listing collections...
   ℹ️  No collections found (database is empty)

✍️  Test 5: Testing write and read operations...
   ✅ Test document inserted
   ✅ Test document retrieved successfully
   🧹 Test document cleaned up

ℹ️  Test 6: Server information...
   MongoDB Version: 6.0.x
   Git Version: ...

======================================================================
✅ All tests passed! MongoDB Atlas connection is working correctly.
======================================================================
```

---

### ✅ Step 7: Start Your Application

```bash
cd backend
python run.py
```

**Success! You should see:**

```
INFO:     Connected to MongoDB at mongodb+srv://... (DB: crm_db)
INFO:     Database indexes created successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 🐛 Troubleshooting

### ❌ "Authentication failed"

**Solution:**

- Check username and password are correct
- URL encode special characters in password
- Ensure user was created with "Atlas Admin" or "readWriteAnyDatabase" role

### ❌ "Connection timeout" or "getaddrinfo ENOTFOUND"

**Solution:**

- Check internet connection
- Verify cluster is running (not paused)
- Check Network Access in Atlas (add your IP)
- Disable VPN if using one

### ❌ "dnspython must be installed"

**Solution:**

```bash
pip install dnspython
```

### ❌ "Certificate verification failed"

**Solution:**

```bash
pip install --upgrade certifi
```

### ⚠️ Cluster Paused

Free M0 clusters pause after 60 days of inactivity. To resume:

1. Go to Atlas dashboard
2. Click "Resume" on your cluster
3. Wait a few minutes

---

## 📊 MongoDB Atlas Dashboard Features

### View Your Data:

1. Go to Atlas dashboard
2. Click "Browse Collections"
3. See your data in real-time!

### Monitor Performance:

1. Click "Metrics" tab
2. View connections, operations, network usage

### Backup:

- Free tier includes point-in-time restores
- Access via "Backup" tab

---

## 🔄 Switching Between Local and Atlas

### Use Local MongoDB:

```bash
# In backend/.env
MONGO_URL=mongodb://localhost:27017
```

### Use MongoDB Atlas:

```bash
# In backend/.env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/...
```

No code changes needed! Just update `.env` and restart.

---

## 📈 Free Tier Limits

| Feature     | M0 (Free) Tier            |
| ----------- | ------------------------- |
| Storage     | 512 MB                    |
| RAM         | Shared                    |
| Connections | 500                       |
| Databases   | Unlimited                 |
| Collections | Unlimited                 |
| Documents   | Unlimited (within 512 MB) |
| Backup      | 1 snapshot                |
| Support     | Community                 |

**💡 Tip**: 512 MB is ~500,000 average-sized documents!

---

## 🎯 Quick Reference

### Get Connection String:

1. Atlas Dashboard → Connect → Drivers → Copy connection string

### Add IP Address:

1. Atlas Dashboard → Network Access → Add IP Address

### View Data:

1. Atlas Dashboard → Browse Collections

### Reset Password:

1. Atlas Dashboard → Database Access → Edit User → Reset Password

---

## 🚀 Next Steps

✅ MongoDB Atlas configured  
✅ Connection tested  
✅ Backend running

**Now:**

1. 👤 Create admin user (POST to `/api/auth/register`)
2. 🔑 Login (POST to `/api/auth/login`)
3. 📝 Test CRUD operations
4. 🎨 Start frontend application
5. 🌐 Connect frontend to backend

---

## 📚 Resources

- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Motor (Async Driver)**: https://motor.readthedocs.io/
- **Connection Strings**: https://www.mongodb.com/docs/manual/reference/connection-string/
- **Security Best Practices**: https://www.mongodb.com/docs/atlas/security/

---

## 💬 Need Help?

Check detailed guide: `backend/MONGODB_ATLAS_SETUP.md`

**Common Commands:**

```bash
# Test connection
python backend/test_mongodb_connection.py

# Run backend
cd backend && python run.py

# Check logs
# Look for "Connected to MongoDB" message

# View environment
cat backend/.env
```

---

**🎉 Happy Coding!**

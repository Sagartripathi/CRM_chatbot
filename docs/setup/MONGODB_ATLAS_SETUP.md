# MongoDB Atlas Setup Guide

## Quick Setup Steps

### 1. Create MongoDB Atlas Account

- Visit: https://www.mongodb.com/cloud/atlas/register
- Sign up and verify your email

### 2. Create Free Cluster (M0)

#### Cluster Configuration:

- **Cluster Tier**: M0 Sandbox (FREE - 512 MB)
- **Cluster Name**: `CRM-Cluster` or any name you prefer

#### Cloud Provider & Region Selection:

**Choose based on your location:**

| Your Location  | Provider | Recommended Region                                  |
| -------------- | -------- | --------------------------------------------------- |
| USA East Coast | AWS      | `us-east-1 (N. Virginia)`                           |
| USA West Coast | AWS      | `us-west-2 (Oregon)`                                |
| Europe         | AWS      | `eu-west-1 (Ireland)` or `eu-central-1 (Frankfurt)` |
| India          | AWS      | `ap-south-1 (Mumbai)`                               |
| Singapore/SEA  | AWS      | `ap-southeast-1 (Singapore)`                        |
| Australia      | AWS      | `ap-southeast-2 (Sydney)`                           |

**Recommendation**: Choose AWS as provider and the region closest to you for best performance.

### 3. Security Setup

#### A. Create Database User

1. Username: `crm_admin` (or your choice)
2. Password: Click **"Autogenerate Secure Password"** and **SAVE IT**
   - Or create your own strong password (min 8 chars, mix of letters/numbers/symbols)
3. Click **Create User**

#### B. Network Access (IP Whitelist)

1. Click **"Add IP Address"**
2. Options:
   - **Development**: Click "Add Current IP Address"
   - **Production/Dynamic IP**: Use `0.0.0.0/0` (allow from anywhere)
3. Click **Finish and Close**

### 4. Get Connection String

1. Click **"Connect"** button on your cluster
2. Select **"Connect your application"**
3. Choose:
   - Driver: **Python**
   - Version: **3.12 or later**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@crm-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5. Configure Application

#### Create `.env` file:

```bash
cd backend
cp .env.example .env  # If example exists, or create new file
```

Or manually create `backend/.env` with:

```env
# MongoDB Atlas Connection
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db

# Security (IMPORTANT: Change in production!)
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# Server
HOST=127.0.0.1
PORT=8000

# CORS
CORS_ORIGINS=*
```

**Replace placeholders:**

- `<username>`: Your database username (e.g., `crm_admin`)
- `<password>`: Your database password (URL encode special characters!)
- `<cluster>`: Your cluster subdomain from Atlas (e.g., `crm-cluster.abc123`)

#### Important: URL Encode Password

If your password contains special characters like `@`, `!`, `#`, etc., you need to URL encode them:

- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

Example:

- Password: `MyP@ss!123`
- Encoded: `MyP%40ss%21123`
- Full URL: `mongodb+srv://crm_admin:MyP%40ss%21123@crm-cluster.abc123.mongodb.net/?retryWrites=true&w=majority`

### 6. Install Required Dependencies

```bash
pip install motor pymongo dnspython python-dotenv
```

### 7. Test Connection

```bash
cd backend
python run.py
```

You should see:

```
Connected to MongoDB at mongodb+srv://... (DB: crm_db)
Database indexes created successfully
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**

   - Check username and password are correct
   - Ensure password is URL encoded if it has special characters

2. **Connection Timeout**

   - Verify your IP is whitelisted in Network Access
   - Check firewall/VPN settings

3. **DNS Resolution Error**

   - Install `dnspython`: `pip install dnspython`

4. **Index Creation Warnings**
   - Normal on first run, indexes are being created

## Quick Comparison: Local vs Atlas

| Feature | Local MongoDB   | MongoDB Atlas         |
| ------- | --------------- | --------------------- |
| Setup   | Docker required | Web-based, no install |
| Cost    | Free            | Free (M0 tier)        |
| Storage | Limited by disk | 512 MB (M0)           |
| Backups | Manual          | Automatic             |
| Scaling | Manual          | Easy                  |
| Access  | localhost only  | Anywhere (with auth)  |

## Next Steps

After setup:

1. ✅ Test the connection
2. ✅ Run your backend server
3. ✅ Create initial admin user
4. ✅ Test API endpoints
5. ✅ Connect frontend

## Resources

- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas/
- Connection String Format: https://www.mongodb.com/docs/manual/reference/connection-string/
- Free Tier Limits: https://www.mongodb.com/pricing

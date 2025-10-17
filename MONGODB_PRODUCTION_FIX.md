# MongoDB Production Connection Fix

## 🚨 Current Error

```
The DNS query name does not exist: _mongodb._tcp.cluster.mongodb.net.
```

This error indicates that your MongoDB Atlas connection string is using a placeholder hostname instead of your actual cluster hostname.

## 🔧 Solution Steps

### 1. Get Your Correct MongoDB Atlas Connection String

1. **Log into MongoDB Atlas**: https://cloud.mongodb.com
2. **Select your cluster** (or create one if you don't have one)
3. **Click "Connect"** → **"Connect your application"**
4. **Copy the connection string** - it should look like:
   ```
   mongodb+srv://username:password@your-cluster-name.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Update Render Environment Variables

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Select your backend service** (crm-backend)
3. **Go to "Environment" tab**
4. **Update the MONGO_URL variable** with your correct connection string

### 3. Important Notes

- **URL encode special characters** in your password:

  - `@` → `%40`
  - `!` → `%21`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

- **Example password encoding**:
  ```
  Original: MyPass@123!
  Encoded:  MyPass%40123%21
  ```

### 4. Test Your Connection Locally

Run the test script to verify your connection string works:

```bash
cd backend
python test_mongodb_atlas.py
```

### 5. Common Issues & Solutions

#### Issue: "Authentication failed"

- **Solution**: Check username/password are correct
- **Solution**: Ensure user has proper database permissions

#### Issue: "IP not whitelisted"

- **Solution**: In Atlas → Network Access → Add IP Address
- **Solution**: For Render, add `0.0.0.0/0` (allow all IPs) for testing

#### Issue: "Cluster not found"

- **Solution**: Verify cluster name in connection string
- **Solution**: Ensure cluster is running (not paused)

#### Issue: "DNS resolution failed"

- **Solution**: Use the exact hostname from Atlas dashboard
- **Solution**: Don't use placeholder hostnames like `cluster.mongodb.net`

### 6. Example Correct Configuration

**In Render Environment Variables:**

```
MONGO_URL=mongodb+srv://crm_admin:SecurePass%40123@crm-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db
JWT_SECRET_KEY=your-secure-jwt-secret-key-here
```

### 7. After Updating

1. **Save the environment variables** in Render
2. **Redeploy your service** (Render will restart automatically)
3. **Check the logs** to confirm connection success
4. **Test your API endpoints** to ensure everything works

## 🧪 Test Commands

```bash
# Test connection locally
cd backend
python test_mongodb_atlas.py

# Test API endpoints
curl https://your-backend.onrender.com/api/health
curl https://your-backend.onrender.com/api/test-db
```

## 📞 Need Help?

If you're still having issues:

1. Check MongoDB Atlas cluster status
2. Verify network access settings
3. Test connection string locally first
4. Check Render deployment logs for detailed error messages

# JWT Secret Key Guide

## What is JWT_SECRET_KEY?

The `JWT_SECRET_KEY` is a secret string used to sign and verify JWT (JSON Web Token) tokens. It's essential for:

- **Token Signing**: Creating secure JWT tokens
- **Token Verification**: Validating token authenticity
- **Security**: Prevents token tampering and forgery

## Where to Find JWT_SECRET_KEY

### 1. Generate Your Own (Recommended)

**Use the built-in generator:**

```bash
cd backend
python3 generate_secret_key.py
```

**Output example:**

```
Option 1: Hexadecimal (Recommended)
----------------------------------------------------------------------
1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
```

### 2. Generate Online (Alternative)

**Online generators:**

- [JWT.io Secret Generator](https://jwt.io/)
- [RandomKeygen](https://randomkeygen.com/)
- [Strong Password Generator](https://passwordsgenerator.net/)

### 3. Manual Generation

**Using Python:**

```python
import secrets
print(secrets.token_hex(32))  # 64-character hex string
```

**Using OpenSSL:**

```bash
openssl rand -hex 32
```

**Using Node.js:**

```javascript
require("crypto").randomBytes(32).toString("hex");
```

## How to Use JWT_SECRET_KEY

### 1. Local Development

**Update `.env` file:**

```bash
# In backend/.env
JWT_SECRET_KEY=1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
```

### 2. Render Deployment

**In Render Dashboard:**

1. Go to **Service** → **Environment**
2. Add environment variable:
   ```
   Name: JWT_SECRET_KEY
   Value: 1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
   ```

### 3. Vercel Deployment

**In Vercel Dashboard:**

1. Go to **Project Settings** → **Environment Variables**
2. Add environment variable:
   ```
   Name: JWT_SECRET_KEY
   Value: 1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
   ```

## Security Best Practices

### 1. Key Requirements

- **Length**: Minimum 32 characters (64+ recommended)
- **Randomness**: Cryptographically secure random generation
- **Uniqueness**: Different keys for each environment
- **Secrecy**: Never expose publicly

### 2. Environment-Specific Keys

```bash
# Development
JWT_SECRET_KEY=dev_key_here

# Staging
JWT_SECRET_KEY=staging_key_here

# Production
JWT_SECRET_KEY=production_key_here
```

### 3. Key Rotation

- **Regular Rotation**: Change keys periodically
- **Incident Response**: Rotate immediately if compromised
- **Backup Strategy**: Store keys securely for recovery

## Current Configuration

### Default Value

```python
# In app/config.py
jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
```

### Usage in Code

```python
# In app/utils/auth.py
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # ... code ...
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    # ... code ...
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.algorithm])
    # ... code ...
```

## Generated Keys for This Project

### Option 1: Hexadecimal (Recommended)

```
1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
```

### Option 2: URL-safe Base64

```
oxb-NS-zXz32o0YcOA0s4CCbsGgA6YDNSU0Wi_hCpctO4NXA6LpT5BeVTHQlC855xTvRjH9AbTqlynjbab6ccw
```

### Option 3: Mixed Characters

```
mnD05Ndij8NfpsMy00Ssrwc$Y#iUe(1q%2l0^JUf4Ma_XutC^5EyW$nVtH)_Jt2b
```

## Deployment Configuration

### Render Environment Variables

```bash
# Required for Render
JWT_SECRET_KEY=1d07df8cfeb8fa3751edf26cfc9f8979d6b8fb827b2564ecd3c916d039b5381a
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Vercel Environment Variables

```bash
# Not needed for frontend (JWT is handled by backend)
# Frontend only needs backend URL
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

## Troubleshooting

### Common Issues

#### 1. "Invalid token" Errors

**Problem**: JWT tokens are rejected
**Solution**:

- Verify JWT_SECRET_KEY is set correctly
- Ensure same key is used for signing and verification
- Check for typos in environment variable

#### 2. "Token expired" Errors

**Problem**: Tokens expire too quickly
**Solution**:

- Check ACCESS_TOKEN_EXPIRE_MINUTES setting
- Verify token expiration logic
- Consider token refresh mechanism

#### 3. Environment Variable Not Loading

**Problem**: JWT_SECRET_KEY not found
**Solution**:

- Check .env file exists and is readable
- Verify environment variable name spelling
- Restart application after changes

### Debug Commands

```bash
# Check if environment variable is loaded
python3 -c "import os; print('JWT_SECRET_KEY:', os.getenv('JWT_SECRET_KEY', 'NOT_SET'))"

# Test JWT token creation
python3 -c "
from app.config import settings
from app.utils.auth import create_access_token
token = create_access_token({'sub': 'test_user'})
print('Token created:', token[:50] + '...')
"
```

## Security Checklist

- [ ] JWT_SECRET_KEY is at least 32 characters long
- [ ] Key is cryptographically secure random
- [ ] Different keys for dev/staging/production
- [ ] Key is not committed to git
- [ ] Key is stored securely in deployment platform
- [ ] Key rotation strategy in place
- [ ] Incident response plan for key compromise

## Summary

### Where to Find JWT_SECRET_KEY

1. **Generate locally**: `python3 generate_secret_key.py`
2. **Use online generator**: JWT.io or similar
3. **Manual generation**: Python, OpenSSL, or Node.js

### How to Use

1. **Local**: Add to `backend/.env` file
2. **Render**: Add to environment variables in dashboard
3. **Vercel**: Not needed (frontend doesn't handle JWT)

### Security Requirements

- **Minimum 32 characters**
- **Cryptographically secure**
- **Environment-specific**
- **Never expose publicly**

The JWT_SECRET_KEY is essential for JWT token security and must be generated securely and stored safely in your deployment environment.

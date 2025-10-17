# Environment Configuration Guide

## Overview

This application uses environment variables for configuration instead of hardcoded values. This ensures security and flexibility across different environments.

## Files Structure

- `.env` - Actual environment variables (ignored by git)
- `.env.example` - Template with placeholder values (committed to git)
- `env.template` - Original template file

## Setup Instructions

### 1. Copy the Template

```bash
cp .env.example .env
```

### 2. Configure MongoDB Atlas

Replace the placeholders in `.env`:

```bash
# Replace these placeholders:
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<app-name>

# With your actual values:
MONGO_URL=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority&appName=your_app_name
```

**Important:** URL encode special characters in your password:

- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### 3. Generate JWT Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Configure Other Settings

Update the remaining values in `.env` as needed:

```bash
# Database name
DB_NAME=crm_db

# JWT Secret (use the generated key)
JWT_SECRET_KEY=your_generated_secret_key

# Server configuration
HOST=127.0.0.1
PORT=8000

# CORS origins (for production)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Environment Variables Reference

| Variable                      | Description               | Default                                | Required |
| ----------------------------- | ------------------------- | -------------------------------------- | -------- |
| `MONGO_URL`                   | MongoDB connection string | `mongodb://localhost:27017`            | Yes      |
| `DB_NAME`                     | Database name             | `crm_db`                               | No       |
| `JWT_SECRET_KEY`              | JWT signing key           | `your-secret-key-change-in-production` | Yes      |
| `ALGORITHM`                   | JWT algorithm             | `HS256`                                | No       |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time     | `1440`                                 | No       |
| `HOST`                        | Server host               | `127.0.0.1`                            | No       |
| `PORT`                        | Server port               | `8000`                                 | No       |
| `CORS_ORIGINS`                | Allowed CORS origins      | `*`                                    | No       |
| `SKIP_DB_CHECK`               | Skip DB check on startup  | `false`                                | No       |

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong JWT secrets** - Generate random 32+ character strings
3. **URL encode passwords** - Special characters must be encoded
4. **Use environment-specific configs** - Different values for dev/staging/prod
5. **Rotate secrets regularly** - Change JWT secrets periodically

## Troubleshooting

### MongoDB Connection Issues

1. Check your connection string format
2. Verify username/password are correct
3. Ensure IP is whitelisted in MongoDB Atlas
4. Check if special characters are URL encoded

### Environment Variable Not Loading

1. Ensure `.env` file exists in the backend directory
2. Check file permissions
3. Restart the application after changes

### SSL/TLS Issues

The application is configured to handle MongoDB Atlas SSL connections automatically. If you encounter SSL errors:

1. Check your MongoDB Atlas cluster status
2. Verify network access settings
3. Ensure you're using the correct connection string format

## Testing Configuration

Test your configuration:

```bash
# Test MongoDB connection
python test_mongodb_connection.py

# Test server startup
python run.py
```

## Production Deployment

For production:

1. Use strong, unique JWT secrets
2. Set specific CORS origins (not `*`)
3. Use environment-specific MongoDB clusters
4. Set `HOST=0.0.0.0` for external access
5. Use environment variables from your hosting platform

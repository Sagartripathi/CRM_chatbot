# Production Deployment Guide

## Overview
This guide covers deploying the CRM backend with HTTPS/SSL support for production environments.

## SSL/HTTPS Configuration

### 1. Development (Self-Signed Certificates)

For local development and testing:

```bash
# Generate self-signed certificates
python generate_ssl_cert.py

# Update .env file
SSL_ENABLED=true
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key
```

### 2. Production (Trusted Certificates)

For production, use certificates from a trusted Certificate Authority:

#### Option A: Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update .env file
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Option B: Commercial Certificate
```bash
# Purchase certificate from CA (DigiCert, Comodo, etc.)
# Update .env file with certificate paths
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/your/certificate.crt
SSL_KEY_PATH=/path/to/your/private.key
```

## Environment Configuration

### Production .env File
```bash
# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=app-name
DB_NAME=crm_db

# Security Configuration
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Configuration
HOST=0.0.0.0
PORT=8000

# SSL/HTTPS Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key

# Production Configuration
WORKERS=4
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Development flags
SKIP_DB_CHECK=false
```

## Deployment Methods

### 1. Direct Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Run production server
python run_production.py
```

### 2. Using Gunicorn (Recommended)

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn app.main:app \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --certfile /path/to/certificate.crt \
  --keyfile /path/to/private.key
```

### 3. Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "run_production.py"]
```

```bash
# Build and run
docker build -t crm-backend .
docker run -p 8000:8000 \
  -e SSL_ENABLED=true \
  -e SSL_CERT_PATH=/app/certs/server.crt \
  -e SSL_KEY_PATH=/app/certs/server.key \
  crm-backend
```

### 4. Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Frontend Configuration

### Update Frontend Environment

Create `.env` in frontend directory:
```bash
REACT_APP_BACKEND_URL=https://yourdomain.com:8000
REACT_APP_PROXY_URL=https://yourdomain.com:8000
```

### Build for Production

```bash
# Build frontend
npm run build

# Serve with HTTPS (using serve)
npm install -g serve
serve -s build -l 3000 --ssl-cert /path/to/cert.crt --ssl-key /path/to/key.key
```

## Security Best Practices

### 1. SSL/TLS Configuration
- Use TLS 1.2 or higher
- Disable weak ciphers
- Enable HSTS headers
- Use strong certificate keys (2048+ bits)

### 2. Environment Security
- Never commit `.env` files
- Use strong, unique JWT secrets
- Rotate secrets regularly
- Use environment-specific configurations

### 3. Network Security
- Configure firewall rules
- Use VPN for database access
- Enable MongoDB Atlas IP whitelisting
- Use strong database passwords

### 4. Application Security
- Enable CORS with specific origins
- Use HTTPS for all communications
- Implement rate limiting
- Regular security updates

## Monitoring and Logging

### 1. Application Logs
```bash
# View logs
tail -f /var/log/crm-backend.log

# Log rotation
logrotate /etc/logrotate.d/crm-backend
```

### 2. SSL Certificate Monitoring
```bash
# Check certificate expiration
openssl x509 -in /path/to/certificate.crt -text -noout | grep "Not After"

# Auto-renewal script (Let's Encrypt)
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
```

### 3. Health Checks
```bash
# Backend health check
curl -k https://yourdomain.com:8000/api/

# SSL certificate check
curl -I https://yourdomain.com:8000/
```

## Troubleshooting

### Common SSL Issues

1. **Certificate Not Trusted**
   - Use trusted CA certificates
   - Check certificate chain
   - Verify domain name matches

2. **SSL Handshake Failed**
   - Check certificate and key paths
   - Verify file permissions
   - Ensure certificate is not expired

3. **Mixed Content Errors**
   - Ensure all resources use HTTPS
   - Update frontend proxy configuration
   - Check CORS settings

### Performance Optimization

1. **SSL Performance**
   - Use HTTP/2
   - Enable SSL session caching
   - Use strong but efficient ciphers

2. **Application Performance**
   - Use multiple workers
   - Enable connection pooling
   - Implement caching

## Backup and Recovery

### 1. Certificate Backup
```bash
# Backup certificates
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /path/to/certificates/
```

### 2. Configuration Backup
```bash
# Backup configuration
cp .env .env.backup
cp -r certs/ certs-backup/
```

### 3. Disaster Recovery
- Keep certificate backups secure
- Document certificate renewal process
- Test recovery procedures regularly

## Support

For issues with SSL/HTTPS configuration:
1. Check certificate validity
2. Verify file permissions
3. Test with curl/openssl
4. Check application logs
5. Verify network connectivity

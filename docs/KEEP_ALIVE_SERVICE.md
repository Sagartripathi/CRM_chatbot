# Keep Alive Service

## Overview

The Keep Alive Service is designed to prevent Render's free tier backend from spinning down due to inactivity. Render's free tier automatically spins down services after ~15 minutes of no activity, which causes the first request after inactivity to take 30-60 seconds to respond.

## How It Works

The service automatically pings the backend health endpoint (`/api/health`) every 10 minutes to keep the server active.

## Implementation

### Files

- `frontend/src/services/keepAliveService.ts` - Core keep-alive logic
- `frontend/src/App.tsx` - Integration point (starts service on app mount)

### Configuration

The service is configured to:
- **Ping Interval**: 10 minutes (600,000ms)
- **Endpoint**: `/api/health`
- **Mode**: Only active in production (disabled in development)

### Environment Variables

The service uses:
- `REACT_APP_BACKEND_URL` - Backend URL (defaults to `http://localhost:8000` in development)

## Usage

The service starts automatically when the app is loaded. No manual intervention required.

### Development Mode

In development, the service is disabled to avoid unnecessary API calls:
```typescript
if (process.env.NODE_ENV === "production" && !pingInterval) {
  // Service only runs in production
}
```

### Production Mode

In production on Render, the service:
1. Pings the backend immediately on app load
2. Continues pinging every 10 minutes
3. Logs successful pings to console

## Monitoring

Check browser console for keep-alive logs:
- `[KeepAlive] Backend health check successful at <timestamp>`
- `[KeepAlive] Failed to ping backend: <error>` (if issues occur)

## Benefits

✅ **Free Tier Friendly**: Works with Render's free tier
✅ **No Cold Starts**: Backend stays responsive
✅ **Automatic**: No manual intervention needed
✅ **Low Overhead**: Minimal resource usage

## Alternative Solutions

If the keep-alive service isn't sufficient, consider:

1. **Upgrade to Starter Plan**: Render's starter plan ($7/month) keeps services always-on
2. **External Ping Service**: Services like UptimeRobot (free) can ping your backend
3. **Render Cron Jobs**: Use Render's built-in cron jobs to keep services active

## Troubleshooting

### Backend Still Spinning Down

- Check that `REACT_APP_BACKEND_URL` is set correctly
- Verify the backend health endpoint is accessible
- Check browser console for errors
- Consider reducing ping interval (current: 10 minutes)

### Too Many Requests

- Current implementation: 1 request per 10 minutes
- Minimal bandwidth usage
- Backend health endpoint is lightweight

## Configuration

To change the ping interval, edit `frontend/src/services/keepAliveService.ts`:

```typescript
const PING_INTERVAL = 10 * 60 * 1000; // Change this value
```

**Recommended values:**
- 5 minutes: More aggressive (144 requests/day)
- 10 minutes: Balanced (144 requests/day) ✅ **Recommended**
- 15 minutes: Less aggressive, may allow spin-down

## Future Enhancements

Potential improvements:
- Configurable ping interval via environment variable
- Exponential backoff on errors
- User preference to disable/enable
- Dashboard showing keep-alive statistics


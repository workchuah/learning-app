# Keep-Alive Setup Guide

This application includes keep-alive mechanisms to prevent the server from going to sleep on free-tier hosting services like Render.

## How It Works

### 1. Server-Side Keep-Alive
- The backend server automatically pings itself every 14 minutes
- Uses the `/ping` endpoint (lightweight health check)
- Prevents the server from sleeping due to inactivity
- Works automatically in production when `RENDER_EXTERNAL_URL` is available

### 2. Client-Side Keep-Alive
- When any page is open, the frontend automatically pings the server every 5 minutes
- Uses the `/ping` endpoint
- Keeps the server alive while users are actively using the app
- Automatically stops when the page is closed

## Endpoints

- `/health` - Full health check with server stats
- `/ping` - Lightweight keep-alive ping (returns `{"status":"pong"}`)

## Configuration

### For Render (Automatic)
No configuration needed! The server automatically detects `RENDER_EXTERNAL_URL` and uses it for self-pinging.

### Manual Configuration (Optional)
If you want to manually set the keep-alive URL, add this environment variable in Render:

```
KEEP_ALIVE_URL=https://your-app-name.onrender.com
```

## Testing

1. **Test health endpoint:**
   ```
   curl https://your-app.onrender.com/health
   ```

2. **Test ping endpoint:**
   ```
   curl https://your-app.onrender.com/ping
   ```

3. **Monitor logs:**
   - Check Render logs for keep-alive ping messages
   - Should see: `✅ Keep-alive ping successful` every 14 minutes

## Troubleshooting

### Server Still Going to Sleep
1. Check that `RENDER_EXTERNAL_URL` is available (Render sets this automatically)
2. Verify the `/ping` endpoint is accessible
3. Check Render logs for keep-alive errors
4. Ensure client-side keep-alive is working (check browser console)

### Keep-Alive Not Working
1. **Server-side:** Check if `RENDER_EXTERNAL_URL` environment variable exists
2. **Client-side:** Open browser console and check for ping errors
3. **Network:** Verify CORS allows requests to `/ping` endpoint

## Notes

- Free tier services typically sleep after 15 minutes of inactivity
- Keep-alive pings every 14 minutes to stay ahead of the timeout
- Client-side keep-alive runs every 5 minutes when pages are open
- Both mechanisms work together for maximum reliability


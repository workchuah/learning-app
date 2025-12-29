# CORS Error Fix

## Issue
CORS error when accessing backend from Netlify frontend.

## Solution Applied

The backend CORS configuration has been updated to include your Netlify URL: `https://chuahlearningapp.netlify.app`

## Steps to Fix in Render

1. **Go to Render Dashboard** → Your backend service → Environment

2. **Add/Update Environment Variable:**
   ```
   FRONTEND_URL=https://chuahlearningapp.netlify.app
   ```

3. **Save and Redeploy:**
   - Render will automatically redeploy
   - Wait 2-3 minutes for deployment to complete

4. **Test:**
   - Visit: `https://learning-app-9oo4.onrender.com/api/health`
   - Should return JSON with CORS origins listed

## Verify CORS is Working

Open browser console on your Netlify site and run:
```javascript
fetch('https://learning-app-9oo4.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{status: 'healthy', ...}`

## If Still Not Working

1. Check Render logs for CORS errors
2. Verify `FRONTEND_URL` environment variable is set correctly
3. Make sure backend has been redeployed after the change
4. Clear browser cache and try again

## Current CORS Configuration

The backend now allows:
- `https://chuahlearningapp.netlify.app` (your Netlify URL)
- All localhost origins (for development)
- Custom headers for agent-specific API keys

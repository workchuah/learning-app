# Fix Render Deployment Error

## The Problem
Render is trying to run `/opt/render/project/src/backend/install` which doesn't exist. This happens when the **Root Directory** is not set correctly.

## Solution: Fix in Render Dashboard

### Option 1: Update via Render Dashboard (Recommended)

1. **Go to your Render Dashboard**
   - Visit https://dashboard.render.com
   - Click on your service: `chuah-learning-app-backend`

2. **Go to Settings**
   - Click on **"Settings"** tab in the left sidebar

3. **Update Root Directory**
   - Scroll down to **"Build & Deploy"** section
   - Find **"Root Directory"** field
   - Set it to: `backend`
   - Click **"Save Changes"**

4. **Verify Build & Start Commands**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Make sure these are correct

5. **Redeploy**
   - Go to **"Manual Deploy"** tab
   - Click **"Clear build cache & deploy"**
   - Wait for deployment to complete

### Option 2: Delete and Recreate Service

If Option 1 doesn't work:

1. **Delete the current service** (Settings → Delete Service)
2. **Create a new Web Service**
3. **When configuring, make sure to:**
   - Select your GitHub repository
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
   - Add all environment variables

## Quick Fix Checklist

- [ ] Go to Render Dashboard → Your Service → Settings
- [ ] Find "Root Directory" field
- [ ] Set to: `backend`
- [ ] Verify Build Command: `npm install`
- [ ] Verify Start Command: `npm start`
- [ ] Save changes
- [ ] Clear build cache & redeploy
- [ ] Check logs for success

## What Should Happen

After fixing, you should see in the logs:
```
✅ Installing dependencies...
✅ npm install completed
✅ Starting server...
✅ Server running on port 10000
```

## Still Having Issues?

If the error persists:

1. **Check the logs** - Look for the exact error message
2. **Verify file structure** - Make sure `backend/server.js` exists
3. **Check package.json** - Ensure it's in the `backend` folder
4. **Try manual deploy** - Clear cache and redeploy

## Alternative: Use render.yaml (Advanced)

If you prefer using the `render.yaml` file:

1. Make sure `render.yaml` is in the **root** of your repository (not in backend folder)
2. The file should have `rootDir: backend` specified
3. Render will automatically detect and use it

But the dashboard method (Option 1) is usually easier and more reliable.


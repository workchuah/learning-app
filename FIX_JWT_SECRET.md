# Fix JWT_SECRET Error

## The Problem
Error: `JWT_SECRET is not configured`

This means the `JWT_SECRET` environment variable is missing in your Render service.

## Solution: Add JWT_SECRET to Render

### Step 1: Generate a Secret Key

You need a random secret string (at least 32 characters). Here are ways to generate one:

**Option A: Use Node.js (in terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Use Online Generator:**
- Visit: https://randomkeygen.com/
- Copy a "CodeIgniter Encryption Keys" (64 characters)

**Option C: Use this one (for quick testing):**
```
chuah-learning-app-secret-key-2024-super-secure-random-string-12345
```

### Step 2: Add to Render Environment Variables

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click on your service: `chuah-learning-app-backend`

2. **Go to Environment Tab**
   - Click **"Environment"** in the left sidebar

3. **Add JWT_SECRET**
   - Click **"Add Environment Variable"**
   - **Key**: `JWT_SECRET`
   - **Value**: Paste your generated secret (the long random string)
   - Click **"Save Changes"**

4. **Wait for Redeploy**
   - Render will automatically redeploy your service
   - Wait 2-3 minutes for deployment to complete

5. **Test Again**
   - Try logging in again
   - The error should be gone!

## Quick Copy-Paste Solution

If you want to get started quickly, use this secret:

```
chuah-learning-app-jwt-secret-2024-super-secure-random-key-abcdefghijklmnopqrstuvwxyz1234567890
```

**Important:** For production, use a truly random secret generated with Option A or B above.

## Verify It's Set

After adding the environment variable:

1. Check Render logs - should see server starting without errors
2. Try login again - should work now
3. If still errors, check that:
   - Variable name is exactly: `JWT_SECRET` (case-sensitive)
   - No extra spaces in the value
   - Service has been redeployed

## All Required Environment Variables

Make sure you have ALL of these set in Render:

- ✅ `MONGODB_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - Random secret key (you're adding this now)
- ✅ `CLIENT_ORIGINS` - Your frontend URL (e.g., `https://your-app.netlify.app`)
- ✅ `NODE_ENV` - Set to `production`
- ✅ `PORT` - Set to `10000`
- ⚠️ `OPENAI_API_KEY` - Optional (for AI features)
- ⚠️ `GEMINI_API_KEY` - Optional (for AI features)

## After Fixing

Once you add `JWT_SECRET` and redeploy:

1. The server will start successfully
2. Login will work
3. You can create/login with admin user

Try it now and let me know if it works! 🚀


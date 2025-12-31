# Deployment Guide - Step by Step

This guide will walk you through deploying the Chuah Learning App to Render (Backend) and Netlify (Frontend).

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier works)
- Render account (free tier works)
- Netlify account (free tier works)
- OpenAI API key (optional, for AI features)
- Google Gemini API key (optional, for AI features)

---

## Part 1: MongoDB Atlas Setup

### Step 1.1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Create"** or **"Build a Database"**
4. Choose **FREE (M0)** tier
5. Select a cloud provider and region (choose closest to you)
6. Click **"Create"**

### Step 1.2: Create Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username and password (save these!)
5. Set privileges to **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### Step 1.3: Configure Network Access

1. In **Security** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
   - Or add specific IPs for better security
4. Click **"Confirm"**

### Step 1.4: Get Connection String

1. In **Deployment** section, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `chuah-learning-app` (or your preferred name)
6. **Save this connection string** - you'll need it for Render!

Example format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chuah-learning-app?retryWrites=true&w=majority
```

---

## Part 2: Backend Deployment on Render

### Step 2.1: Push Code to GitHub

1. **Initialize Git** (if not already done):
```bash
cd 15-chuah-learning-app
git init
git add .
git commit -m "Initial commit - Chuah Learning App"
```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com)
   - Click **"New repository"**
   - Name it: `chuah-learning-app`
   - Make it **Public** (or Private if you have GitHub Pro)
   - **Don't** initialize with README
   - Click **"Create repository"**

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/chuah-learning-app.git
git branch -M main
git push -u origin main
```

### Step 2.2: Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### Step 2.3: Create Web Service on Render

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select your repository: `chuah-learning-app`
4. Configure the service:
   - **Name**: `chuah-learning-app-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid if you prefer)

5. Click **"Advanced"** and add **Environment Variables**:
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chuah-learning-app?retryWrites=true&w=majority
   JWT_SECRET = your-random-secret-key-minimum-32-characters-long
   CLIENT_ORIGINS = https://your-netlify-app.netlify.app,https://your-custom-domain.com
   OPENAI_API_KEY = sk-your-openai-api-key
   GEMINI_API_KEY = your-gemini-api-key
   NODE_ENV = production
   PORT = 10000
   ```

   **Important Notes:**
   - Replace `MONGODB_URI` with your actual connection string from Step 1.4
   - Generate a strong `JWT_SECRET` (random string, 32+ characters)
   - For `CLIENT_ORIGINS`, you'll update this after deploying frontend
   - `OPENAI_API_KEY` and `GEMINI_API_KEY` are optional but needed for AI features
   - `PORT` should be `10000` for Render free tier

6. Click **"Create Web Service"**

7. **Wait for deployment** (5-10 minutes)
   - Render will install dependencies and start your server
   - Watch the logs for any errors

8. **Get your backend URL**:
   - Once deployed, you'll see: `https://chuah-learning-app-backend.onrender.com`
   - **Save this URL!** You'll need it for the frontend

### Step 2.4: Test Backend

1. Visit: `https://your-backend-url.onrender.com/health`
2. You should see: `{"status":"ok","timestamp":"..."}`
3. If it works, backend is deployed! ✅

---

## Part 3: Frontend Deployment on Netlify

### Step 3.1: Update Frontend API URL

1. **Update `frontend/js/config.js`**:
```javascript
// For production, you can set this to your Render backend URL
// Or we'll configure it via Netlify environment variable
const API_BASE_URL = window.__LEARNING_APP_API_BASE__ || 'https://your-backend-url.onrender.com/api';
```

   Or better: We'll use Netlify environment variable (see Step 3.3)

2. **Create a config file for Netlify** (optional but recommended):
   Create `frontend/js/config-netlify.js`:
```javascript
// This will be injected by Netlify
if (window.netlify && window.netlify.env) {
  window.__LEARNING_APP_API_BASE__ = window.netlify.env.get('API_BASE_URL');
}
```

   Actually, simpler approach: Update `frontend/js/config.js` to read from a meta tag or use Netlify's build-time injection.

### Step 3.2: Create Netlify Account

1. Go to [Netlify](https://www.netlify.com)
2. Sign up with GitHub (recommended)
3. Verify your email if needed

### Step 3.3: Deploy to Netlify

**Option A: Deploy via GitHub (Recommended)**

1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your repositories
4. Select your repository: `chuah-learning-app`
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: (leave empty or use: `echo "No build needed"`)
   - **Publish directory**: `frontend`
   - **Branch**: `main`

6. Click **"Show advanced"** and add **Environment Variables**:
   ```
   API_BASE_URL = https://your-backend-url.onrender.com/api
   ```

7. Click **"Deploy site"**

8. **Wait for deployment** (2-5 minutes)

9. **Get your frontend URL**:
   - Netlify will assign: `https://random-name-12345.netlify.app`
   - You can change this in **Site settings** → **Change site name**

**Option B: Deploy via Drag & Drop**

1. In Netlify dashboard, click **"Add new site"** → **"Deploy manually"**
2. Zip your `frontend` folder
3. Drag and drop the zip file
4. Wait for deployment
5. Add environment variable `API_BASE_URL` in **Site settings** → **Environment variables**

### Step 3.4: Update Frontend to Use Environment Variable

Since Netlify doesn't inject env vars into static HTML by default, we need to update the config:

1. **Update `frontend/js/config.js`**:
```javascript
// API Configuration
// Try to get from Netlify environment or use default
const API_BASE_URL = (() => {
  // Check if we're on Netlify and can access env vars
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    // For Netlify, we'll use a build-time replacement or meta tag
    const metaTag = document.querySelector('meta[name="api-base-url"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
  }
  // Fallback to default or window variable
  return window.__LEARNING_APP_API_BASE__ || 'https://your-backend-url.onrender.com/api';
})();

window.API_BASE_URL = API_BASE_URL;
```

2. **Add meta tag to all HTML files** (or use Netlify's build plugin):
   Add to `<head>` of each HTML file:
```html
<meta name="api-base-url" content="https://your-backend-url.onrender.com/api">
```

**Simpler Solution**: Update `frontend/js/config.js` directly with your Render URL:
```javascript
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
```

### Step 3.5: Update Backend CORS

1. Go back to **Render dashboard**
2. Edit your web service
3. Update environment variable:
   ```
   CLIENT_ORIGINS = https://your-netlify-app.netlify.app
   ```
4. Save and wait for redeployment

---

## Part 4: Final Configuration

### Step 4.1: Test the Full Application

1. Visit your Netlify URL: `https://your-app.netlify.app`
2. You should be redirected to login page
3. Login with:
   - User ID: `chuahadmin`
   - Password: `chuahchuah`
4. Test creating a course
5. Test AI generation (if API keys are set)

### Step 4.2: Custom Domain (Optional)

**Netlify:**
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

**Render:**
1. Go to your service settings
2. Add custom domain
3. Update DNS records as instructed

### Step 4.3: Monitor and Maintain

**Render:**
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading to paid tier for always-on service

**Netlify:**
- Free tier is generous and always-on
- Monitor bandwidth usage

---

## Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Check JWT_SECRET is set

**MongoDB connection errors:**
- Verify IP whitelist includes Render's IPs (0.0.0.0/0)
- Check username/password in connection string
- Ensure database name is correct

### Frontend Issues

**Can't connect to backend:**
- Verify API_BASE_URL is correct
- Check CORS settings in backend
- Ensure backend URL is in CLIENT_ORIGINS
- Check browser console for errors

**404 errors:**
- Ensure `netlify.toml` is in frontend folder
- Check publish directory is set to `frontend`

### AI Features Not Working

- Verify API keys are set in Render environment variables
- Check API key status in Admin Settings page
- Ensure you have credits/quota for AI providers
- Check Render logs for API errors

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string saved
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend deployed on Render
- [ ] Backend health check passes
- [ ] Frontend API URL updated
- [ ] Netlify account created
- [ ] Frontend deployed on Netlify
- [ ] CORS updated with Netlify URL
- [ ] Full application tested
- [ ] Login works
- [ ] Course creation works
- [ ] AI features work (if API keys set)

---

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Netlify logs: Site → Deploys → Click deploy → View logs
3. Check browser console: F12 → Console tab
4. Verify all environment variables are set correctly

---

## Cost Estimate

**Free Tier:**
- MongoDB Atlas: Free (M0 cluster)
- Render: Free (with limitations)
- Netlify: Free (generous limits)
- **Total: $0/month**

**Paid Tier (if needed):**
- Render: $7/month (always-on service)
- **Total: ~$7/month**

---

Good luck with your deployment! 🚀


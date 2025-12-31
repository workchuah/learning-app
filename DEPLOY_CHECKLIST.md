# Deployment Checklist - Quick Reference

Follow these steps in order. Check off each item as you complete it.

## 📋 Pre-Deployment Setup

- [ ] **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas
- [ ] **GitHub Account** - Sign up at https://github.com (if you don't have one)
- [ ] **Render Account** - Sign up at https://render.com
- [ ] **Netlify Account** - Sign up at https://www.netlify.com
- [ ] **OpenAI API Key** - Get from https://platform.openai.com/api-keys (optional)
- [ ] **Gemini API Key** - Get from https://makersuite.google.com/app/apikey (optional)

---

## 🗄️ Step 1: MongoDB Setup (10 minutes)

- [ ] Create MongoDB Atlas cluster (FREE tier)
- [ ] Create database user (save username & password!)
- [ ] Configure network access (Allow from anywhere: 0.0.0.0/0)
- [ ] Get connection string
- [ ] Replace `<password>` and `<dbname>` in connection string
- [ ] **SAVE CONNECTION STRING** - You'll need it for Render!

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/chuah-learning-app?retryWrites=true&w=majority
```

---

## 📦 Step 2: Prepare Code for GitHub (5 minutes)

- [ ] Open terminal in `15-chuah-learning-app` folder
- [ ] Run: `git init` (if not already a git repo)
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit"`
- [ ] Create new repository on GitHub (name it: `chuah-learning-app`)
- [ ] Run: `git remote add origin https://github.com/YOUR_USERNAME/chuah-learning-app.git`
- [ ] Run: `git branch -M main`
- [ ] Run: `git push -u origin main`

---

## 🚀 Step 3: Deploy Backend on Render (15 minutes)

- [ ] Go to https://render.com and login
- [ ] Click **"New +"** → **"Web Service"**
- [ ] Connect GitHub account (if not connected)
- [ ] Select repository: `chuah-learning-app`
- [ ] Configure:
  - Name: `chuah-learning-app-backend`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: **Free**
- [ ] Add Environment Variables:
  ```
  MONGODB_URI = [your MongoDB connection string from Step 1]
  JWT_SECRET = [generate random 32+ character string]
  CLIENT_ORIGINS = https://placeholder.netlify.app
  OPENAI_API_KEY = [your OpenAI key or leave empty]
  GEMINI_API_KEY = [your Gemini key or leave empty]
  NODE_ENV = production
  PORT = 10000
  ```
- [ ] Click **"Create Web Service"**
- [ ] Wait for deployment (5-10 minutes)
- [ ] **COPY YOUR BACKEND URL** (e.g., `https://chuah-learning-app-backend.onrender.com`)
- [ ] Test: Visit `https://your-backend-url.onrender.com/health`
- [ ] Should see: `{"status":"ok",...}` ✅

---

## 🌐 Step 4: Deploy Frontend on Netlify (10 minutes)

- [ ] Update `frontend/js/config.js`:
  - Change `API_BASE_URL` to your Render backend URL + `/api`
  - Example: `'https://chuah-learning-app-backend.onrender.com/api'`
- [ ] Commit and push changes:
  ```bash
  git add frontend/js/config.js
  git commit -m "Update API URL for production"
  git push
  ```
- [ ] Go to https://www.netlify.com and login
- [ ] Click **"Add new site"** → **"Import an existing project"**
- [ ] Choose **"Deploy with GitHub"**
- [ ] Authorize Netlify (if needed)
- [ ] Select repository: `chuah-learning-app`
- [ ] Configure:
  - Base directory: `frontend`
  - Build command: (leave empty)
  - Publish directory: `frontend`
- [ ] Click **"Deploy site"**
- [ ] Wait for deployment (2-5 minutes)
- [ ] **COPY YOUR FRONTEND URL** (e.g., `https://random-name-12345.netlify.app`)
- [ ] You can rename it in Site settings → Change site name

---

## 🔗 Step 5: Connect Frontend to Backend (5 minutes)

- [ ] Go back to **Render dashboard**
- [ ] Edit your web service
- [ ] Update environment variable:
  ```
  CLIENT_ORIGINS = https://your-netlify-app.netlify.app
  ```
  (Replace with your actual Netlify URL)
- [ ] Save changes (will auto-redeploy)
- [ ] Wait for redeployment (2-3 minutes)

---

## ✅ Step 6: Test Everything (5 minutes)

- [ ] Visit your Netlify URL
- [ ] Should redirect to login page
- [ ] Login with:
  - User ID: `chuahadmin`
  - Password: `chuahchuah`
- [ ] Create a test course
- [ ] Generate course structure
- [ ] Generate topic content (if API keys are set)
- [ ] Check Admin Settings → Verify API key status

---

## 🎉 Done!

Your app is now live! Share your Netlify URL with others.

---

## 🔧 Common Issues & Fixes

**Backend won't start:**
- Check Render logs → Look for error messages
- Verify all environment variables are set
- Check MongoDB connection string format

**Frontend can't connect:**
- Verify `CLIENT_ORIGINS` includes your Netlify URL
- Check `frontend/js/config.js` has correct backend URL
- Open browser console (F12) → Check for CORS errors

**MongoDB connection fails:**
- Verify IP whitelist includes 0.0.0.0/0
- Check username/password in connection string
- Ensure database name matches

---

## 📝 Important URLs to Save

- **MongoDB Connection String**: `mongodb+srv://...`
- **Backend URL**: `https://your-backend.onrender.com`
- **Frontend URL**: `https://your-app.netlify.app`
- **GitHub Repository**: `https://github.com/YOUR_USERNAME/chuah-learning-app`

---

**Need help?** Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions.


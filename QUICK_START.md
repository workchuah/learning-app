# Quick Start Deployment Guide

## 🚀 Deploy in 5 Steps

### Step 1: Set Up MongoDB Atlas (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free cluster (M0)
4. Create database user:
   - Database Access → Add New Database User
   - Username: `learningapp`
   - Password: Generate secure password (save it!)
5. Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
6. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Add database name: `...mongodb.net/learning_app`

**Example:** `mongodb+srv://learningapp:YourPassword123@cluster0.xxxxx.mongodb.net/learning_app`

### Step 2: Push to GitHub (2 minutes)

```bash
cd d:\OneDrive\PythonProject\15-chuah-learning-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/learning-app.git
git push -u origin main
```

### Step 3: Deploy Backend to Render (5 minutes)

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect GitHub → Select your repository
4. Configure:
   - **Name:** `learning-app-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://learningapp:YourPassword@cluster0.xxxxx.mongodb.net/learning_app
   DB_NAME=learning_app
   SECRET_KEY=generate-random-string-here
   FRONTEND_URL=https://your-app-name.netlify.app (update after Netlify)
   ```
6. Click "Create Web Service"
7. Wait for deployment (2-3 minutes)
8. Copy your Render URL: `https://learning-app-backend.onrender.com`

### Step 4: Deploy Frontend to Netlify (3 minutes)

1. **Update API URL:**
   - Edit `frontend/config.js`
   - Replace `https://your-backend.onrender.com/api` with your Render URL

2. **Push to GitHub:**
   ```bash
   git add frontend/config.js
   git commit -m "Update API URL"
   git push
   ```

3. **Deploy to Netlify:**
   - Go to https://app.netlify.com/
   - "Add new site" → "Import an existing project"
   - Connect GitHub → Select repository
   - Configure:
     - **Base directory:** `frontend`
     - **Build command:** (leave empty)
     - **Publish directory:** `frontend`
   - Click "Deploy site"
   - Copy your Netlify URL: `https://your-app-name.netlify.app`

4. **Update Backend CORS:**
   - Go back to Render → Environment
   - Update `FRONTEND_URL` with your Netlify URL
   - Save changes (will auto-redeploy)

### Step 5: Configure API Keys (2 minutes)

1. Visit your Netlify URL
2. Go to Settings page
3. Configure API keys for each agent
4. Test and save

## ✅ Done!

Your app is now live! 🎉

- **Frontend:** https://your-app-name.netlify.app
- **Backend:** https://learning-app-backend.onrender.com
- **Database:** MongoDB Atlas

## Troubleshooting

**Backend not connecting to MongoDB?**
- Check MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Verify connection string is correct
- Check Render logs for errors

**Frontend can't reach backend?**
- Verify `FRONTEND_URL` in Render matches Netlify URL
- Check `config.js` has correct Render URL
- Check browser console for CORS errors

**Need help?** Check `DEPLOYMENT.md` for detailed instructions.

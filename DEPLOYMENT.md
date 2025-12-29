# Deployment Guide

This guide will help you deploy the AI Learning App to production using GitHub, MongoDB Atlas, Render (backend), and Netlify (frontend).

## Prerequisites

1. GitHub account
2. MongoDB Atlas account (free tier available)
3. Render account (free tier available)
4. Netlify account (free tier available)

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Save the username and password
4. Whitelist IP addresses:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render
5. Get your connection string:
   - Go to "Clusters" → Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Replace `<password>` with your database password
   - Add database name: `mongodb+srv://username:password@cluster.mongodb.net/learning_app`

## Step 2: Deploy Backend to Render

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/learning-app.git
   git push -u origin main
   ```

2. **Create Render Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository
   - Configure:
     - **Name:** `learning-app-backend`
     - **Environment:** `Python 3`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `gunicorn app:app`
     - **Root Directory:** `backend`

3. **Set Environment Variables in Render:**
   - Go to your service → "Environment"
   - Add these variables:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learning_app
     DB_NAME=learning_app
     SECRET_KEY=your-secret-key-here (generate a random string)
     FRONTEND_URL=https://your-app-name.netlify.app
     PYTHON_VERSION=3.11.0
     ```
   - Optional (for default API keys):
     ```
     OPENAI_API_KEY=your-openai-key (optional)
     GEMINI_API_KEY=your-gemini-key (optional)
     ```

4. **Deploy:**
   - Render will automatically deploy when you push to GitHub
   - Wait for deployment to complete
   - Copy your Render URL (e.g., `https://learning-app-backend.onrender.com`)

## Step 3: Deploy Frontend to Netlify

1. **Update API URL:**
   - Edit `frontend/common.js` and `frontend/settings.js`
   - Replace `https://your-backend.onrender.com/api` with your actual Render URL

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

3. **Deploy to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Configure:
     - **Base directory:** `frontend`
     - **Build command:** Leave empty (or `echo "No build needed"`)
     - **Publish directory:** `frontend`
   - Click "Deploy site"

4. **Set Environment Variables (Optional):**
   - Go to Site settings → Environment variables
   - Add: `API_BASE_URL=https://your-backend.onrender.com/api`
   - This allows you to change the API URL without code changes

5. **Update CORS in Backend:**
   - Go back to Render → Environment variables
   - Update `FRONTEND_URL` with your Netlify URL (e.g., `https://your-app-name.netlify.app`)

## Step 4: Configure Frontend to Use Production API

If you set `API_BASE_URL` in Netlify environment variables, update `common.js`:

```javascript
const API_BASE_URL = window.API_BASE_URL || 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://your-backend.onrender.com/api');
```

Or create a `config.js` file that Netlify can inject:

```javascript
// config.js
window.API_BASE_URL = 'https://your-backend.onrender.com/api';
```

## Step 5: Test Your Deployment

1. Visit your Netlify URL
2. Go to Settings and configure API keys
3. Create a test course
4. Verify data is saved in MongoDB Atlas

## Troubleshooting

### Backend Issues

- **MongoDB Connection Failed:**
  - Check MongoDB Atlas IP whitelist includes Render IPs
  - Verify connection string is correct
  - Check database user permissions

- **Render Deployment Fails:**
  - Check build logs in Render dashboard
  - Ensure `requirements.txt` is correct
  - Verify `Procfile` exists

### Frontend Issues

- **CORS Errors:**
  - Update `FRONTEND_URL` in Render environment variables
  - Check backend CORS configuration

- **API Calls Fail:**
  - Verify API_BASE_URL is correct
  - Check browser console for errors
  - Ensure backend is running and accessible

## Environment Variables Summary

### Render (Backend)
- `MONGODB_URI` - MongoDB Atlas connection string
- `DB_NAME` - Database name (default: learning_app)
- `SECRET_KEY` - Flask session secret key
- `FRONTEND_URL` - Your Netlify URL
- `OPENAI_API_KEY` - (Optional) Default OpenAI key
- `GEMINI_API_KEY` - (Optional) Default Gemini key
- `PORT` - (Auto-set by Render)

### Netlify (Frontend)
- `API_BASE_URL` - (Optional) Backend API URL

## Security Notes

1. Never commit `.env` files or API keys to GitHub
2. Use environment variables for all sensitive data
3. Keep MongoDB Atlas IP whitelist restricted when possible
4. Use strong SECRET_KEY for Flask sessions
5. Regularly rotate API keys

## Cost Estimation

- **MongoDB Atlas:** Free tier (512MB storage)
- **Render:** Free tier (spins down after 15 min inactivity)
- **Netlify:** Free tier (100GB bandwidth/month)
- **Total:** $0/month for small-scale usage

## Next Steps

- Set up custom domain (optional)
- Configure SSL certificates (automatic with Netlify/Render)
- Set up monitoring and logging
- Configure backup strategy for MongoDB

# Deployment Checklist

## Pre-Deployment

- [ ] All code is committed to GitHub
- [ ] `.env` file is NOT committed (in .gitignore)
- [ ] `config.js` has placeholder URL (will update after Render deployment)
- [ ] MongoDB Atlas cluster is created
- [ ] MongoDB database user is created
- [ ] MongoDB IP whitelist includes 0.0.0.0/0

## Backend Deployment (Render)

- [ ] Repository pushed to GitHub
- [ ] Render account created
- [ ] New Web Service created in Render
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn app:app`
- [ ] Environment variables set:
  - [ ] `MONGODB_URI` (from MongoDB Atlas)
  - [ ] `DB_NAME=learning_app`
  - [ ] `SECRET_KEY` (random string)
  - [ ] `FRONTEND_URL` (placeholder, update after Netlify)
- [ ] Service deployed successfully
- [ ] Health check: `https://your-backend.onrender.com/api/health`
- [ ] Backend URL copied: `https://your-backend.onrender.com`

## Frontend Deployment (Netlify)

- [ ] `frontend/config.js` updated with Render URL
- [ ] Changes pushed to GitHub
- [ ] Netlify account created
- [ ] New site created from GitHub
- [ ] Base directory set to `frontend`
- [ ] Build command: (empty or `echo "No build needed"`)
- [ ] Publish directory: `frontend`
- [ ] Site deployed successfully
- [ ] Netlify URL copied: `https://your-app-name.netlify.app`

## Post-Deployment

- [ ] Update Render `FRONTEND_URL` with Netlify URL
- [ ] Wait for Render to redeploy
- [ ] Test frontend → backend connection
- [ ] Configure API keys in Settings page
- [ ] Test course creation
- [ ] Test content generation
- [ ] Verify data in MongoDB Atlas

## Testing Checklist

- [ ] Can access frontend at Netlify URL
- [ ] Can access backend health endpoint
- [ ] Settings page loads
- [ ] Can save API keys
- [ ] Can test API keys
- [ ] Can create a course
- [ ] Course structure generates
- [ ] Can view course modules/topics
- [ ] Can generate topic content
- [ ] Progress tracking works
- [ ] Data persists in MongoDB Atlas

## Troubleshooting

**If backend fails to start:**
- Check Render logs
- Verify all environment variables are set
- Check MongoDB connection string format

**If frontend can't connect:**
- Verify `config.js` has correct Render URL
- Check CORS settings in backend
- Verify `FRONTEND_URL` in Render matches Netlify URL

**If MongoDB connection fails:**
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Check database user permissions

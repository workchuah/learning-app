# Fix Frontend Connection Error

## The Problem
`ERR_CONNECTION_REFUSED` means the frontend can't connect to the backend. This happens when:
1. The API URL is incorrect (fixed - had extra spaces)
2. You're testing locally but the frontend is pointing to Render
3. CORS is blocking the request

## Solutions

### Solution 1: If Testing Locally

If you're opening `login.html` directly in your browser (file://), you need to:

1. **Use a local server** (required for CORS):
```bash
cd frontend
python -m http.server 3000
```

2. **Update `frontend/js/config.js`** to use localhost:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

3. **Make sure backend is running locally**:
```bash
cd backend
npm run dev
```

### Solution 2: If Testing on Netlify (Production)

1. **Update `frontend/js/config.js`** (already fixed):
```javascript
const API_BASE_URL = 'https://learning-app-cpdm.onrender.com/api';
```

2. **Update CORS in Render**:
   - Go to Render Dashboard → Your Service → Environment
   - Update `CLIENT_ORIGINS` to include your Netlify URL:
   ```
   CLIENT_ORIGINS = https://your-netlify-app.netlify.app
   ```
   - Save and wait for redeploy

3. **Push changes to GitHub**:
```bash
git add frontend/js/config.js
git commit -m "Fix API URL"
git push
```

4. **Netlify will auto-deploy** the updated frontend

### Solution 3: Test Backend Directly

First, verify your backend is accessible:

1. **Test health endpoint**:
   Visit: `https://learning-app-cpdm.onrender.com/health`
   Should see: `{"status":"ok",...}`

2. **Test login endpoint** (using browser console or Postman):
   ```javascript
   fetch('https://learning-app-cpdm.onrender.com/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'chuahadmin', password: 'chuahchuah' })
   })
   .then(r => r.json())
   .then(console.log)
   ```

## Quick Checklist

- [ ] Fixed extra spaces in `config.js` ✅
- [ ] Updated API URL to Render backend
- [ ] If local: Using local server (not file://)
- [ ] If local: Backend running on localhost:5000
- [ ] If production: CORS includes Netlify URL
- [ ] Pushed changes to GitHub
- [ ] Tested backend health endpoint

## Common Issues

**"Failed to fetch" / "Connection refused":**
- API URL is wrong → Check `config.js`
- Backend not running → Check Render logs
- CORS blocking → Update `CLIENT_ORIGINS` in Render

**"CORS error":**
- Frontend origin not in `CLIENT_ORIGINS`
- Update Render environment variable

**"401 Unauthorized":**
- Wrong credentials
- Default admin: `chuahadmin` / `chuahchuah`

## Next Steps

1. **If testing locally:**
   - Use local server
   - Point to localhost:5000
   - Run backend locally

2. **If deploying to Netlify:**
   - Update config.js with Render URL ✅
   - Update CORS in Render
   - Push to GitHub
   - Test on Netlify


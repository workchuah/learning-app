# Chuah Learning App - Frontend

AI-assisted learning web app frontend built with vanilla HTML, CSS, and JavaScript.

## Setup

1. Update the API URL in `js/config.js`:
   - For local development: `http://localhost:5000/api`
   - For production: Your Render backend URL

2. Open `login.html` in a web browser or use a local server:
```bash
# Using Python
cd frontend
python -m http.server 3000

# Using Node.js (if you have http-server installed)
npx http-server frontend -p 3000
```

3. Access the app at `http://localhost:3000/login.html`

## Default Admin Credentials

- User ID: `chuahadmin`
- Password: `chuahchuah`

## Pages

- `/login.html` - Login page
- `/dashboard.html` - Course dashboard
- `/course.html?id=<courseId>` - Course details
- `/topic.html?id=<topicId>&courseId=<courseId>` - Topic details
- `/admin-settings.html` - Admin settings

## Deployment

This frontend is designed to be deployed on Netlify. The `netlify.toml` file contains the necessary configuration.

### Netlify Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: (leave empty or use a simple command)
   - Publish directory: `frontend`
4. Add environment variable (if needed):
   - `API_BASE_URL` - Your backend API URL

## File Structure

```
frontend/
├── login.html
├── dashboard.html
├── course.html
├── topic.html
├── admin-settings.html
├── css/
│   └── style.css
└── js/
    ├── config.js
    ├── storage.js
    ├── auth.js
    ├── api.js
    ├── dashboard.js
    ├── course.js
    ├── topic.js
    └── admin-settings.js
```


# Chuah Learning App

A production-ready learning web application with AI-assisted course generation and progress tracking.

## Features

- **Course Creation**: Create courses with title, goal, and timeline. Optionally upload course outlines (PDF/TXT/MD).
- **AI Course Structure**: AI automatically breaks courses into Modules and Topics.
- **AI Content Generation**: For each topic, AI generates:
  - Detailed lecture notes
  - Tutorial exercises with answers
  - Practical tasks with step-by-step instructions
  - Exam quizzes (MCQ + short answers) with answer keys and explanations
- **Progress Tracking**: Track learning progress per course/module/topic with timestamps and quiz scores.
- **Multi-Agent AI**: Uses OpenAI and Google Gemini with automatic fallback.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **AI Providers**: OpenAI, Google Gemini
- **Deployment**: Backend on Render, Frontend on Netlify

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A random secret string
- `CLIENT_ORIGINS`: Comma-separated frontend URLs
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `GEMINI_API_KEY`: Your Google Gemini API key (optional)

5. Start the server:
```bash
npm run dev  # Development
npm start    # Production
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Update API URL in `js/config.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

3. Start a local server:
```bash
python -m http.server 3000
```

4. Open `http://localhost:3000/login.html`

## Default Admin Credentials

- **User ID**: `chuahadmin`
- **Password**: `chuahchuah`

## Project Structure

```
15-chuah-learning-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── css/
│   ├── js/
│   ├── *.html
│   └── README.md
└── README.md
```

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Connect repository to Render
3. Use the `render.yaml` configuration
4. Set environment variables in Render dashboard

### Frontend (Netlify)

1. Push code to GitHub
2. Connect repository to Netlify
3. Set build directory to `frontend`
4. Deploy

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check auth status

### Courses
- `POST /api/courses` - Create course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/generate-structure` - Generate course structure
- `DELETE /api/courses/:id` - Delete course

### Topics
- `GET /api/topics/:id` - Get topic details
- `POST /api/topics/:id/generate-content` - Generate topic content
- `PATCH /api/topics/:id/practical-task` - Update task completion

### Progress
- `POST /api/progress` - Update progress
- `GET /api/progress` - Get progress records
- `GET /api/progress/course/:courseId` - Get course progress

### Admin
- `GET /api/admin/settings` - Get AI settings
- `PATCH /api/admin/settings` - Update AI settings

## License

© 2024 Chuah Learning App. All rights reserved.


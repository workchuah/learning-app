# Chuah Learning App - Backend

AI-assisted learning web app backend built with Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A random secret string for JWT tokens
- `CLIENT_ORIGINS`: Comma-separated list of allowed frontend origins
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `GEMINI_API_KEY`: Your Google Gemini API key (optional)

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Default Admin Credentials

- User ID: `chuahadmin`
- Password: `chuahchuah`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check authentication status

### Courses
- `POST /api/courses` - Create new course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/generate-structure` - Generate course structure (modules & topics)
- `DELETE /api/courses/:id` - Delete course

### Topics
- `GET /api/topics/:id` - Get topic details
- `POST /api/topics/:id/generate-content` - Generate topic content (lecture notes, exercises, tasks, quiz)
- `PATCH /api/topics/:id/practical-task` - Update practical task completion

### Progress
- `POST /api/progress` - Update learning progress
- `GET /api/progress` - Get progress records
- `GET /api/progress/course/:courseId` - Get course progress

### Admin
- `GET /api/admin/settings` - Get AI settings
- `PATCH /api/admin/settings` - Update AI settings

## Deployment

This backend is designed to be deployed on Render. See `render.yaml` for configuration.


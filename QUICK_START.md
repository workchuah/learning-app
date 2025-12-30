# Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- OpenAI API key (optional, for AI features)
- Google Gemini API key (optional, for AI features)

## Backend Setup

1. **Navigate to backend directory:**
```bash
cd 15-chuah-learning-app/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
# Copy the example file
# Then edit .env and add your values
```

4. **Configure `.env` file:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chuah-learning-app?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
CLIENT_ORIGINS=http://localhost:3000,http://localhost:8080
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
PORT=5000
```

5. **Start the backend:**
```bash
npm run dev  # Development mode with auto-reload
# OR
npm start    # Production mode
```

The backend will start on `http://localhost:5000`

## Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd 15-chuah-learning-app/frontend
```

2. **Update API URL in `js/config.js`:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

3. **Start a local server:**
```bash
# Option 1: Python
python -m http.server 3000

# Option 2: Node.js (if you have http-server)
npx http-server -p 3000

# Option 3: PHP
php -S localhost:3000
```

4. **Open in browser:**
```
http://localhost:3000/login.html
```

## Default Login

- **User ID:** `chuahadmin`
- **Password:** `chuahchuah`

## First Steps

1. **Login** with the default admin credentials
2. **Create a Course:**
   - Click "Create New Course"
   - Fill in title, goal, and timeline
   - Optionally upload a course outline (PDF/TXT/MD)
   - Click "Create Course"

3. **Generate Course Structure:**
   - Open your course
   - Click "Generate Course Structure"
   - Wait for AI to create modules and topics

4. **Generate Topic Content:**
   - Click on a topic
   - Click "Generate Topic Content"
   - Wait for AI to generate lecture notes, exercises, tasks, and quiz

5. **Configure AI Settings:**
   - Go to Settings
   - Check API key status
   - Select AI provider preference
   - Choose models

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure JWT_SECRET is set
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS settings in backend `.env`
- Ensure API_BASE_URL in `js/config.js` is correct

### AI features not working
- Verify API keys are set in backend `.env`
- Check API key status in Admin Settings
- Ensure you have credits/quota for the AI providers

### MongoDB connection issues
- Verify connection string format
- Check network access in MongoDB Atlas
- Ensure IP is whitelisted (or use 0.0.0.0/0 for development)

## Next Steps

- Read the full README.md for detailed documentation
- Check backend/README.md for API documentation
- Check frontend/README.md for frontend details


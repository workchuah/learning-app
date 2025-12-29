# AI Learning Web App

A comprehensive learning web application with AI assistance for course creation, content generation, and progress tracking.

## Features

1. **Course Creation**: Create main courses with optional course structure/outline upload
2. **AI-Powered Breakdown**: Automatically breaks down courses into modules and topics
3. **Content Generation**: AI generates comprehensive content for each topic including:
   - Lecture Notes (detailed explanations)
   - Tutorial Exercises
   - Practical/Hands-on Exercises
   - Exam Quizzes
4. **Progress Tracking**: Track your learning progress across all courses and topics

## AI Agent Architecture

The app uses **5 specialized AI agents**, each with a unique role and expertise:

1. **Course Structure Designer Agent** 🎓
   - Role: Expert course designer and curriculum developer
   - Responsibility: Breaks down courses into logical modules and topics
   - Creates progressive learning paths that build knowledge systematically

2. **Lecture Notes Writer Agent** 📝
   - Role: Master educator and content writer
   - Responsibility: Creates comprehensive, detailed lecture notes
   - Ensures all key concepts are thoroughly explained with examples

3. **Tutorial Exercise Designer Agent** 📚
   - Role: Expert tutorial designer
   - Responsibility: Creates step-by-step tutorial exercises and practice problems
   - Designs progressive exercises that build skills gradually

4. **Practical Exercise Designer Agent** 🔧
   - Role: Expert in hands-on, real-world exercises
   - Responsibility: Creates practical exercises that bridge theory and practice
   - Designs real-world scenarios and projects

5. **Quiz Creator Agent** ✅
   - Role: Expert assessment designer
   - Responsibility: Creates comprehensive exam quizzes
   - Writes clear questions that test understanding, not just memorization

Each agent uses specialized system prompts and is optimized for its specific task, ensuring high-quality, role-appropriate content generation.

## Project Structure

```
15-chuah-learning-app/
├── frontend/
│   ├── index.html          # Dashboard
│   ├── create-course.html  # Create new course
│   ├── course-detail.html  # Course modules and topics
│   ├── topic-detail.html    # Topic content view
│   ├── progress.html        # Progress tracking
│   ├── settings.html        # API key configuration
│   ├── style.css            # All styling
│   ├── config.js            # API configuration
│   ├── common.js            # Shared utilities
│   └── *.js                 # Page-specific JavaScript
├── backend/
│   ├── app.py              # Flask backend with AI integration
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Render deployment config
│   ├── render.yaml         # Render service config
│   └── .env.example        # Environment variables template
├── DEPLOYMENT.md           # Deployment guide
└── README.md
```

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file:
```bash
copy .env.example .env  # Windows
# or
cp .env.example .env    # Mac/Linux
```

6. Edit `.env` and configure:
   - MongoDB URI (or leave empty for in-memory storage)
   - API keys (optional - can be set in frontend settings)

7. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open `frontend/index.html` in a web browser, or use a local server:

   **Option 1: Using Python's built-in server**
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser

   **Option 2: Using Node.js http-server**
   ```bash
   npx http-server frontend -p 8000
   ```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- **GitHub** - Version control
- **MongoDB Atlas** - Database
- **Render** - Backend hosting
- **Netlify** - Frontend hosting

## Usage

1. **Configure API Keys**:
   - Go to Settings page
   - Configure API keys for each AI agent
   - Choose provider (OpenAI or Gemini) for each agent
   - Test and save

2. **Create a Course**:
   - Click "Create New Course"
   - Enter course name and description
   - Optionally upload a course structure/outline file
   - If no file is uploaded, AI will generate the course structure

3. **View Course Structure**:
   - Click on any course card to view modules and topics
   - Expand modules to see topics
   - Click on topics to view details

4. **Generate Content**:
   - Open a topic
   - Click "Generate Content" to create:
     - Lecture Notes
     - Tutorial Exercises
     - Practical Exercises
     - Exam Quiz

5. **Track Progress**:
   - Navigate to "Progress" to see overall learning statistics
   - Mark topics as complete when finished
   - Take quizzes to test your knowledge

## API Endpoints

- `POST /api/courses` - Create a new course
- `GET /api/courses` - Get all courses
- `GET /api/courses/<course_id>` - Get course details
- `POST /api/courses/<course_id>/generate-structure` - Generate course structure
- `POST /api/topics/<topic_id>/generate-content` - Generate topic content
- `GET /api/topics/<topic_id>` - Get topic content
- `GET /api/progress` - Get all progress data
- `POST /api/progress` - Update progress
- `POST /api/set-agent-api-keys` - Set agent API keys
- `POST /api/test-api-key` - Test API key
- `GET /api/health` - Health check

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python, Flask
- **Database**: MongoDB Atlas (with in-memory fallback)
- **AI**: OpenAI GPT-4 API, Google Gemini API
- **Deployment**: Render (backend), Netlify (frontend)
- **Storage**: MongoDB Atlas (production), LocalStorage (frontend), In-memory (backend fallback)

## License

This project is for educational purposes.
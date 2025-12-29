from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS  # type: ignore
import os
import json
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from openai import OpenAI
import google.generativeai as genai  # type: ignore
from dotenv import load_dotenv
from functools import wraps
from pymongo import MongoClient  # type: ignore
from pymongo.errors import ConnectionFailure  # type: ignore

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', os.urandom(24).hex())  # Required for sessions

# CORS configuration - allow Netlify domain and localhost
# Get frontend URL from environment or use default
frontend_url = os.getenv('FRONTEND_URL', 'https://chuahlearningapp.netlify.app')

# Build allowed origins list - include both the env var and hardcoded Netlify URL
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5000",
    "https://chuahlearningapp.netlify.app",  # Your Netlify URL
    frontend_url  # From environment variable
]

# Remove duplicates and filter out None values
allowed_origins = list(set([origin for origin in allowed_origins if origin]))

print(f"CORS allowed origins: {allowed_origins}")

# Build custom headers list for agent-specific API keys
custom_headers = [
    'Content-Type', 
    'Authorization', 
    'X-API-Provider', 
    'X-OpenAI-API-Key', 
    'X-Gemini-API-Key'
]

# Add agent-specific headers
agents = ['course_structure', 'lecture_notes', 'tutorial', 'practical', 'quiz']
for agent in agents:
    custom_headers.extend([
        f'X-Agent-{agent}-Provider',
        f'X-Agent-{agent}-OpenAI-Key',
        f'X-Agent-{agent}-Gemini-Key'
    ])

# Configure CORS with explicit settings
CORS(app, 
     supports_credentials=True,
     origins=allowed_origins,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['*'],  # Allow all headers for simplicity
     expose_headers=['Content-Type'],
     max_age=3600)

# Add explicit OPTIONS handler for all routes
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

# Authentication Configuration
VALID_USERID = 'chuahlearn'
VALID_PASSWORD = 'chuahchuah'

def login_required(f):
    """Decorator to require login for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests to pass through (handled by before_request)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        # Check if user is logged in
        if not session.get('logged_in'):
            response = jsonify({'error': 'Authentication required', 'authenticated': False})
            # Add CORS headers even for error responses
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 401
        return f(*args, **kwargs)
    return decorated_function

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_agent_api_config(agent_name):
    """Get API provider and key for a specific agent"""
    # Priority: Request header > Agent storage > Session > Environment variable
    
    # Check request headers for agent-specific keys
    agent_provider_header = request.headers.get(f'X-Agent-{agent_name}-Provider')
    agent_openai_key = request.headers.get(f'X-Agent-{agent_name}-OpenAI-Key')
    agent_gemini_key = request.headers.get(f'X-Agent-{agent_name}-Gemini-Key')
    
    # Check agent storage
    if agent_name in agent_api_keys:
        agent_config = agent_api_keys[agent_name]
        provider = agent_provider_header or agent_config.get('provider', 'openai')
        openai_key = agent_openai_key or agent_config.get('openai_key')
        gemini_key = agent_gemini_key or agent_config.get('gemini_key')
    else:
        # Fall back to general API config
        provider = agent_provider_header or request.headers.get('X-API-Provider', 'openai').lower()
        openai_key = agent_openai_key or request.headers.get('X-OpenAI-API-Key')
        gemini_key = agent_gemini_key or request.headers.get('X-Gemini-API-Key')
        
        # Check session
        if not openai_key and 'openai_api_key' in session:
            openai_key = session['openai_api_key']
        if not gemini_key and 'gemini_api_key' in session:
            gemini_key = session['gemini_api_key']
        if 'api_provider' in session and not agent_provider_header:
            provider = session['api_provider']
        
        # Fall back to environment variables
        if not openai_key:
            openai_key = os.getenv('OPENAI_API_KEY')
        if not gemini_key:
            gemini_key = os.getenv('GEMINI_API_KEY')
    
    return {
        'provider': provider.lower(),
        'openai_key': openai_key,
        'gemini_key': gemini_key
    }

def get_api_provider():
    """Get API provider and keys from request or session (legacy support)"""
    return get_agent_api_config('default')

def get_ai_client(provider_info):
    """Get AI client based on provider"""
    provider = provider_info['provider']
    
    if provider == 'gemini':
        if provider_info['gemini_key']:
            genai.configure(api_key=provider_info['gemini_key'])
            return genai.GenerativeModel('gemini-pro')
        return None
    else:  # default to openai
        if provider_info['openai_key']:
            return OpenAI(api_key=provider_info['openai_key'])
        return None

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'learning_app')

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    db = client[DB_NAME]
    print(f"✓ Connected to MongoDB: {DB_NAME}")
except ConnectionFailure as e:
    print(f"✗ MongoDB connection failed: {e}")
    print("Falling back to in-memory storage")
    db = None

# Collections
def get_collection(name):
    """Get MongoDB collection or return None if not connected"""
    # PyMongo Database objects do not implement truthiness, so we must compare with None explicitly
    if db is not None:
        return db[name]
    return None

# Fallback in-memory storage if MongoDB not available
courses_db = {}
topics_db = {}
progress_db = {}
agent_api_keys = {}

def save_to_db(collection_name, data_id, data):
    """Save data to MongoDB or fallback storage"""
    collection = get_collection(collection_name)
    if collection is not None:
        collection.update_one(
            {'_id': data_id},
            {'$set': data},
            upsert=True
        )
    else:
        # Fallback to in-memory
        if collection_name == 'courses':
            courses_db[data_id] = data
        elif collection_name == 'topics':
            topics_db[data_id] = data
        elif collection_name == 'progress':
            progress_db[data_id] = data
        elif collection_name == 'agent_keys':
            agent_api_keys[data_id] = data

def get_from_db(collection_name, data_id):
    """Get data from MongoDB or fallback storage"""
    collection = get_collection(collection_name)
    if collection is not None:
        result = collection.find_one({'_id': data_id})
        if result:
            # Remove MongoDB's _id field for consistency
            result.pop('_id', None)
            return result
        return None
    else:
        # Fallback to in-memory
        if collection_name == 'courses':
            return courses_db.get(data_id)
        elif collection_name == 'topics':
            return topics_db.get(data_id)
        elif collection_name == 'progress':
            return progress_db.get(data_id)
        elif collection_name == 'agent_keys':
            return agent_api_keys.get(data_id)
    
def get_all_from_db(collection_name):
    """Get all documents from MongoDB or fallback storage"""
    collection = get_collection(collection_name)
    if collection is not None:
        # Exclude _id field for consistency
        results = list(collection.find({}, {'_id': 0}))
        return results
    else:
        # Fallback to in-memory
        if collection_name == 'courses':
            return list(courses_db.values())
        elif collection_name == 'topics':
            return list(topics_db.values())
        elif collection_name == 'progress':
            return list(progress_db.values())
        elif collection_name == 'agent_keys':
            return list(agent_api_keys.values())
    return []

def delete_from_db(collection_name, data_id):
    """Delete data from MongoDB or fallback storage"""
    collection = get_collection(collection_name)
    if collection is not None:
        collection.delete_one({'_id': data_id})
    else:
        # Fallback to in-memory
        if collection_name == 'courses' and data_id in courses_db:
            del courses_db[data_id]
        elif collection_name == 'topics' and data_id in topics_db:
            del topics_db[data_id]
        elif collection_name == 'progress' and data_id in progress_db:
            del progress_db[data_id]
        elif collection_name == 'agent_keys' and data_id in agent_api_keys:
            del agent_api_keys[data_id]

# Load agent keys from MongoDB on startup
def load_agent_keys():
    """Load agent API keys from MongoDB"""
    global agent_api_keys
    all_keys = get_all_from_db('agent_keys')
    if all_keys:
        agent_api_keys = {}
        for item in all_keys:
            agent_name = item.get('agent_name')
            if agent_name:
                # Store just the config, not the agent_name key
                agent_api_keys[agent_name] = {
                    'provider': item.get('provider', 'openai'),
                    'openai_key': item.get('openai_key'),
                    'gemini_key': item.get('gemini_key')
                }
    else:
        agent_api_keys = {}

def save_agent_keys():
    """Save agent API keys to MongoDB"""
    for agent_name, config in agent_api_keys.items():
        save_to_db('agent_keys', agent_name, {
            'agent_name': agent_name,
            **config
        })

# Load agent keys on startup
load_agent_keys()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_uploaded_file(filepath):
    """Read content from uploaded file"""
    try:
        if filepath.endswith('.txt'):
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        # For PDF, DOC, DOCX, you would need additional libraries like PyPDF2, python-docx
        # For now, return placeholder
        return None
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

def generate_with_ai(prompt, system_prompt=None, max_tokens=2000, model="gpt-4", agent_name=None):
    """Generate content using selected AI provider (OpenAI or Gemini)"""
    if agent_name:
        provider_info = get_agent_api_config(agent_name)
    else:
        provider_info = get_api_provider()
    client = get_ai_client(provider_info)
    
    if not client:
        # Return mock data if API is not configured
        return generate_mock_response(prompt)
    
    try:
        provider = provider_info['provider']
        
        if provider == 'gemini':
            # Gemini API
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = client.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7
                )
            )
            return response.text
        else:
            # OpenAI API
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
    except Exception as e:
        print(f"AI API Error ({provider_info['provider']}): {e}")
        # Return mock data if API call fails
        return generate_mock_response(prompt)

# ============================================================================
# AI AGENTS - Each agent has a specialized role for different generation tasks
# ============================================================================

def course_structure_designer_agent(course_name, course_description, outline_content=None):
    """
    AI Agent 1: Course Structure Designer
    Role: Expert course designer who breaks down courses into logical modules and topics
    """
    system_prompt = """You are an expert course designer and curriculum developer with years of experience in educational design. 
Your specialty is analyzing course objectives and creating well-structured, progressive learning paths that build knowledge systematically.
You excel at:
- Breaking down complex subjects into digestible modules
- Creating logical topic sequences that build upon each other
- Ensuring comprehensive coverage of the subject matter
- Designing learning paths that are both challenging and achievable

Always create structures that are:
- Progressive (each module builds on previous ones)
- Comprehensive (covers all essential aspects)
- Balanced (appropriate number of topics per module)
- Clear (module and topic names are descriptive and specific)"""

    prompt = f"""
    As a Course Structure Designer, analyze and break down the following course into a comprehensive structure:
    
    Course Name: {course_name}
    Course Description: {course_description}
    {f'Additional Context from Uploaded Outline:\n{outline_content}' if outline_content else ''}
    
    Create a detailed course structure with:
    1. 4-6 well-organized modules (each module should represent a major learning unit)
    2. Each module should contain 3-5 specific topics
    3. Topics should be progressive - each building upon previous knowledge
    4. Module names should be clear and descriptive
    5. Topic names should be specific and actionable
    
    Return ONLY valid JSON in this exact format (no markdown, no explanations):
    {{
        "modules": [
            {{
                "name": "Module Name",
                "topics": [
                    {{"name": "Topic Name"}},
                    {{"name": "Topic Name"}}
                ]
            }}
        ]
    }}
    """
    
    return generate_with_ai(prompt, system_prompt, max_tokens=3000, agent_name='course_structure')

def lecture_notes_writer_agent(topic_name, course_name, module_name):
    """
    AI Agent 2: Lecture Notes Writer
    Role: Expert educator who creates comprehensive, detailed lecture notes
    """
    system_prompt = """You are a master educator and content writer specializing in creating comprehensive lecture notes.
Your expertise includes:
- Breaking down complex concepts into clear, understandable explanations
- Using examples and analogies to enhance understanding
- Structuring information logically and progressively
- Creating engaging, detailed educational content
- Ensuring all key concepts are thoroughly explained

Your lecture notes should be:
- Comprehensive and detailed
- Well-structured with clear sections
- Include real-world examples
- Use clear, accessible language
- Cover all essential aspects of the topic"""

    prompt = f"""
    As a Lecture Notes Writer, create comprehensive, detailed lecture notes for:
    
    Course: {course_name}
    Module: {module_name}
    Topic: {topic_name}
    
    Create detailed lecture notes that include:
    1. Introduction to the topic
    2. Key concepts and definitions (with clear explanations)
    3. Detailed explanations of each concept
    4. Real-world examples and use cases
    5. Important points and takeaways
    6. Summary and key points review
    
    Format the content in clear markdown style with proper headings, lists, and formatting.
    Make it comprehensive enough for a student to learn the topic thoroughly from these notes alone.
    """
    
    return generate_with_ai(prompt, system_prompt, max_tokens=2500, agent_name='lecture_notes')

def tutorial_exercise_designer_agent(topic_name, course_name, module_name):
    """
    AI Agent 3: Tutorial Exercise Designer
    Role: Expert in creating step-by-step tutorial exercises and practice problems
    """
    system_prompt = """You are an expert tutorial designer specializing in creating effective learning exercises.
Your strengths include:
- Designing progressive exercises that build skills gradually
- Creating clear, step-by-step instructions
- Developing practice problems that reinforce key concepts
- Providing solutions that explain the reasoning
- Ensuring exercises are practical and applicable

Your tutorials should be:
- Step-by-step and easy to follow
- Progressive in difficulty
- Include multiple practice problems
- Provide clear solutions with explanations
- Practical and hands-on"""

    prompt = f"""
    As a Tutorial Exercise Designer, create comprehensive tutorial exercises for:
    
    Course: {course_name}
    Module: {module_name}
    Topic: {topic_name}
    
    Design tutorial exercises that include:
    1. Learning objectives for the tutorial
    2. Step-by-step exercises (start with basics, progress to advanced)
    3. Multiple practice problems with varying difficulty
    4. Clear instructions for each exercise
    5. Solutions with detailed explanations
    6. Additional practice suggestions
    
    Format in markdown style. Make exercises practical and ensure they reinforce the key concepts from the lecture notes.
    """
    
    return generate_with_ai(prompt, system_prompt, max_tokens=2000, agent_name='tutorial')

def practical_exercise_designer_agent(topic_name, course_name, module_name):
    """
    AI Agent 4: Practical Exercise Designer
    Role: Expert in creating hands-on, real-world practical exercises
    """
    system_prompt = """You are an expert in designing hands-on, practical exercises that bridge theory and practice.
Your expertise includes:
- Creating real-world scenarios and projects
- Designing hands-on tasks that apply theoretical knowledge
- Developing practical exercises that build real skills
- Ensuring exercises are relevant and applicable
- Providing clear implementation guidance

Your practical exercises should be:
- Real-world and applicable
- Hands-on and interactive
- Include clear implementation steps
- Have measurable outcomes
- Build practical skills"""

    prompt = f"""
    As a Practical Exercise Designer, create hands-on practical exercises for:
    
    Course: {course_name}
    Module: {module_name}
    Topic: {topic_name}
    
    Design practical exercises that include:
    1. Real-world scenario or project description
    2. Clear objectives and expected outcomes
    3. Step-by-step implementation guide
    4. Hands-on tasks and activities
    5. Evaluation criteria or checkpoints
    6. Tips and best practices
    
    Format in markdown style. Focus on practical application and real-world skills that students can use.
    Make it engaging and ensure students can complete the exercises independently.
    """
    
    return generate_with_ai(prompt, system_prompt, max_tokens=2000, agent_name='practical')

def quiz_creator_agent(topic_name, course_name, module_name):
    """
    AI Agent 5: Quiz Creator
    Role: Expert in creating comprehensive assessment quizzes
    """
    system_prompt = """You are an expert assessment designer specializing in creating effective educational quizzes.
Your expertise includes:
- Writing clear, unambiguous questions
- Creating plausible distractors (wrong answers)
- Ensuring questions test understanding, not just memorization
- Designing questions that cover all key concepts
- Creating balanced difficulty levels

Your quizzes should have:
- Clear, well-written questions
- 4 plausible options per question
- Questions that test understanding
- Coverage of all important concepts
- Appropriate difficulty level"""

    prompt = f"""
    As a Quiz Creator, create a comprehensive exam quiz for:
    
    Course: {course_name}
    Module: {module_name}
    Topic: {topic_name}
    
    Create 8-10 multiple choice questions that:
    1. Test understanding of key concepts from the topic
    2. Cover all important aspects of the topic
    3. Have 4 options each (one correct, three plausible distractors)
    4. Are clear and unambiguous
    5. Test both knowledge and understanding
    
    Return ONLY valid JSON in this exact format (no markdown, no explanations):
    {{
        "questions": [
            {{
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0
            }}
        ]
    }}
    
    Note: correctAnswer is the index (0-3) of the correct option.
    """
    
    return generate_with_ai(prompt, system_prompt, max_tokens=2000, agent_name='quiz')

def generate_mock_response(prompt):
    """Generate mock response when AI is not available"""
    # Detect which agent type based on prompt content
    prompt_lower = prompt.lower()
    
    if "course structure" in prompt_lower or "breakdown" in prompt_lower or "course structure designer" in prompt_lower:
        return json.dumps({
            "modules": [
                {
                    "name": "Introduction",
                    "topics": [
                        {"name": "Overview and Basics"},
                        {"name": "Getting Started"}
                    ]
                },
                {
                    "name": "Core Concepts",
                    "topics": [
                        {"name": "Fundamental Principles"},
                        {"name": "Advanced Techniques"}
                    ]
                }
            ]
        })
    elif "lecture notes writer" in prompt_lower or ("lecture" in prompt_lower and "notes" in prompt_lower):
        return "# Lecture Notes\n\n## Introduction\n\nThis topic covers the fundamental concepts...\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3"
    elif "tutorial exercise designer" in prompt_lower or ("tutorial" in prompt_lower and "exercise" in prompt_lower):
        return "# Tutorial Exercise\n\n## Exercise 1\n\nComplete the following tasks:\n\n1. Task 1\n2. Task 2\n3. Task 3"
    elif "practical exercise designer" in prompt_lower or ("practical" in prompt_lower and "exercise" in prompt_lower):
        return "# Practical Exercise\n\n## Hands-on Practice\n\nFollow these steps:\n\n1. Step 1\n2. Step 2\n3. Step 3"
    elif "quiz creator" in prompt_lower or "quiz" in prompt_lower:
        return json.dumps({
            "questions": [
                {
                    "question": "What is the main concept?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": 0
                },
                {
                    "question": "Which is correct?",
                    "options": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
                    "correctAnswer": 1
                }
            ]
        })
    return "Generated content based on your request."

@app.route('/api/courses', methods=['POST'])
def create_course():
    """Create a new course"""
    try:
        course_name = request.form.get('name')
        course_description = request.form.get('description', '')
        outline_file = request.files.get('outline')
        
        if not course_name:
            return jsonify({'error': 'Course name is required'}), 400
        
        course_id = str(uuid.uuid4())
        course_data = {
            'id': course_id,
            'name': course_name,
            'description': course_description,
            'created_at': datetime.now().isoformat(),
            'modules': []
        }
        
        # Handle file upload if provided
        outline_content = None
        if outline_file and outline_file.filename and allowed_file(outline_file.filename):
            filename = secure_filename(outline_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{course_id}_{filename}")
            outline_file.save(filepath)
            outline_content = read_uploaded_file(filepath)
        
        # Save to MongoDB
        save_to_db('courses', course_id, course_data)
        
        # If outline provided, parse it; otherwise AI will generate structure
        if outline_content:
            # Parse outline and create structure
            # For now, we'll let the generate-structure endpoint handle it
            pass
        
        return jsonify(course_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<course_id>/generate-structure', methods=['POST'])
@login_required
def generate_course_structure(course_id):
    """Generate course structure using Course Structure Designer Agent"""
    try:
        course = get_from_db('courses', course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Use Course Structure Designer Agent
        response = course_structure_designer_agent(
            course['name'], 
            course['description']
        )
        
        # Parse response
        try:
            # Try to extract JSON from response
            if response.startswith('```json'):
                response = response.replace('```json', '').replace('```', '').strip()
            elif response.startswith('```'):
                response = response.replace('```', '').strip()
            
            structure = json.loads(response)
            
            # Update course with structure
            course['modules'] = structure.get('modules', [])
            save_to_db('courses', course_id, course)
            
            return jsonify(course), 200
        except json.JSONDecodeError:
            # If response is not JSON, create a default structure
            default_structure = {
                "modules": [
                    {
                        "name": "Introduction",
                        "topics": [
                            {"name": "Getting Started"},
                            {"name": "Overview"}
                        ]
                    },
                    {
                        "name": "Core Concepts",
                        "topics": [
                            {"name": "Fundamentals"},
                            {"name": "Advanced Topics"}
                        ]
                    }
                ]
            }
            course['modules'] = default_structure['modules']
            save_to_db('courses', course_id, course)
            return jsonify(course), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<course_id>', methods=['GET'])
@login_required
def get_course(course_id):
    """Get course details"""
    course = get_from_db('courses', course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    return jsonify(course), 200

@app.route('/api/courses', methods=['GET'])
@login_required
def get_all_courses():
    """Get all courses"""
    courses = get_all_from_db('courses')
    return jsonify(courses), 200

@app.route('/api/topics/<topic_id>/generate-content', methods=['POST'])
@login_required
def generate_topic_content(topic_id):
    """Generate full content for a topic using specialized AI agents"""
    try:
        data = request.json
        topic_name = data.get('topic', '')
        course_name = data.get('course', '')
        module_name = data.get('module', '')
        
        print(f"Generating content for topic: {topic_name}")
        print("Using specialized AI agents for each content type...")
        
        # Agent 1: Lecture Notes Writer
        print("Agent 1: Lecture Notes Writer - Generating lecture notes...")
        lecture = lecture_notes_writer_agent(topic_name, course_name, module_name)
        
        # Agent 2: Tutorial Exercise Designer
        print("Agent 2: Tutorial Exercise Designer - Generating tutorial exercises...")
        tutorial = tutorial_exercise_designer_agent(topic_name, course_name, module_name)
        
        # Agent 3: Practical Exercise Designer
        print("Agent 3: Practical Exercise Designer - Generating practical exercises...")
        practical = practical_exercise_designer_agent(topic_name, course_name, module_name)
        
        # Agent 4: Quiz Creator
        print("Agent 4: Quiz Creator - Generating exam quiz...")
        quiz_response = quiz_creator_agent(topic_name, course_name, module_name)
        
        # Parse quiz
        try:
            if quiz_response.startswith('```json'):
                quiz_response = quiz_response.replace('```json', '').replace('```', '').strip()
            elif quiz_response.startswith('```'):
                quiz_response = quiz_response.replace('```', '').strip()
            quiz = json.loads(quiz_response)
        except json.JSONDecodeError as e:
            print(f"Quiz parsing error: {e}")
            # Default quiz if parsing fails
            quiz = {
                "questions": [
                    {
                        "question": f"What is the main concept of {topic_name}?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": 0
                    }
                ]
            }
        
        content = {
            'lecture': lecture,
            'tutorial': tutorial,
            'practical': practical,
            'quiz': quiz
        }
        
        # Store content
        save_to_db('topics', topic_id, content)
        
        print("All agents completed successfully!")
        return jsonify(content), 200
        
    except Exception as e:
        print(f"Error in generate_topic_content: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/topics/<topic_id>', methods=['GET'])
@login_required
def get_topic_content(topic_id):
    """Get topic content"""
    content = get_from_db('topics', topic_id)
    if not content:
        return jsonify({'error': 'Topic content not found'}), 404
    
    return jsonify(content), 200

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    response = jsonify({
        'status': 'healthy',
        'cors_origins': allowed_origins,
        'frontend_url': frontend_url
    })
    return response, 200

# Authentication Endpoints (no login required)
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    """User login endpoint"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    try:
        data = request.json
        userid = data.get('userid', '').strip()
        password = data.get('password', '')
        
        if userid == VALID_USERID and password == VALID_PASSWORD:
            session['logged_in'] = True
            session['userid'] = userid
            response = jsonify({
                'success': True,
                'message': 'Login successful',
                'userid': userid
            })
            # Add CORS headers to response
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 200
        else:
            response = jsonify({
                'success': False,
                'error': 'Invalid user ID or password'
            })
            # Add CORS headers even for error responses
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 401
    except Exception as e:
        response = jsonify({
            'success': False,
            'error': str(e)
        })
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
@login_required
def logout():
    """User logout endpoint"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    session.clear()
    response = jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers.add("Access-Control-Allow-Origin", origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200

@app.route('/api/check-auth', methods=['GET', 'OPTIONS'])
def check_auth():
    """Check if user is authenticated"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    response = jsonify({
        'authenticated': session.get('logged_in', False),
        'userid': session.get('userid') if session.get('logged_in') else None
    })
    # Add CORS headers
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers.add("Access-Control-Allow-Origin", origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200

# API Key Management Endpoints
@app.route('/api/set-api-keys', methods=['POST'])
@login_required
def set_api_keys():
    """Set API keys and provider for the current session"""
    try:
        data = request.json
        provider = data.get('provider', 'openai').lower()
        openai_key = data.get('openai_api_key', '').strip()
        gemini_key = data.get('gemini_api_key', '').strip()
        
        if provider not in ['openai', 'gemini']:
            return jsonify({'error': 'Invalid provider. Must be "openai" or "gemini"'}), 400
        
        # Validate keys based on provider
        if provider == 'openai':
            if not openai_key:
                return jsonify({'error': 'OpenAI API key is required'}), 400
            if not openai_key.startswith('sk-'):
                return jsonify({'error': 'Invalid OpenAI API key format'}), 400
        else:  # gemini
            if not gemini_key:
                return jsonify({'error': 'Gemini API key is required'}), 400
        
        # Store in session
        session['api_provider'] = provider
        if openai_key:
            session['openai_api_key'] = openai_key
        if gemini_key:
            session['gemini_api_key'] = gemini_key
        
        return jsonify({
            'message': 'API keys set successfully',
            'provider': provider
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-api-key', methods=['POST'])
@login_required
def test_api_key():
    """Test if an API key is valid"""
    try:
        data = request.json
        provider = data.get('provider', 'openai').lower()
        api_key = data.get('api_key', '').strip()
        
        if not api_key:
            return jsonify({'valid': False, 'error': 'API key is required'}), 400
        
        if provider == 'openai':
            if not api_key.startswith('sk-'):
                return jsonify({'valid': False, 'error': 'Invalid OpenAI API key format'}), 400
            
            # Test OpenAI API key
            try:
                test_client = OpenAI(api_key=api_key)
                response = test_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=5
                )
                return jsonify({
                    'valid': True,
                    'message': 'OpenAI API key is valid'
                }), 200
            except Exception as e:
                error_msg = str(e)
                if 'Invalid API key' in error_msg or 'Incorrect API key' in error_msg:
                    return jsonify({
                        'valid': False,
                        'error': 'Invalid OpenAI API key'
                    }), 200
                else:
                    return jsonify({
                        'valid': False,
                        'error': f'API test failed: {error_msg}'
                    }), 200
        else:  # gemini
            # Test Gemini API key
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-pro')
                response = model.generate_content("test")
                return jsonify({
                    'valid': True,
                    'message': 'Gemini API key is valid'
                }), 200
            except Exception as e:
                error_msg = str(e)
                if 'API_KEY_INVALID' in error_msg or 'Invalid API key' in error_msg:
                    return jsonify({
                        'valid': False,
                        'error': 'Invalid Gemini API key'
                    }), 200
                else:
                    return jsonify({
                        'valid': False,
                        'error': f'API test failed: {error_msg}'
                    }), 200
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/clear-api-keys', methods=['POST'])
@login_required
def clear_api_keys():
    """Clear API keys from session"""
    try:
        session.pop('api_provider', None)
        session.pop('openai_api_key', None)
        session.pop('gemini_api_key', None)
        return jsonify({'message': 'API keys cleared'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/api-key-status', methods=['GET'])
@login_required
def api_key_status():
    """Check if API keys are configured"""
    provider = session.get('api_provider', 'openai')
    openai_key = session.get('openai_api_key') or os.getenv('OPENAI_API_KEY')
    gemini_key = session.get('gemini_api_key') or os.getenv('GEMINI_API_KEY')
    
    return jsonify({
        'provider': provider,
        'openai_configured': bool(openai_key),
        'gemini_configured': bool(gemini_key),
        'configured': bool(openai_key if provider == 'openai' else gemini_key)
    }), 200

# Agent-specific API Key Management Endpoints
@app.route('/api/set-agent-api-keys', methods=['POST'])
@login_required
def set_agent_api_keys():
    """Set API keys for individual agents"""
    try:
        data = request.json
        agents = data.get('agents', {})
        
        for agent_name, config in agents.items():
            provider = config.get('provider', 'openai').lower()
            api_key = config.get('apiKey', '').strip()
            
            if provider not in ['openai', 'gemini']:
                return jsonify({'error': f'Invalid provider for agent {agent_name}'}), 400
            
            if not api_key:
                continue  # Skip if no API key provided
            
            # Validate OpenAI key format
            if provider == 'openai' and not api_key.startswith('sk-'):
                return jsonify({'error': f'Invalid OpenAI API key format for agent {agent_name}'}), 400
            
            # Store agent configuration
            agent_config = {
                'provider': provider,
                'openai_key': api_key if provider == 'openai' else None,
                'gemini_key': api_key if provider == 'gemini' else None
            }
            agent_api_keys[agent_name] = agent_config
            # Save to MongoDB
            save_to_db('agent_keys', agent_name, {
                'agent_name': agent_name,
                **agent_config
            })
        
        return jsonify({
            'message': 'Agent API keys saved successfully',
            'agents': list(agent_api_keys.keys())
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear-agent-api-keys', methods=['POST'])
@login_required
def clear_agent_api_keys():
    """Clear all agent API keys"""
    try:
        global agent_api_keys
        # Get all agent keys and delete them
        all_keys = get_all_from_db('agent_keys')
        for key_doc in all_keys:
            agent_name = key_doc.get('agent_name')
            if agent_name:
                delete_from_db('agent_keys', agent_name)
        agent_api_keys = {}
        return jsonify({'message': 'All agent API keys cleared'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Progress Management Endpoints
@app.route('/api/progress', methods=['GET'])
@login_required
def get_progress():
    """Get all progress data"""
    progress_data = get_all_from_db('progress')
    # Convert list to dict format using topic_id as key
    progress_dict = {}
    for item in progress_data:
        topic_id = item.get('topic_id') or item.get('_id')
        if topic_id:
            progress_dict[topic_id] = item
    return jsonify(progress_dict), 200

@app.route('/api/progress', methods=['POST'])
@login_required
def update_progress():
    """Update progress for a topic"""
    try:
        data = request.json
        topic_id = data.get('topic_id')
        status = data.get('status', 'not-started')
        progress_percent = data.get('progress', 0)
        
        if not topic_id:
            return jsonify({'error': 'topic_id is required'}), 400
        
        progress_data = {
            'topic_id': topic_id,
            'status': status,
            'progress': progress_percent,
            'updated_at': datetime.now().isoformat()
        }
        save_to_db('progress', topic_id, progress_data)
        
        return jsonify(progress_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

@app.route('/')
def index():
    """Serve login page as default"""
    return send_from_directory(FRONTEND_DIR, 'login.html')

@app.route('/login.html')
def login_page():
    """Serve login page"""
    return send_from_directory(FRONTEND_DIR, 'login.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from frontend directory"""
    return send_from_directory(FRONTEND_DIR, filename)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)

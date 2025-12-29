// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let currentView = 'dashboard';
let currentCourse = null;
let currentTopic = null;
let courses = [];
let progress = {};
let apiKey = localStorage.getItem('openai_api_key') || '';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load courses from localStorage first
    const saved = localStorage.getItem('courses');
    if (saved) {
        try {
            courses = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading courses from localStorage:', e);
            courses = [];
        }
    }
    
    loadCourses();
    setupEventListeners();
    loadProgress();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });

    // Course Creation
    document.getElementById('create-course-btn').addEventListener('click', () => {
        switchView('create-course');
    });

    document.getElementById('cancel-course-btn').addEventListener('click', () => {
        switchView('dashboard');
        document.getElementById('course-form').reset();
        resetFileUpload();
    });

    document.getElementById('course-form').addEventListener('submit', handleCourseSubmit);

    // File Upload
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('course-outline');

    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary-color)';
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'var(--border-color)';
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--border-color)';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    document.querySelector('.btn-remove-file')?.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileUpload();
    });

    // Back Buttons
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        switchView('dashboard');
    });

    document.getElementById('back-to-course').addEventListener('click', () => {
        if (currentCourse) {
            showCourseDetail(currentCourse);
        }
    });

    // Topic Actions
    document.getElementById('generate-content-btn').addEventListener('click', generateTopicContent);
    document.getElementById('mark-complete-btn').addEventListener('click', markTopicComplete);

    // Topic Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Quiz Modal
    const quizModal = document.getElementById('quiz-modal');
    document.querySelector('.close-modal').addEventListener('click', () => {
        quizModal.classList.remove('show');
    });

    document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz);

    window.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            quizModal.classList.remove('show');
        }
    });

    // Settings Page Event Listeners
    document.getElementById('save-api-key-btn')?.addEventListener('click', saveApiKey);
    document.getElementById('test-api-key-btn')?.addEventListener('click', testApiKey);
    document.getElementById('clear-api-key-btn')?.addEventListener('click', clearApiKey);
    document.getElementById('toggle-api-key-visibility')?.addEventListener('click', toggleApiKeyVisibility);
    
    // Load API key when settings view is shown
    document.querySelector('[data-view="settings"]')?.addEventListener('click', () => {
        setTimeout(loadApiKeySettings, 100);
    });
}

// View Management
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
}

// File Upload Handling
function handleFileSelect(file) {
    const fileUploadArea = document.getElementById('file-upload-area');
    const uploadContent = fileUploadArea.querySelector('.file-upload-content');
    const fileSelected = fileUploadArea.querySelector('.file-selected');
    const fileName = fileSelected.querySelector('.file-name');

    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    fileName.textContent = file.name;
    uploadContent.style.display = 'none';
    fileSelected.style.display = 'flex';
}

function resetFileUpload() {
    const fileInput = document.getElementById('course-outline');
    const fileUploadArea = document.getElementById('file-upload-area');
    const uploadContent = fileUploadArea.querySelector('.file-upload-content');
    const fileSelected = fileUploadArea.querySelector('.file-selected');

    fileInput.value = '';
    uploadContent.style.display = 'flex';
    fileSelected.style.display = 'none';
}

// Course Management
async function handleCourseSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseData = {
        name: formData.get('courseName'),
        description: formData.get('courseDescription') || ''
    };

    const file = formData.get('courseOutline');
    if (file && file.size > 0) {
        courseData.outlineFile = file;
    }

    try {
        showLoading('course-loading');
        const course = await createCourse(courseData);
        courses.push(course);
        saveCourses();
        switchView('dashboard');
        loadCourses();
        showCourseDetail(course);
    } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
    } finally {
        hideLoading('course-loading');
    }
}

async function createCourse(courseData) {
    try {
        const formData = new FormData();
        formData.append('name', courseData.name);
        formData.append('description', courseData.description);
        
        if (courseData.outlineFile) {
            formData.append('outline', courseData.outlineFile);
        }

        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // If backend is not available, create course locally
            if (response.status === 0 || response.status >= 500) {
                return createCourseLocally(courseData);
            }
            throw new Error('Failed to create course');
        }

        const course = await response.json();
        
        // If no outline provided, AI will generate structure
        if (!courseData.outlineFile) {
            try {
                await generateCourseStructure(course.id);
            } catch (error) {
                console.warn('Could not generate structure via API, using default structure');
                // Add default structure
                course.modules = [
                    {
                        name: "Introduction",
                        topics: [
                            { name: "Getting Started" },
                            { name: "Overview" }
                        ]
                    }
                ];
            }
        }

        return course;
    } catch (error) {
        // If fetch fails (backend not running), create locally
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return createCourseLocally(courseData);
        }
        throw error;
    }
}

function createCourseLocally(courseData) {
    // Create course with local ID
    const course = {
        id: `local-${Date.now()}`,
        name: courseData.name,
        description: courseData.description,
        created_at: new Date().toISOString(),
        modules: [
            {
                name: "Introduction",
                topics: [
                    { name: "Getting Started" },
                    { name: "Overview" }
                ]
            },
            {
                name: "Core Concepts",
                topics: [
                    { name: "Fundamentals" },
                    { name: "Advanced Topics" }
                ]
            }
        ]
    };
    return course;
}

async function generateCourseStructure(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/generate-structure`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to generate course structure');
        }

        return await response.json();
    } catch (error) {
        console.error('Error generating course structure:', error);
        throw error;
    }
}

function loadCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    coursesGrid.innerHTML = '';

    if (courses.length === 0) {
        coursesGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">No courses yet. Create your first course to get started!</p>';
        return;
    }

    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.addEventListener('click', () => showCourseDetail(course));

    const progressData = progress[course.id] || { completed: 0, total: 0 };
    const progressPercent = progressData.total > 0 
        ? Math.round((progressData.completed / progressData.total) * 100) 
        : 0;

    card.innerHTML = `
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.description || 'No description')}</p>
        <div class="course-progress">
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">${progressPercent}% Complete</div>
        </div>
    `;

    return card;
}

async function showCourseDetail(course) {
    currentCourse = course;
    switchView('course-detail');

    document.getElementById('course-detail-title').textContent = course.name;
    document.getElementById('course-detail-description').textContent = course.description || '';

    const modulesContainer = document.getElementById('modules-container');
    modulesContainer.innerHTML = '';

    // Check if course has structure
    if (!course.modules || course.modules.length === 0) {
        showLoading('course-loading');
        try {
            const updatedCourse = await fetchCourseDetail(course.id);
            course.modules = updatedCourse.modules || [];
            saveCourses();
        } catch (error) {
            console.error('Error loading course detail:', error);
        } finally {
            hideLoading('course-loading');
        }
    }

    if (course.modules && course.modules.length > 0) {
        course.modules.forEach((module, moduleIndex) => {
            const moduleCard = createModuleCard(module, moduleIndex);
            modulesContainer.appendChild(moduleCard);
        });
    } else {
        modulesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No modules yet. Generating structure...</p>';
    }
}

function createModuleCard(module, moduleIndex) {
    const card = document.createElement('div');
    card.className = 'module-card';

    const moduleHeader = document.createElement('div');
    moduleHeader.className = 'module-header';
    moduleHeader.innerHTML = `
        <h3>Module ${moduleIndex + 1}: ${escapeHtml(module.name)}</h3>
        <span class="module-toggle">▼</span>
    `;

    const topicsList = document.createElement('div');
    topicsList.className = 'topics-list';

    if (module.topics && module.topics.length > 0) {
        module.topics.forEach((topic, topicIndex) => {
            const topicItem = createTopicItem(topic, moduleIndex, topicIndex);
            topicsList.appendChild(topicItem);
        });
    }

    moduleHeader.addEventListener('click', () => {
        topicsList.classList.toggle('show');
        const toggle = moduleHeader.querySelector('.module-toggle');
        toggle.classList.toggle('expanded');
    });

    card.appendChild(moduleHeader);
    card.appendChild(topicsList);

    return card;
}

function createTopicItem(topic, moduleIndex, topicIndex) {
    const item = document.createElement('div');
    item.className = 'topic-item';
    
    const topicId = `${currentCourse.id}-${moduleIndex}-${topicIndex}`;
    const topicProgress = progress[topicId] || { status: 'not-started', progress: 0 };
    
    if (topicProgress.status === 'completed') {
        item.classList.add('completed');
    }

    item.innerHTML = `
        <span class="topic-name">${escapeHtml(topic.name)}</span>
        <div class="topic-status">
            <span class="status-badge ${topicProgress.status}">${topicProgress.status.replace('-', ' ')}</span>
        </div>
    `;

    item.addEventListener('click', () => {
        showTopicDetail(topic, moduleIndex, topicIndex);
    });

    return item;
}

async function fetchCourseDetail(courseId) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch course detail');
    }
    return await response.json();
}

// Topic Management
function showTopicDetail(topic, moduleIndex, topicIndex) {
    currentTopic = { ...topic, moduleIndex, topicIndex, courseId: currentCourse.id };
    switchView('topic-detail');

    const topicId = `${currentCourse.id}-${moduleIndex}-${topicIndex}`;
    const topicProgress = progress[topicId] || { status: 'not-started', progress: 0 };

    document.getElementById('topic-detail-title').textContent = topic.name;
    updateTopicProgress(topicProgress.progress);

    // Load existing content if available
    if (topic.content) {
        loadTopicContent(topic.content);
    } else {
        clearTopicContent();
    }
}

function updateTopicProgress(percent) {
    const progressFill = document.getElementById('topic-progress-fill');
    const progressText = document.getElementById('topic-progress-text');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Complete`;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-content`);
    });
}

async function generateTopicContent() {
    if (!currentTopic) return;

    showLoading('topic-loading');
    
    try {
        const topicId = `${currentTopic.courseId}-${currentTopic.moduleIndex}-${currentTopic.topicIndex}`;
        const response = await fetch(`${API_BASE_URL}/topics/${topicId}/generate-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: currentTopic.name,
                course: currentCourse.name,
                module: currentCourse.modules[currentTopic.moduleIndex].name
            })
        });

        let content;
        if (!response.ok) {
            // If backend is not available, use mock content
            if (response.status === 0 || response.status >= 500) {
                content = generateMockContent();
            } else {
                throw new Error('Failed to generate content');
            }
        } else {
            content = await response.json();
        }
        
        // Update current topic
        if (!currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content) {
            currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content = {};
        }
        currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content = content;
        saveCourses();

        loadTopicContent(content);
    } catch (error) {
        // If fetch fails, use mock content
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            const mockContent = generateMockContent();
            if (!currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content) {
                currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content = {};
            }
            currentCourse.modules[currentTopic.moduleIndex].topics[currentTopic.topicIndex].content = mockContent;
            saveCourses();
            loadTopicContent(mockContent);
        } else {
            console.error('Error generating content:', error);
            alert('Failed to generate content. Please make sure the backend server is running.');
        }
    } finally {
        hideLoading('topic-loading');
    }
}

function generateMockContent() {
    return {
        lecture: `# Lecture Notes: ${currentTopic.name}\n\n## Introduction\n\nThis topic covers the fundamental concepts of ${currentTopic.name}.\n\n## Key Concepts\n\n- Concept 1: Explanation\n- Concept 2: Explanation\n- Concept 3: Explanation\n\n## Summary\n\nThis topic provides a comprehensive overview of ${currentTopic.name}.`,
        tutorial: `# Tutorial Exercise: ${currentTopic.name}\n\n## Exercise 1\n\nComplete the following tasks:\n\n1. Task 1: Description\n2. Task 2: Description\n3. Task 3: Description\n\n## Solutions\n\nSolutions will be provided after attempting the exercises.`,
        practical: `# Practical Exercise: ${currentTopic.name}\n\n## Hands-on Practice\n\nFollow these steps:\n\n1. Step 1: Instructions\n2. Step 2: Instructions\n3. Step 3: Instructions\n\n## Expected Outcome\n\nAfter completing this practical, you should be able to...`,
        quiz: {
            questions: [
                {
                    question: `What is the main concept of ${currentTopic.name}?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correctAnswer: 0
                },
                {
                    question: `Which statement is correct about ${currentTopic.name}?`,
                    options: ["Statement 1", "Statement 2", "Statement 3", "Statement 4"],
                    correctAnswer: 1
                }
            ]
        }
    };
}

function loadTopicContent(content) {
    // Load Lecture Notes
    if (content.lecture) {
        document.getElementById('lecture-content').innerHTML = formatContent(content.lecture);
    }

    // Load Tutorial
    if (content.tutorial) {
        document.getElementById('tutorial-content').innerHTML = formatContent(content.tutorial);
    }

    // Load Practical
    if (content.practical) {
        document.getElementById('practical-content').innerHTML = formatContent(content.practical);
    }

    // Load Quiz
    if (content.quiz) {
        document.getElementById('quiz-content').innerHTML = formatQuiz(content.quiz);
    }
}

function formatContent(content) {
    if (typeof content === 'string') {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map(line => {
                if (line.startsWith('# ')) {
                    return `<h3>${escapeHtml(line.substring(2))}</h3>`;
                } else if (line.startsWith('## ')) {
                    return `<h4>${escapeHtml(line.substring(3))}</h4>`;
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    return `<li>${escapeHtml(line.substring(2))}</li>`;
                } else if (line.trim() === '') {
                    return '<br>';
                } else {
                    return `<p>${escapeHtml(line)}</p>`;
                }
            })
            .join('');
    }
    return `<div class="content-section">${escapeHtml(JSON.stringify(content, null, 2))}</div>`;
}

function formatQuiz(quiz) {
    if (!quiz.questions || quiz.questions.length === 0) {
        return '<div class="content-placeholder">No quiz questions available</div>';
    }

    let html = '<div class="quiz-preview">';
    quiz.questions.forEach((q, index) => {
        html += `
            <div class="quiz-question-preview">
                <h4>Question ${index + 1}: ${escapeHtml(q.question)}</h4>
                <p>Options: ${q.options.length}</p>
            </div>
        `;
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="start-quiz-btn">Start Quiz</button>';

    // Add event listener for start quiz button
    setTimeout(() => {
        document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
            showQuizModal(quiz);
        });
    }, 100);

    return html;
}

function showQuizModal(quiz) {
    const modal = document.getElementById('quiz-modal');
    const quizTitle = document.getElementById('quiz-title');
    const quizQuestions = document.getElementById('quiz-questions');
    const quizResults = document.getElementById('quiz-results');

    quizTitle.textContent = currentTopic.name;
    quizResults.style.display = 'none';
    quizQuestions.innerHTML = '';

    quiz.questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.dataset.questionIndex = index;
        questionDiv.dataset.correctAnswer = q.correctAnswer;

        let optionsHtml = `<h4>${index + 1}. ${escapeHtml(q.question)}</h4>`;
        q.options.forEach((option, optIndex) => {
            optionsHtml += `
                <div class="quiz-option">
                    <input type="radio" name="question-${index}" value="${optIndex}" id="q${index}-opt${optIndex}">
                    <label for="q${index}-opt${optIndex}">${escapeHtml(option)}</label>
                </div>
            `;
        });

        questionDiv.innerHTML = optionsHtml;
        quizQuestions.appendChild(questionDiv);
    });

    modal.classList.add('show');
}

function submitQuiz() {
    const questions = document.querySelectorAll('.quiz-question');
    let correct = 0;
    let total = questions.length;

    questions.forEach(question => {
        const selectedOption = question.querySelector('input[type="radio"]:checked');
        const correctAnswer = parseInt(question.dataset.correctAnswer);

        if (selectedOption && parseInt(selectedOption.value) === correctAnswer) {
            correct++;
            question.style.border = '2px solid var(--success-color)';
        } else {
            question.style.border = '2px solid var(--danger-color)';
        }
    });

    const score = Math.round((correct / total) * 100);
    const quizResults = document.getElementById('quiz-results');
    quizResults.innerHTML = `
        <div class="quiz-score ${score >= 70 ? 'pass' : 'fail'}">
            Score: ${score}% (${correct}/${total})
        </div>
        <p>${score >= 70 ? 'Congratulations! You passed!' : 'Keep studying and try again!'}</p>
    `;
    quizResults.style.display = 'block';

    // Update progress
    if (score >= 70) {
        updateTopicProgress(100);
    }
}

function clearTopicContent() {
    document.getElementById('lecture-content').innerHTML = '<div class="content-placeholder">Click "Generate Content" to create lecture notes</div>';
    document.getElementById('tutorial-content').innerHTML = '<div class="content-placeholder">Click "Generate Content" to create tutorial exercises</div>';
    document.getElementById('practical-content').innerHTML = '<div class="content-placeholder">Click "Generate Content" to create practical exercises</div>';
    document.getElementById('quiz-content').innerHTML = '<div class="content-placeholder">Click "Generate Content" to create exam quiz</div>';
}

async function markTopicComplete() {
    if (!currentTopic) return;

    const topicId = `${currentTopic.courseId}-${currentTopic.moduleIndex}-${currentTopic.topicIndex}`;
    
    if (!progress[topicId]) {
        progress[topicId] = { status: 'not-started', progress: 0 };
    }

    progress[topicId].status = 'completed';
    progress[topicId].progress = 100;
    
    updateProgress();
    saveProgress();
    loadCourses();

    alert('Topic marked as complete!');
}

// Progress Management
function loadProgress() {
    const saved = localStorage.getItem('learningProgress');
    if (saved) {
        progress = JSON.parse(saved);
    }
    updateProgress();
}

function saveProgress() {
    localStorage.setItem('learningProgress', JSON.stringify(progress));
}

function updateProgress() {
    // Calculate overall progress
    let totalTopics = 0;
    let completedTopics = 0;

    courses.forEach(course => {
        if (course.modules) {
            course.modules.forEach((module, moduleIndex) => {
                if (module.topics) {
                    module.topics.forEach((topic, topicIndex) => {
                        totalTopics++;
                        const topicId = `${course.id}-${moduleIndex}-${topicIndex}`;
                        if (progress[topicId] && progress[topicId].status === 'completed') {
                            completedTopics++;
                        }
                    });
                }
            });
        }
    });

    document.getElementById('total-courses').textContent = courses.length;
    document.getElementById('completed-topics').textContent = completedTopics;
    document.getElementById('total-progress').textContent = totalTopics > 0 
        ? `${Math.round((completedTopics / totalTopics) * 100)}%` 
        : '0%';

    // Update progress details
    updateProgressDetails();
}

function updateProgressDetails() {
    const progressDetails = document.getElementById('progress-details');
    progressDetails.innerHTML = '';

    courses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'progress-course-item';

        let courseCompleted = 0;
        let courseTotal = 0;

        if (course.modules) {
            course.modules.forEach((module, moduleIndex) => {
                if (module.topics) {
                    module.topics.forEach((topic, topicIndex) => {
                        courseTotal++;
                        const topicId = `${course.id}-${moduleIndex}-${topicIndex}`;
                        if (progress[topicId] && progress[topicId].status === 'completed') {
                            courseCompleted++;
                        }
                    });
                }
            });
        }

        const courseProgress = courseTotal > 0 ? Math.round((courseCompleted / courseTotal) * 100) : 0;

        courseItem.innerHTML = `
            <h4>${escapeHtml(course.name)}</h4>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${courseProgress}%"></div>
            </div>
            <p class="progress-text">${courseCompleted}/${courseTotal} topics completed (${courseProgress}%)</p>
        `;

        progressDetails.appendChild(courseItem);
    });
}

// Local Storage Management
function saveCourses() {
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Note: loadCourses() is defined earlier and loads from API/localStorage

// Utility Functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// API Key Management Functions
function loadApiKeySettings() {
    const apiKeyInput = document.getElementById('api-key-input');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (apiKey) {
        apiKeyInput.value = apiKey;
        statusIndicator.className = 'status-indicator configured';
        statusText.textContent = 'API key configured';
    } else {
        apiKeyInput.value = '';
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'No API key configured';
    }
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    const key = apiKeyInput.value.trim();
    
    if (!key) {
        alert('Please enter an API key');
        return;
    }
    
    if (!key.startsWith('sk-')) {
        alert('Invalid API key format. OpenAI API keys should start with "sk-"');
        return;
    }
    
    // Save to localStorage
    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    
    // Update UI
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    statusIndicator.className = 'status-indicator configured';
    statusText.textContent = 'API key saved';
    
    // Send to backend
    sendApiKeyToBackend(key);
    
    alert('API key saved successfully!');
}

function testApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    const key = apiKeyInput.value.trim();
    const testResult = document.getElementById('api-test-result');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (!key) {
        alert('Please enter an API key to test');
        return;
    }
    
    // Update status to testing
    statusIndicator.className = 'status-indicator testing';
    statusText.textContent = 'Testing API key...';
    testResult.style.display = 'none';
    
    // Test the API key
    fetch(`${API_BASE_URL}/test-api-key`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: key })
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            statusIndicator.className = 'status-indicator configured';
            statusText.textContent = 'API key is valid';
            testResult.className = 'api-test-result success';
            testResult.textContent = '✓ API key is valid and working!';
            testResult.style.display = 'block';
            
            // Auto-save if valid
            apiKey = key;
            localStorage.setItem('openai_api_key', key);
            sendApiKeyToBackend(key);
        } else {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'API key test failed';
            testResult.className = 'api-test-result error';
            testResult.textContent = `✗ ${data.error || 'API key test failed'}`;
            testResult.style.display = 'block';
        }
    })
    .catch(error => {
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'Test failed';
        testResult.className = 'api-test-result error';
        testResult.textContent = `✗ Error: ${error.message}. Make sure the backend server is running.`;
        testResult.style.display = 'block';
    });
}

function clearApiKey() {
    if (!confirm('Are you sure you want to clear your API key?')) {
        return;
    }
    
    apiKey = '';
    localStorage.removeItem('openai_api_key');
    
    const apiKeyInput = document.getElementById('api-key-input');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const testResult = document.getElementById('api-test-result');
    
    apiKeyInput.value = '';
    statusIndicator.className = 'status-indicator';
    statusText.textContent = 'No API key configured';
    testResult.style.display = 'none';
    
    // Clear from backend
    fetch(`${API_BASE_URL}/clear-api-key`, {
        method: 'POST'
    }).catch(err => console.error('Error clearing API key from backend:', err));
    
    alert('API key cleared');
}

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('api-key-input');
    const toggleBtn = document.getElementById('toggle-api-key-visibility');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.innerHTML = '<span class="eye-icon">🙈</span>';
    } else {
        apiKeyInput.type = 'password';
        toggleBtn.innerHTML = '<span class="eye-icon">👁️</span>';
    }
}

function sendApiKeyToBackend(key) {
    // Send API key to backend for this session
    fetch(`${API_BASE_URL}/set-api-key`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: key })
    }).catch(err => console.error('Error sending API key to backend:', err));
}

// Include API key in all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const [url, options = {}] = args;
    
    // Only add API key to our backend requests
    if (typeof url === 'string' && url.startsWith(API_BASE_URL)) {
        if (!options.headers) {
            options.headers = {};
        }
        if (apiKey) {
            options.headers['X-API-Key'] = apiKey;
        }
    }
    
    return originalFetch.apply(this, args);
};

// Note: Courses are loaded in initializeApp() which runs on DOMContentLoaded

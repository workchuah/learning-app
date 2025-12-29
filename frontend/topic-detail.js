// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
const moduleIndex = parseInt(urlParams.get('moduleIndex'));
const topicIndex = parseInt(urlParams.get('topicIndex'));

let course = null;
let topic = null;
let progress = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const authenticated = await requireAuth();
    if (!authenticated) return;
    if (!courseId || moduleIndex === null || topicIndex === null) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadCourse();
    await loadProgress();
    setupEventListeners();
    updateUI();
});

async function loadCourse() {
    try {
        const response = await apiFetch(`/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to load course');
        
        course = await response.json();
        topic = course.modules[moduleIndex].topics[topicIndex];
        
        document.getElementById('topic-title').textContent = topic.name;
        document.getElementById('back-link').href = `course-detail.html?id=${courseId}`;
        
        // Load existing content if available
        if (topic.content) {
            loadTopicContent(topic.content);
        }
    } catch (error) {
        console.error('Error loading course:', error);
        alert('Failed to load topic');
        window.location.href = 'index.html';
    }
}

async function loadProgress() {
    try {
        const response = await apiFetch('/progress');
        if (response.ok) {
            progress = await response.json();
            updateProgress();
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function updateProgress() {
    const topicId = `${courseId}-${moduleIndex}-${topicIndex}`;
    const topicProgress = progress[topicId] || { status: 'not-started', progress: 0 };
    
    const progressFill = document.getElementById('topic-progress-fill');
    const progressText = document.getElementById('topic-progress-text');
    
    progressFill.style.width = `${topicProgress.progress}%`;
    progressText.textContent = `${topicProgress.progress}% Complete`;
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // Generate content
    document.getElementById('generate-content-btn').addEventListener('click', generateContent);
    
    // Mark complete
    document.getElementById('mark-complete-btn').addEventListener('click', markComplete);
    
    // Quiz modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('quiz-modal').classList.remove('show');
    });
    
    document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-content`);
    });
}

async function generateContent() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    try {
        const topicId = `${courseId}-${moduleIndex}-${topicIndex}`;
        const response = await apiFetch(`/topics/${topicId}/generate-content`, {
            method: 'POST',
            body: JSON.stringify({
                topic: topic.name,
                course: course.name,
                module: course.modules[moduleIndex].name
            })
        });
        
        if (!response.ok) throw new Error('Failed to generate content');
        
        const content = await response.json();
        loadTopicContent(content);
        
        // Reload course to get updated content
        await loadCourse();
    } catch (error) {
        console.error('Error generating content:', error);
        alert('Failed to generate content. Make sure API keys are configured in Settings.');
    } finally {
        loading.style.display = 'none';
    }
}

function loadTopicContent(content) {
    if (content.lecture) {
        document.getElementById('lecture-content').innerHTML = formatContent(content.lecture);
    }
    if (content.tutorial) {
        document.getElementById('tutorial-content').innerHTML = formatContent(content.tutorial);
    }
    if (content.practical) {
        document.getElementById('practical-content').innerHTML = formatContent(content.practical);
    }
    if (content.quiz) {
        document.getElementById('quiz-content').innerHTML = formatQuiz(content.quiz);
    }
}

function formatContent(content) {
    if (typeof content === 'string') {
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
    
    quizTitle.textContent = topic.name;
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
    
    if (score >= 70) {
        updateProgressBar(100);
    }
}

function updateProgressBar(percent) {
    const progressFill = document.getElementById('topic-progress-fill');
    const progressText = document.getElementById('topic-progress-text');
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Complete`;
}

async function markComplete() {
    const topicId = `${courseId}-${moduleIndex}-${topicIndex}`;
    
    try {
        await apiFetch('/progress', {
            method: 'POST',
            body: JSON.stringify({
                topic_id: topicId,
                status: 'completed',
                progress: 100
            })
        });
        
        progress[topicId] = { status: 'completed', progress: 100 };
        updateProgress();
        alert('Topic marked as complete!');
    } catch (error) {
        console.error('Error updating progress:', error);
        alert('Failed to update progress');
    }
}

function updateUI() {
    updateProgress();
}

// Topic page functionality
requireAuth();

let topicId = null;
let courseId = null;
let topic = null;
let quizSubmitted = false;

async function loadTopic() {
  const params = new URLSearchParams(window.location.search);
  topicId = params.get('id');
  courseId = params.get('courseId');
  
  if (!topicId) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Set back link
  if (courseId) {
    document.getElementById('back-link').href = `course.html?id=${courseId}`;
  } else {
    document.getElementById('back-link').href = 'dashboard.html';
  }
  
  const loading = document.getElementById('loading');
  const content = document.getElementById('topic-content');
  const errorDiv = document.getElementById('error-message');
  
  loading.style.display = 'block';
  content.style.display = 'none';
  errorDiv.classList.add('hidden');
  
  try {
    topic = await api.getTopic(topicId);
    
    document.getElementById('topic-title').textContent = topic.title;
    
    if (topic.status === 'ready' && topic.lecture_notes) {
      renderTopicContent();
    } else {
      document.getElementById('generate-content-section').style.display = 'block';
    }
    
    loading.style.display = 'none';
    content.style.display = 'block';
  } catch (error) {
    loading.style.display = 'none';
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

function renderTopicContent() {
  // Lecture Notes
  if (topic.lecture_notes) {
    document.getElementById('lecture-notes-section').style.display = 'block';
    document.getElementById('lecture-notes-content').innerHTML = simpleMarkdownToHtml(topic.lecture_notes);
    
    // Show highlighted version if available
    if (topic.highlighted_lecture_notes) {
      document.getElementById('highlighted-lecture-notes-content').innerHTML = simpleMarkdownToHtml(topic.highlighted_lecture_notes);
      document.getElementById('toggle-highlight-btn').style.display = 'inline-block';
      document.getElementById('regenerate-highlighted-btn').style.display = 'inline-block';
    }
  }
  
  // Audiobook
  if (topic.audiobook_url) {
    document.getElementById('audiobook-section').style.display = 'block';
    const audioPlayer = document.getElementById('audiobook-player');
    // Construct full URL (assuming backend serves from /uploads)
    let audioUrl = topic.audiobook_url;
    if (!audioUrl.startsWith('http')) {
      // If relative path, construct full URL from API base
      const baseUrl = window.API_BASE_URL ? window.API_BASE_URL.replace('/api', '') : API_BASE_URL.replace('/api', '');
      audioUrl = `${baseUrl}${topic.audiobook_url}`;
    }
    audioPlayer.src = audioUrl;
  }
  
  // Tutorial Exercises
  if (topic.tutorial_exercises && topic.tutorial_exercises.length > 0) {
    document.getElementById('tutorial-section').style.display = 'block';
    const container = document.getElementById('tutorial-exercises-content');
    container.innerHTML = '';
    
    topic.tutorial_exercises.forEach((exercise, index) => {
      const exerciseDiv = document.createElement('div');
      exerciseDiv.style.marginBottom = '24px';
      exerciseDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Exercise ${index + 1}:</strong>
          <p style="margin-top: 8px;">${exercise.question}</p>
        </div>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; color: #3b82f6; font-weight: 500;">Show Answer</summary>
          <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
            ${simpleMarkdownToHtml(exercise.answer)}
          </div>
        </details>
      `;
      container.appendChild(exerciseDiv);
    });
  }
  
  // Practical Tasks
  if (topic.practical_tasks && topic.practical_tasks.length > 0) {
    document.getElementById('practical-tasks-section').style.display = 'block';
    const container = document.getElementById('practical-tasks-content');
    container.innerHTML = '';
    
    topic.practical_tasks.forEach((task, index) => {
      const taskDiv = document.createElement('div');
      taskDiv.style.marginBottom = '24px';
      taskDiv.style.padding = '16px';
      taskDiv.style.border = '1px solid #e2e8f0';
      taskDiv.style.borderRadius = '6px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed || false;
      checkbox.style.marginRight = '12px';
      checkbox.addEventListener('change', async () => {
        try {
          await api.updatePracticalTask(topicId, index, checkbox.checked);
          task.completed = checkbox.checked;
        } catch (error) {
          alert('Failed to update task: ' + error.message);
          checkbox.checked = !checkbox.checked;
        }
      });
      
      taskDiv.innerHTML = `
        <div style="display: flex; align-items: start;">
          ${checkbox.outerHTML}
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0;">${task.title}</h4>
            <p style="color: #64748b; margin: 0 0 12px 0;">${task.description}</p>
            ${task.steps && task.steps.length > 0 ? `
              <ol style="margin: 0; padding-left: 20px;">
                ${task.steps.map(step => `<li style="margin-bottom: 4px;">${step}</li>`).join('')}
              </ol>
            ` : ''}
          </div>
        </div>
      `;
      container.appendChild(taskDiv);
    });
  }
  
  // Quiz
  if (topic.quiz && (topic.quiz.mcq_questions?.length > 0 || topic.quiz.short_answer_questions?.length > 0)) {
    document.getElementById('quiz-section').style.display = 'block';
    renderQuiz();
  }
  
  document.getElementById('generate-content-section').style.display = 'none';
}

function renderQuiz() {
  const container = document.getElementById('quiz-content');
  container.innerHTML = '';
  
  const form = document.createElement('form');
  form.id = 'quiz-form';
  
  // MCQ Questions
  if (topic.quiz.mcq_questions && topic.quiz.mcq_questions.length > 0) {
    const mcqSection = document.createElement('div');
    mcqSection.style.marginBottom = '30px';
    mcqSection.innerHTML = '<h3 style="margin-bottom: 16px;">Multiple Choice Questions</h3>';
    
    topic.quiz.mcq_questions.forEach((q, index) => {
      const qDiv = document.createElement('div');
      qDiv.style.marginBottom = '24px';
      qDiv.style.padding = '16px';
      qDiv.style.border = '1px solid #e2e8f0';
      qDiv.style.borderRadius = '6px';
      
      qDiv.innerHTML = `
        <p style="font-weight: 500; margin-bottom: 12px;">${index + 1}. ${q.question}</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${q.options.map((opt, optIndex) => `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="mcq_${index}" value="${optIndex}" required>
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
      mcqSection.appendChild(qDiv);
    });
    
    form.appendChild(mcqSection);
  }
  
  // Short Answer Questions
  if (topic.quiz.short_answer_questions && topic.quiz.short_answer_questions.length > 0) {
    const saqSection = document.createElement('div');
    saqSection.style.marginBottom = '30px';
    saqSection.innerHTML = '<h3 style="margin-bottom: 16px;">Short Answer Questions</h3>';
    
    topic.quiz.short_answer_questions.forEach((q, index) => {
      const qDiv = document.createElement('div');
      qDiv.style.marginBottom = '24px';
      qDiv.style.padding = '16px';
      qDiv.style.border = '1px solid #e2e8f0';
      qDiv.style.borderRadius = '6px';
      
      qDiv.innerHTML = `
        <p style="font-weight: 500; margin-bottom: 12px;">${index + 1}. ${q.question}</p>
        <textarea name="saq_${index}" class="form-input" rows="3" required></textarea>
      `;
      saqSection.appendChild(qDiv);
    });
    
    form.appendChild(saqSection);
  }
  
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Submit Quiz';
  submitBtn.style.marginTop = '20px';
  form.appendChild(submitBtn);
  
  container.appendChild(form);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitQuiz(form);
  });
}

async function submitQuiz(form) {
  if (quizSubmitted) return;
  
  const formData = new FormData(form);
  const answers = {};
  
  // Collect MCQ answers
  topic.quiz.mcq_questions?.forEach((q, index) => {
    const answer = formData.get(`mcq_${index}`);
    if (answer) answers[`mcq_${index}`] = parseInt(answer);
  });
  
  // Collect SAQ answers
  topic.quiz.short_answer_questions?.forEach((q, index) => {
    answers[`saq_${index}`] = formData.get(`saq_${index}`);
  });
  
  // Calculate score
  let correct = 0;
  let total = 0;
  
  // Check MCQ
  topic.quiz.mcq_questions?.forEach((q, index) => {
    total++;
    if (answers[`mcq_${index}`] === q.correct_answer) {
      correct++;
    }
  });
  
  // SAQ are not auto-graded, but count as attempted
  total += topic.quiz.short_answer_questions?.length || 0;
  
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  try {
    await api.updateProgress({
      course_id: courseId || topic.course_id,
      topic_id: topicId,
      type: 'topic',
      completed: false,
      quiz_score: score,
      answers: answers,
    });
    
    quizSubmitted = true;
    showQuizResults(score, answers);
  } catch (error) {
    alert('Failed to submit quiz: ' + error.message);
  }
}

function showQuizResults(score, answers) {
  const resultsDiv = document.getElementById('quiz-results');
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = `
    <div style="padding: 20px; background: #f8fafc; border-radius: 6px; margin-bottom: 20px;">
      <h3>Quiz Results</h3>
      <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 12px 0;">Score: ${score}%</p>
    </div>
  `;
  
  // Show answers and explanations
  const answersDiv = document.createElement('div');
  
  // MCQ Results
  topic.quiz.mcq_questions?.forEach((q, index) => {
    const userAnswer = answers[`mcq_${index}`];
    const isCorrect = userAnswer === q.correct_answer;
    
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '20px';
    qDiv.style.padding = '16px';
    qDiv.style.border = `1px solid ${isCorrect ? '#10b981' : '#ef4444'}`;
    qDiv.style.borderRadius = '6px';
    qDiv.style.background = isCorrect ? '#f0fdf4' : '#fef2f2';
    
    qDiv.innerHTML = `
      <p style="font-weight: 500; margin-bottom: 8px;">${index + 1}. ${q.question}</p>
      <p style="color: ${isCorrect ? '#10b981' : '#ef4444'}; margin-bottom: 8px;">
        ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
      </p>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">
        Your answer: ${q.options[userAnswer] || 'Not answered'}
      </p>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
        Correct answer: ${q.options[q.correct_answer]}
      </p>
      <p style="color: #1e293b; font-size: 14px; margin: 0;">
        <strong>Explanation:</strong> ${q.explanation}
      </p>
    `;
    answersDiv.appendChild(qDiv);
  });
  
  // SAQ Results
  topic.quiz.short_answer_questions?.forEach((q, index) => {
    const userAnswer = answers[`saq_${index}`];
    
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '20px';
    qDiv.style.padding = '16px';
    qDiv.style.border = '1px solid #e2e8f0';
    qDiv.style.borderRadius = '6px';
    
    qDiv.innerHTML = `
      <p style="font-weight: 500; margin-bottom: 8px;">${index + 1}. ${q.question}</p>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
        <strong>Your answer:</strong> ${userAnswer || 'Not answered'}
      </p>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
        <strong>Sample answer:</strong> ${q.answer}
      </p>
      <p style="color: #1e293b; font-size: 14px; margin: 0;">
        <strong>Explanation:</strong> ${q.explanation}
      </p>
    `;
    answersDiv.appendChild(qDiv);
  });
  
  resultsDiv.appendChild(answersDiv);
  
  // Disable form
  const form = document.getElementById('quiz-form');
  if (form) {
    form.querySelectorAll('input, textarea, button').forEach(el => {
      el.disabled = true;
    });
  }
}

// Generate content
document.getElementById('generate-content-btn').addEventListener('click', async () => {
  const btn = document.getElementById('generate-content-btn');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  btn.disabled = true;
  btn.textContent = 'Generating...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const result = await api.generateTopicContent(topicId);
    topic = result.topic;
    renderTopicContent();
    successDiv.textContent = 'Topic content generated successfully!';
    successDiv.classList.remove('hidden');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Generate Topic Content';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Simple markdown to HTML converter
function simpleMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Preserve <mark> tags (for highlighted keywords) - do this before wrapping
  // The mark tags should already be in the HTML from the AI response
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

// Toggle between original and highlighted lecture notes
document.addEventListener('click', (e) => {
  if (e.target.id === 'toggle-highlight-btn') {
    document.getElementById('lecture-notes-content').style.display = 'none';
    document.getElementById('highlighted-lecture-notes-content').style.display = 'block';
    document.getElementById('toggle-highlight-btn').style.display = 'none';
    document.getElementById('toggle-original-btn').style.display = 'inline-block';
  } else if (e.target.id === 'toggle-original-btn') {
    document.getElementById('lecture-notes-content').style.display = 'block';
    document.getElementById('highlighted-lecture-notes-content').style.display = 'none';
    document.getElementById('toggle-highlight-btn').style.display = 'inline-block';
    document.getElementById('toggle-original-btn').style.display = 'none';
  }
});

// Regenerate section handlers
async function regenerateSection(section, sectionName) {
  const topicId = new URLSearchParams(window.location.search).get('id');
  if (!topicId) return;

  const btn = document.getElementById(`regenerate-${section}-btn`);
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');

  if (!btn) return;

  btn.disabled = true;
  btn.textContent = '🔄 Regenerating...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');

  try {
    const result = await api.regenerateTopicSection(topicId, section);
    topic = result.topic;
    renderTopicContent();
    successDiv.textContent = `${sectionName} regenerated successfully!`;
    successDiv.classList.remove('hidden');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Regenerate';
  }
}

// Add regenerate button event listeners
document.getElementById('regenerate-lecture-notes-btn')?.addEventListener('click', () => {
  regenerateSection('lecture_notes', 'Lecture Notes');
});

document.getElementById('regenerate-highlighted-btn')?.addEventListener('click', () => {
  regenerateSection('highlighted_notes', 'Highlighted Notes');
});

document.getElementById('regenerate-audiobook-btn')?.addEventListener('click', () => {
  regenerateSection('audiobook', 'Audiobook');
});

document.getElementById('regenerate-tutorial-btn')?.addEventListener('click', () => {
  regenerateSection('tutorial_exercises', 'Tutorial Exercises');
});

document.getElementById('regenerate-practical-btn')?.addEventListener('click', () => {
  regenerateSection('practical_tasks', 'Practical Tasks');
});

document.getElementById('regenerate-quiz-btn')?.addEventListener('click', () => {
  regenerateSection('quiz', 'Quiz');
});

// Load topic on page load
loadTopic();


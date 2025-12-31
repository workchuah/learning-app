// Topic page functionality
requireAuth();

let topicId = null;
let courseId = null;
let topic = null;
let progress = null;
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
    
    // Load progress data to get saved quiz answers
    try {
      const progressData = await api.getProgress(courseId || topic.course_id, topicId);
      if (progressData && progressData.length > 0) {
        // Get the most recent progress for this topic
        progress = progressData.find(p => p.topic_id === topicId || (p.topic_id && p.topic_id.toString() === topicId)) || progressData[0];
        if (progress && progress.completed) {
          quizSubmitted = true;
        }
      }
    } catch (progressError) {
      console.warn('Could not load progress:', progressError);
      // Continue without progress data
    }
    
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
    
    // If topic is completed, show results instead of form
    if (progress && progress.completed && progress.quiz_attempts && progress.quiz_attempts.length > 0) {
      const latestAttempt = progress.quiz_attempts[progress.quiz_attempts.length - 1];
      showQuizResults(progress.quiz_score || latestAttempt.score, latestAttempt.answers || {});
    } else {
      renderQuiz();
    }
  }
  
  document.getElementById('generate-content-section').style.display = 'none';
}

function renderQuiz() {
  const container = document.getElementById('quiz-content');
  container.innerHTML = '';
  
  const form = document.createElement('form');
  form.id = 'quiz-form';
  
  // Get saved answers from progress (if exists)
  let savedAnswers = {};
  if (progress && progress.quiz_attempts && progress.quiz_attempts.length > 0) {
    const latestAttempt = progress.quiz_attempts[progress.quiz_attempts.length - 1];
    savedAnswers = latestAttempt.answers || {};
  }
  
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
      
      const savedAnswer = savedAnswers[`mcq_${index}`];
      
      qDiv.innerHTML = `
        <p style="font-weight: 500; margin-bottom: 12px;">${index + 1}. ${q.question}</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${q.options.map((opt, optIndex) => {
            const isChecked = savedAnswer !== undefined && parseInt(savedAnswer) === optIndex;
            return `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="mcq_${index}" value="${optIndex}" ${isChecked ? 'checked' : ''} required>
              <span>${opt}</span>
            </label>
          `;
          }).join('')}
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
      
      const savedAnswer = savedAnswers[`saq_${index}`] || '';
      
      qDiv.innerHTML = `
        <p style="font-weight: 500; margin-bottom: 12px;">${index + 1}. ${q.question}</p>
        <textarea name="saq_${index}" class="form-input" rows="3" required>${savedAnswer}</textarea>
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
  
  // Calculate score - ONLY based on Multiple Choice Questions (MCQ)
  let correct = 0;
  let total = 0;
  
  // Check MCQ only (SAQ are for reference, not graded)
  topic.quiz.mcq_questions?.forEach((q, index) => {
    total++;
    if (answers[`mcq_${index}`] === q.correct_answer) {
      correct++;
    }
  });
  
  // Score is calculated ONLY from MCQ (not SAQ)
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  try {
    // Save quiz results (but don't mark as completed yet)
    await api.updateProgress({
      course_id: courseId || topic.course_id,
      topic_id: topicId,
      type: 'topic',
      completed: false, // Will be marked complete when user clicks "Complete this Topic"
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
  
  const mcqCount = topic.quiz.mcq_questions?.length || 0;
  const correctCount = topic.quiz.mcq_questions?.reduce((count, q, index) => {
    return count + (answers[`mcq_${index}`] === q.correct_answer ? 1 : 0);
  }, 0) || 0;
  
  resultsDiv.innerHTML = `
    <div style="padding: 20px; background: #f8fafc; border-radius: 6px; margin-bottom: 20px;">
      <h3>Quiz Results</h3>
      <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 12px 0;">
        Score: ${score}% (${correctCount}/${mcqCount} Multiple Choice Questions)
      </p>
      <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
        <em>Note: Score is calculated based on Multiple Choice Questions only. Short Answer Questions are for your reference to compare with sample answers.</em>
      </p>
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
  
  // SAQ Results (for reference only, not graded)
  if (topic.quiz.short_answer_questions && topic.quiz.short_answer_questions.length > 0) {
    const saqSection = document.createElement('div');
    saqSection.style.marginTop = '30px';
    saqSection.innerHTML = '<h3 style="margin-bottom: 16px;">Short Answer Questions (For Your Reference)</h3>';
    saqSection.innerHTML += '<p style="color: #64748b; font-size: 14px; margin-bottom: 16px;"><em>These questions are not graded. Compare your answers with the sample answers below.</em></p>';
    
    topic.quiz.short_answer_questions.forEach((q, index) => {
      const userAnswer = answers[`saq_${index}`];
      
      const qDiv = document.createElement('div');
      qDiv.style.marginBottom = '20px';
      qDiv.style.padding = '16px';
      qDiv.style.border = '1px solid #e2e8f0';
      qDiv.style.borderRadius = '6px';
      qDiv.style.background = '#f8fafc';
      
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
      saqSection.appendChild(qDiv);
    });
    
    answersDiv.appendChild(saqSection);
  }
  
  resultsDiv.appendChild(answersDiv);
  
  // Disable form
  const form = document.getElementById('quiz-form');
  if (form) {
    form.querySelectorAll('input, textarea, button').forEach(el => {
      el.disabled = true;
    });
  }
  
  // Add "Complete this Topic" button (only if not already completed)
  if (!progress || !progress.completed) {
    const completeButtonDiv = document.createElement('div');
    completeButtonDiv.style.marginTop = '30px';
    completeButtonDiv.style.padding = '20px';
    completeButtonDiv.style.background = '#f0fdf4';
    completeButtonDiv.style.border = '2px solid #10b981';
    completeButtonDiv.style.borderRadius = '8px';
    completeButtonDiv.style.textAlign = 'center';
    
    const completeButton = document.createElement('button');
    completeButton.className = 'btn btn-primary';
    completeButton.textContent = '✅ Complete this Topic';
    completeButton.style.fontSize = '16px';
    completeButton.style.padding = '12px 32px';
    completeButton.addEventListener('click', async () => {
      await completeTopic(score, answers);
    });
    
    completeButtonDiv.innerHTML = `
      <p style="margin-bottom: 16px; color: #1e293b; font-weight: 500;">Ready to mark this topic as complete?</p>
    `;
    completeButtonDiv.appendChild(completeButton);
    
    resultsDiv.appendChild(completeButtonDiv);
  } else {
    // Topic already completed - show completion message
    const completedDiv = document.createElement('div');
    completedDiv.style.marginTop = '30px';
    completedDiv.style.padding = '20px';
    completedDiv.style.background = '#f0fdf4';
    completedDiv.style.border = '2px solid #10b981';
    completedDiv.style.borderRadius = '8px';
    completedDiv.style.textAlign = 'center';
    completedDiv.innerHTML = `
      <p style="color: #10b981; font-weight: 600; font-size: 16px; margin: 0;">
        ✅ Topic Completed
      </p>
      <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
        This topic has been marked as complete. Your answers and progress have been saved.
      </p>
    `;
    resultsDiv.appendChild(completedDiv);
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

// Complete topic function
async function completeTopic(quizScore, answers) {
  const btn = document.querySelector('#quiz-results button');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Completing...';
  }
  
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    // Mark topic as completed and save all answers/results
    await api.updateProgress({
      course_id: courseId || topic.course_id,
      topic_id: topicId,
      type: 'topic',
      completed: true, // Mark as completed
      quiz_score: quizScore,
      answers: answers,
    });
    
    // Update progress variable
    progress = { 
      completed: true, 
      quiz_score: quizScore,
      quiz_attempts: [{ answers: answers, score: quizScore }]
    };
    
    successDiv.textContent = 'Topic completed successfully! Progress updated.';
    successDiv.classList.remove('hidden');
    
    // Update UI to show completion
    if (btn) {
      btn.textContent = '✅ Topic Completed';
      btn.style.background = '#10b981';
      btn.disabled = true;
    }
    
    // Reload page to show updated state and progress bar
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    errorDiv.textContent = 'Failed to complete topic: ' + error.message;
    errorDiv.classList.remove('hidden');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ Complete this Topic';
    }
  }
}

// Load topic on page load
loadTopic();


// Course page functionality
requireAuth();

let courseId = null;
let course = null;
let modules = [];
let topics = [];

async function loadCourse() {
  const params = new URLSearchParams(window.location.search);
  courseId = params.get('id');
  
  if (!courseId) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  const loading = document.getElementById('loading');
  const content = document.getElementById('course-content');
  const errorDiv = document.getElementById('error-message');
  
  loading.style.display = 'block';
  content.style.display = 'none';
  errorDiv.classList.add('hidden');
  
  try {
    const data = await api.getCourse(courseId);
    course = data.course;
    modules = data.modules || [];
    topics = data.topics || [];
    
    // Update UI
    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-goal').textContent = course.goal;
    document.getElementById('course-timeline').textContent = course.target_timeline || 'To be estimated after structure generation';
    
    const progress = course.progress_percentage || 0;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${progress}%`;
    
    // Show/hide generate button
    const generateBtn = document.getElementById('generate-structure-btn');
    if (course.status === 'draft' || course.status === 'generating') {
      generateBtn.style.display = 'inline-block';
      generateBtn.textContent = course.status === 'generating' ? 'Generating...' : 'Generate Course Structure';
      generateBtn.disabled = course.status === 'generating';
    } else {
      generateBtn.style.display = 'none';
    }
    
    // Render modules
    renderModules();
    
    loading.style.display = 'none';
    content.style.display = 'block';
  } catch (error) {
    loading.style.display = 'none';
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

function renderModules() {
  const container = document.getElementById('modules-container');
  container.innerHTML = '';
  
  if (modules.length === 0) {
    container.innerHTML = '<div class="card"><p style="color: #64748b;">No modules yet. Generate the course structure to create modules and topics.</p></div>';
    return;
  }
  
  modules.forEach(module => {
    const moduleCard = document.createElement('div');
    moduleCard.className = 'card';
    moduleCard.style.marginBottom = '20px';
    
    const moduleHeader = document.createElement('div');
    moduleHeader.style.display = 'flex';
    moduleHeader.style.justifyContent = 'space-between';
    moduleHeader.style.alignItems = 'center';
    moduleHeader.style.cursor = 'pointer';
    
    // Get difficulty level badge
    const difficulty = module.difficulty_level || 'beginner';
    const difficultyLabels = {
      'beginner': { label: 'Beginner', color: '#10b981', bg: '#d1fae5' },
      'medium': { label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
      'expert': { label: 'Expert', color: '#ef4444', bg: '#fee2e2' }
    };
    const diffInfo = difficultyLabels[difficulty] || difficultyLabels['beginner'];
    
    moduleHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <h3 style="margin: 0;">${module.title}</h3>
        <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${diffInfo.bg}; color: ${diffInfo.color};">
          ${diffInfo.label}
        </span>
      </div>
      <span style="color: #64748b;">▼</span>
    `;
    
    const moduleContent = document.createElement('div');
    moduleContent.className = 'module-content';
    moduleContent.style.display = 'none';
    moduleContent.style.marginTop = '16px';
    moduleContent.style.paddingTop = '16px';
    moduleContent.style.borderTop = '1px solid #e2e8f0';
    
    // Load topics for this module
    loadModuleTopics(module._id, moduleContent);
    
    moduleHeader.addEventListener('click', () => {
      const isHidden = moduleContent.style.display === 'none';
      moduleContent.style.display = isHidden ? 'block' : 'none';
      moduleHeader.querySelector('span').textContent = isHidden ? '▲' : '▼';
    });
    
    moduleCard.appendChild(moduleHeader);
    moduleCard.appendChild(moduleContent);
    container.appendChild(moduleCard);
  });
}

async function loadModuleTopics(moduleId, container) {
  try {
    // Filter topics by module from the already loaded topics
    const moduleTopics = topics.filter(t => {
      const topicModuleId = typeof t.module_id === 'string' ? t.module_id : t.module_id?._id || t.module_id;
      return topicModuleId === moduleId || topicModuleId?.toString() === moduleId.toString();
    });
    moduleTopics.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (moduleTopics.length === 0) {
      container.innerHTML = '<p style="color: #64748b;">No topics in this module yet.</p>';
      return;
    }
    
    const topicsList = document.createElement('div');
    topicsList.style.display = 'flex';
    topicsList.style.flexDirection = 'column';
    topicsList.style.gap = '8px';
    
    moduleTopics.forEach(topic => {
      const topicLink = document.createElement('a');
      const topicId = typeof topic._id === 'string' ? topic._id : topic._id?.toString();
      topicLink.href = `topic.html?id=${topicId}&courseId=${courseId}`;
      topicLink.className = 'topic-link';
      topicLink.textContent = `${topic.order || ''}. ${topic.title || 'Untitled Topic'}`;
      topicLink.style.textDecoration = 'none';
      topicLink.style.color = '#3b82f6';
      topicLink.style.padding = '8px 12px';
      topicLink.style.borderRadius = '6px';
      topicLink.style.transition = 'background 0.2s';
      topicLink.style.display = 'block';
      topicLink.addEventListener('mouseenter', () => {
        topicLink.style.background = '#f1f5f9';
      });
      topicLink.addEventListener('mouseleave', () => {
        topicLink.style.background = 'transparent';
      });
      topicsList.appendChild(topicLink);
    });
    
    container.appendChild(topicsList);
  } catch (error) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to load topics.</p>';
  }
}

// Generate course structure
document.getElementById('generate-structure-btn').addEventListener('click', async () => {
  const btn = document.getElementById('generate-structure-btn');
  const errorDiv = document.getElementById('error-message');
  
  btn.disabled = true;
  btn.textContent = 'Generating...';
  errorDiv.classList.add('hidden');
  
  try {
    await api.generateCourseStructure(courseId);
    // Reload course
    setTimeout(() => {
      loadCourse();
    }, 2000);
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Generate Course Structure';
  }
});

// Delete course
document.getElementById('delete-course-btn').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
    return;
  }
  
  try {
    await api.deleteCourse(courseId);
    window.location.href = 'dashboard.html';
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Load course on page load
loadCourse();


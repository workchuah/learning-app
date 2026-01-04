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
    document.getElementById('course-goal').textContent = course.goal || 'Manual Course - No goal required';
    document.getElementById('course-timeline').textContent = course.target_timeline || (course.course_type === 'manual' ? 'Manual Course' : 'To be estimated after structure generation');
    
    const progress = course.progress_percentage || 0;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${progress}%`;
    
    // Show/hide buttons based on course type
    const generateBtn = document.getElementById('generate-structure-btn');
    const addModuleBtn = document.getElementById('add-module-btn');
    
    if (course.course_type === 'manual') {
      // Manual course: Show "Add Module" button, hide "Generate Structure" button
      generateBtn.style.display = 'none';
      addModuleBtn.style.display = 'inline-block';
    } else {
      // AI-generated course: Show "Generate Structure" button, hide "Add Module" button
      addModuleBtn.style.display = 'none';
      if (course.status === 'draft' || course.status === 'generating') {
        generateBtn.style.display = 'inline-block';
        generateBtn.textContent = course.status === 'generating' ? 'Generating...' : 'Generate Course Structure';
        generateBtn.disabled = course.status === 'generating';
      } else {
        generateBtn.style.display = 'none';
      }
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
    
    // Add "Add Topic" button for manual courses
    if (course.course_type === 'manual') {
      const addTopicBtn = document.createElement('button');
      addTopicBtn.className = 'btn btn-secondary';
      addTopicBtn.textContent = '➕ Add Topic';
      addTopicBtn.style.marginBottom = '16px';
      addTopicBtn.addEventListener('click', () => {
        document.getElementById('topic-module-id').value = moduleId;
        document.getElementById('add-topic-modal').classList.remove('hidden');
      });
      container.appendChild(addTopicBtn);
    }
    
    if (moduleTopics.length === 0) {
      const emptyMsg = course.course_type === 'manual'
        ? '<p style="color: #64748b;">No topics in this module yet. Click "Add Topic" above to add one.</p>'
        : '<p style="color: #64748b;">No topics in this module yet.</p>';
      container.innerHTML += emptyMsg;
      if (course.course_type !== 'manual') return;
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
      
      // Check if topic is completed
      const isCompleted = topic.progress && topic.progress.completed;
      
      // Create link content with completion badge
      const linkContent = document.createElement('div');
      linkContent.style.display = 'flex';
      linkContent.style.alignItems = 'center';
      linkContent.style.justifyContent = 'space-between';
      linkContent.style.width = '100%';
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = `${topic.order || ''}. ${topic.title || 'Untitled Topic'}`;
      
      linkContent.appendChild(titleSpan);
      
      // Add completed badge if topic is completed
      if (isCompleted) {
        const badge = document.createElement('span');
        badge.textContent = '✅ Completed';
        badge.style.fontSize = '12px';
        badge.style.color = '#10b981';
        badge.style.fontWeight = '600';
        badge.style.marginLeft = '8px';
        linkContent.appendChild(badge);
      }
      
      topicLink.appendChild(linkContent);
      topicLink.style.textDecoration = 'none';
      topicLink.style.color = '#3b82f6';
      topicLink.style.padding = '8px 12px';
      topicLink.style.borderRadius = '6px';
      topicLink.style.transition = 'background 0.2s';
      topicLink.style.display = 'block';
      
      // Style completed topics differently
      if (isCompleted) {
        topicLink.style.background = '#f0fdf4';
        topicLink.style.borderLeft = '3px solid #10b981';
      }
      
      topicLink.addEventListener('mouseenter', () => {
        topicLink.style.background = isCompleted ? '#d1fae5' : '#f1f5f9';
      });
      topicLink.addEventListener('mouseleave', () => {
        topicLink.style.background = isCompleted ? '#f0fdf4' : 'transparent';
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

// Add Module Modal handlers
const addModuleModal = document.getElementById('add-module-modal');
const addModuleForm = document.getElementById('add-module-form');
const closeModuleModal = document.getElementById('close-module-modal');
const cancelModuleBtn = document.getElementById('cancel-module-btn');

document.getElementById('add-module-btn').addEventListener('click', () => {
  addModuleModal.classList.remove('hidden');
});

closeModuleModal.addEventListener('click', () => {
  addModuleModal.classList.add('hidden');
});

cancelModuleBtn.addEventListener('click', () => {
  addModuleModal.classList.add('hidden');
});

addModuleModal.addEventListener('click', (e) => {
  if (e.target === addModuleModal) {
    addModuleModal.classList.add('hidden');
  }
});

addModuleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const submitBtn = addModuleForm.querySelector('button[type="submit"]');
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const title = document.getElementById('module-title').value;
    const description = document.getElementById('module-description').value;
    
    await api.createModule(courseId, title, description);
    
    successDiv.textContent = 'Module created successfully!';
    successDiv.classList.remove('hidden');
    addModuleModal.classList.add('hidden');
    addModuleForm.reset();
    loadCourse(); // Reload to show new module
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Module';
  }
});

// Add Topic Modal handlers
const addTopicModal = document.getElementById('add-topic-modal');
const addTopicForm = document.getElementById('add-topic-form');
const closeTopicModal = document.getElementById('close-topic-modal');
const cancelTopicBtn = document.getElementById('cancel-topic-btn');

closeTopicModal.addEventListener('click', () => {
  addTopicModal.classList.add('hidden');
});

cancelTopicBtn.addEventListener('click', () => {
  addTopicModal.classList.add('hidden');
});

addTopicModal.addEventListener('click', (e) => {
  if (e.target === addTopicModal) {
    addTopicModal.classList.add('hidden');
  }
});

addTopicForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const submitBtn = addTopicForm.querySelector('button[type="submit"]');
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const moduleId = document.getElementById('topic-module-id').value;
    const title = document.getElementById('topic-title').value;
    
    await api.createTopic(moduleId, title);
    
    successDiv.textContent = 'Topic created successfully!';
    successDiv.classList.remove('hidden');
    addTopicModal.classList.add('hidden');
    addTopicForm.reset();
    loadCourse(); // Reload to show new topic
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Topic';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Load course on page load
loadCourse();


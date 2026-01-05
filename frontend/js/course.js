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
    
    // Show/hide generate button (only for AI-generated courses)
    const generateBtn = document.getElementById('generate-structure-btn');
    if (course.course_type === 'ai_generated') {
      if (course.status === 'draft' || course.status === 'generating') {
        generateBtn.style.display = 'inline-block';
        generateBtn.textContent = course.status === 'generating' ? 'Generating...' : 'Generate Course Structure';
        generateBtn.disabled = course.status === 'generating';
      } else {
        generateBtn.style.display = 'none';
      }
    } else {
      // Manual course - hide generate button
      generateBtn.style.display = 'none';
    }
    
    // Show/hide manual course controls
    const manualControls = document.getElementById('manual-course-controls');
    if (course.course_type === 'manual') {
      manualControls.style.display = 'block';
    } else {
      manualControls.style.display = 'none';
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
  
  const isManualCourse = course.course_type === 'manual';
  
  if (modules.length === 0) {
    if (isManualCourse) {
      container.innerHTML = '<div class="card"><p style="color: #64748b;">No modules yet. Click "Add Module" above to create your first module.</p></div>';
    } else {
      container.innerHTML = '<div class="card"><p style="color: #64748b;">No modules yet. Generate the course structure to create modules and topics.</p></div>';
    }
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
    
    // Get difficulty level badge (only for AI-generated courses)
    let difficultyBadge = '';
    if (!isManualCourse) {
      const difficulty = module.difficulty_level || 'beginner';
      const difficultyLabels = {
        'beginner': { label: 'Beginner', color: '#10b981', bg: '#d1fae5' },
        'medium': { label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
        'expert': { label: 'Expert', color: '#ef4444', bg: '#fee2e2' }
      };
      const diffInfo = difficultyLabels[difficulty] || difficultyLabels['beginner'];
      difficultyBadge = `<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${diffInfo.bg}; color: ${diffInfo.color};">
        ${diffInfo.label}
      </span>`;
    }
    
    // Add edit/delete buttons for manual courses
    let actionButtons = '';
    if (isManualCourse) {
      actionButtons = `
        <div style="display: flex; gap: 8px; margin-left: 12px;">
          <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="editModule('${module._id}', '${module.title.replace(/'/g, "\\'")}')">✏️ Edit</button>
          <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="deleteModule('${module._id}')">🗑️ Delete</button>
        </div>
      `;
    }
    
    moduleHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <h3 style="margin: 0;">${module.title}</h3>
        ${difficultyBadge}
        ${actionButtons}
      </div>
      <span style="color: #64748b; margin-left: 12px;">▼</span>
    `;
    
    const moduleContent = document.createElement('div');
    moduleContent.className = 'module-content';
    moduleContent.style.display = 'none';
    moduleContent.style.marginTop = '16px';
    moduleContent.style.paddingTop = '16px';
    moduleContent.style.borderTop = '1px solid #e2e8f0';
    
    // Load topics for this module
    loadModuleTopics(module._id, moduleContent, isManualCourse);
    
    moduleHeader.addEventListener('click', (e) => {
      // Don't toggle if clicking on action buttons
      if (e.target.closest('button')) return;
      
      const isHidden = moduleContent.style.display === 'none';
      moduleContent.style.display = isHidden ? 'block' : 'none';
      const arrow = moduleHeader.querySelector('span:last-child');
      arrow.textContent = isHidden ? '▲' : '▼';
    });
    
    moduleCard.appendChild(moduleHeader);
    moduleCard.appendChild(moduleContent);
    container.appendChild(moduleCard);
  });
}

async function loadModuleTopics(moduleId, container, isManualCourse = false) {
  try {
    // Filter topics by module from the already loaded topics
    const moduleTopics = topics.filter(t => {
      const topicModuleId = typeof t.module_id === 'string' ? t.module_id : t.module_id?._id || t.module_id;
      return topicModuleId === moduleId || topicModuleId?.toString() === moduleId.toString();
    });
    moduleTopics.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const topicsList = document.createElement('div');
    topicsList.style.display = 'flex';
    topicsList.style.flexDirection = 'column';
    topicsList.style.gap = '8px';
    
    if (moduleTopics.length === 0) {
      if (isManualCourse) {
        topicsList.innerHTML = '<p style="color: #64748b;">No topics yet. Click "Add Topic" to create one.</p>';
      } else {
        topicsList.innerHTML = '<p style="color: #64748b;">No topics in this module yet.</p>';
      }
      container.appendChild(topicsList);
      return;
    }
    
    moduleTopics.forEach(topic => {
      const topicItem = document.createElement('div');
      topicItem.style.display = 'flex';
      topicItem.style.alignItems = 'center';
      topicItem.style.justifyContent = 'space-between';
      topicItem.style.gap = '12px';
      
      const topicLink = document.createElement('a');
      const topicId = typeof topic._id === 'string' ? topic._id : topic._id?.toString();
      topicLink.href = `topic.html?id=${topicId}&courseId=${courseId}`;
      topicLink.className = 'topic-link';
      topicLink.style.flex = '1';
      
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
      
      topicItem.appendChild(topicLink);
      
      // Add edit/delete buttons for manual courses
      if (isManualCourse) {
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '4px';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary';
        editBtn.style.padding = '4px 8px';
        editBtn.style.fontSize = '12px';
        editBtn.textContent = '✏️';
        editBtn.title = 'Edit Topic';
        editBtn.onclick = (e) => {
          e.preventDefault();
          editTopic(topicId, topic.title);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.style.padding = '4px 8px';
        deleteBtn.style.fontSize = '12px';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete Topic';
        deleteBtn.onclick = (e) => {
          e.preventDefault();
          deleteTopic(topicId);
        };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        topicItem.appendChild(actionsDiv);
      }
      
      topicsList.appendChild(topicItem);
    });
    
    // Add "Add Topic" button for manual courses
    if (isManualCourse) {
      const addTopicBtn = document.createElement('button');
      addTopicBtn.className = 'btn btn-primary';
      addTopicBtn.style.marginTop = '12px';
      addTopicBtn.style.width = '100%';
      addTopicBtn.textContent = '+ Add Topic';
      addTopicBtn.onclick = () => createTopic(moduleId);
      topicsList.appendChild(addTopicBtn);
    }
    
    container.appendChild(topicsList);
  } catch (error) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to load topics.</p>';
  }
}

// Generate course structure (AI-generated courses only)
const generateBtn = document.getElementById('generate-structure-btn');
if (generateBtn) {
  generateBtn.addEventListener('click', async () => {
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
}

// Manual course module/topic management functions
async function createModule() {
  const title = prompt('Enter module title:');
  if (!title || !title.trim()) return;
  
  const description = prompt('Enter module description (optional):') || '';
  
  try {
    await api.createModule(courseId, title.trim(), description.trim());
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

async function editModule(moduleId, currentTitle) {
  const newTitle = prompt('Enter new module title:', currentTitle);
  if (!newTitle || !newTitle.trim() || newTitle === currentTitle) return;
  
  try {
    await api.updateModule(moduleId, newTitle.trim());
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

async function deleteModule(moduleId) {
  if (!confirm('Are you sure you want to delete this module? All topics in this module will also be deleted.')) {
    return;
  }
  
  try {
    await api.deleteModule(moduleId);
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

async function createTopic(moduleId) {
  const title = prompt('Enter topic title:');
  if (!title || !title.trim()) return;
  
  try {
    await api.createTopic(moduleId, title.trim());
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

async function editTopic(topicId, currentTitle) {
  const newTitle = prompt('Enter new topic title:', currentTitle);
  if (!newTitle || !newTitle.trim() || newTitle === currentTitle) return;
  
  try {
    await api.updateTopic(topicId, newTitle.trim());
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

async function deleteTopic(topicId) {
  if (!confirm('Are you sure you want to delete this topic?')) {
    return;
  }
  
  try {
    await api.deleteTopic(topicId);
    loadCourse();
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

// Make functions globally available
window.createModule = createModule;
window.editModule = editModule;
window.deleteModule = deleteModule;
window.createTopic = createTopic;
window.editTopic = editTopic;
window.deleteTopic = deleteTopic;

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


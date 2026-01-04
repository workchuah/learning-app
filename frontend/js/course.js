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
      addTopicBtn.type = 'button'; // Explicitly set type to prevent form submission
      addTopicBtn.className = 'btn btn-secondary';
      addTopicBtn.textContent = '➕ Add Topic';
      addTopicBtn.style.marginBottom = '16px';
      addTopicBtn.style.cursor = 'pointer';
      addTopicBtn.style.position = 'relative';
      addTopicBtn.style.zIndex = '10';
      
      // Store moduleId as data attribute for easier access
      addTopicBtn.setAttribute('data-module-id', moduleId);
      
      // Use a named function for easier debugging
      const handleAddTopicClick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('Add Topic button clicked!', 'moduleId:', moduleId);
        console.log('Event:', e);
        console.log('Button element:', this);
        
        const storedModuleId = this.getAttribute('data-module-id') || moduleId;
        const moduleIdInput = document.getElementById('topic-module-id');
        const modal = document.getElementById('add-topic-modal');
        
        console.log('Modal elements check:', { 
          moduleIdInput: !!moduleIdInput, 
          modal: !!modal,
          modalClasses: modal ? modal.className : 'N/A',
          storedModuleId: storedModuleId
        });
        
        if (!moduleIdInput) {
          console.error('topic-module-id input not found');
          alert('Error: Topic module ID input not found. Please refresh the page.');
          return false;
        }
        
        if (!modal) {
          console.error('add-topic-modal not found');
          alert('Error: Add topic modal not found. Please refresh the page.');
          return false;
        }
        
        moduleIdInput.value = storedModuleId;
        
        // Force remove hidden class and ensure modal is visible
        // Since .hidden uses !important, we need to remove the class AND set display
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important'); // Force display with !important
        console.log('Modal should be visible now. Classes:', modal.className, 'Display:', modal.style.display);
        
        // Clear previous content
        const titleInput = document.getElementById('topic-title');
        if (titleInput) {
          titleInput.value = '';
        }
        
        const editor = document.getElementById('topic-content-editor');
        if (editor) {
          editor.innerHTML = '';
          // Initialize editor if not already done
          if (!topicContentEditor) {
            initTopicContentEditor();
          } else {
            // Re-initialize to get fresh reference
            topicContentEditor = editor;
          }
          if (updatePlaceholder) {
            updatePlaceholder();
          }
        }
        
        return false;
      };
      
      // Attach event listener with capture phase to ensure it fires
      addTopicBtn.addEventListener('click', handleAddTopicClick, true); // Use capture phase
      addTopicBtn.addEventListener('click', handleAddTopicClick, false); // Also use bubble phase
      
      // Also try mousedown as backup
      addTopicBtn.addEventListener('mousedown', function(e) {
        console.log('Add Topic button mousedown event fired!');
        e.stopPropagation();
        // Trigger click manually
        this.click();
      });
      
      // Make absolutely sure button is clickable
      addTopicBtn.style.pointerEvents = 'auto';
      addTopicBtn.style.userSelect = 'none';
      
      console.log('Add Topic button created for module:', moduleId, 'Button:', addTopicBtn);
      container.appendChild(addTopicBtn);
      console.log('Button appended to container. Container children:', container.children.length);
      
      // Verify button was added and is visible
      setTimeout(() => {
        const verifyBtn = container.querySelector('button[data-module-id="' + moduleId + '"]');
        if (verifyBtn) {
          console.log('✅ Button verification: FOUND', verifyBtn);
          console.log('Button styles:', {
            display: window.getComputedStyle(verifyBtn).display,
            visibility: window.getComputedStyle(verifyBtn).visibility,
            pointerEvents: window.getComputedStyle(verifyBtn).pointerEvents,
            zIndex: window.getComputedStyle(verifyBtn).zIndex
          });
        } else {
          console.error('❌ Button verification: NOT FOUND in container');
        }
      }, 100);
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
let topicContentEditor = null;
let updatePlaceholder = null;

// Initialize contenteditable editor
function initTopicContentEditor() {
  topicContentEditor = document.getElementById('topic-content-editor');
  if (!topicContentEditor) return;
  
  // Show placeholder when empty
  updatePlaceholder = function() {
    if (topicContentEditor.innerHTML.trim() === '' || topicContentEditor.innerHTML === '<br>') {
      topicContentEditor.setAttribute('data-placeholder-visible', 'true');
      topicContentEditor.style.color = '#9ca3af';
    } else {
      topicContentEditor.setAttribute('data-placeholder-visible', 'false');
      topicContentEditor.style.color = '#1e293b';
    }
  };
  
  // Handle paste events to preserve images
    topicContentEditor.addEventListener('paste', (e) => {
      e.preventDefault();
      const clipboardData = e.clipboardData || window.clipboardData;
      
      let html = clipboardData.getData('text/html');
      let text = clipboardData.getData('text/plain');
      
      // If HTML is available, use it (preserves images)
      if (html) {
        const selection = window.getSelection();
        if (selection.rangeCount) {
          selection.deleteContents();
          const range = selection.getRangeAt(0);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
          selection.collapseToEnd();
        }
      } else if (text) {
        // Fallback to plain text
        document.execCommand('insertText', false, text);
      }
      
      if (updatePlaceholder) {
        updatePlaceholder();
      }
    });
    
    // Update placeholder on input
    topicContentEditor.addEventListener('input', () => {
      if (updatePlaceholder) updatePlaceholder();
    });
    topicContentEditor.addEventListener('focus', () => {
      if (topicContentEditor.getAttribute('data-placeholder-visible') === 'true') {
        topicContentEditor.innerHTML = '';
        topicContentEditor.style.color = '#1e293b';
      }
    });
    topicContentEditor.addEventListener('blur', () => {
      if (updatePlaceholder) updatePlaceholder();
    });
    
    // Initial placeholder
    if (updatePlaceholder) {
      updatePlaceholder();
    }
}

// Initialize editor when page loads (if modal exists)
if (document.getElementById('topic-content-editor')) {
  initTopicContentEditor();
}

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
  submitBtn.textContent = 'Adding & Enhancing...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const moduleId = document.getElementById('topic-module-id').value;
    const title = document.getElementById('topic-title').value;
    const contentEditor = document.getElementById('topic-content-editor');
    const pastedContent = contentEditor ? contentEditor.innerHTML : '';
    
    if (!title || !pastedContent || pastedContent.trim() === '' || pastedContent === '<br>') {
      throw new Error('Topic title and content are required');
    }
    
    // Step 1: Create the topic
    const topic = await api.createTopic(moduleId, title);
    
    // Step 2: Enhance the pasted content (convert HTML to plain text for AI processing)
    if (pastedContent && pastedContent.trim() !== '' && pastedContent !== '<br>') {
      try {
        // Convert HTML to plain text for AI processing (images will be described)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pastedContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        await api.enhanceContent(topic._id, plainText);
        successDiv.textContent = 'Topic created and content enhanced successfully!';
      } catch (enhanceError) {
        console.warn('Content enhancement failed:', enhanceError);
        successDiv.textContent = 'Topic created successfully, but content enhancement failed. You can enhance it later from the topic page.';
      }
    } else {
      successDiv.textContent = 'Topic created successfully!';
    }
    
    successDiv.classList.remove('hidden');
    addTopicModal.classList.add('hidden');
    addTopicForm.reset();
    if (contentEditor) {
      contentEditor.innerHTML = '';
      if (topicContentEditor) {
        updatePlaceholder();
      }
    }
    loadCourse(); // Reload to show new topic
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Topic & Enhance Content';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Event delegation for Add Topic buttons (fallback if direct listeners don't work)
document.addEventListener('click', function(e) {
  // Check if clicked element is an "Add Topic" button or inside one
  const addTopicBtn = e.target.closest('button[data-module-id]');
  if (addTopicBtn && addTopicBtn.textContent.includes('Add Topic')) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Add Topic button clicked via event delegation!', addTopicBtn);
    
    const moduleId = addTopicBtn.getAttribute('data-module-id');
    const moduleIdInput = document.getElementById('topic-module-id');
    const modal = document.getElementById('add-topic-modal');
    
    if (!moduleIdInput || !modal) {
      console.error('Modal elements not found');
      return;
    }
    
    moduleIdInput.value = moduleId;
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    
    // Clear previous content
    const titleInput = document.getElementById('topic-title');
    if (titleInput) {
      titleInput.value = '';
    }
    
    const editor = document.getElementById('topic-content-editor');
    if (editor) {
      editor.innerHTML = '';
      if (!topicContentEditor) {
        initTopicContentEditor();
      } else {
        topicContentEditor = editor;
      }
      if (updatePlaceholder) {
        updatePlaceholder();
      }
    }
  }
}, true); // Use capture phase

// Load course on page load
loadCourse();


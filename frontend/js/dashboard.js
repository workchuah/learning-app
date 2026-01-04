// Dashboard functionality
requireAuth();

let courses = [];

async function loadCourses() {
  const loading = document.getElementById('loading');
  const container = document.getElementById('courses-container');
  const errorDiv = document.getElementById('error-message');
  
  loading.style.display = 'block';
  container.innerHTML = '';
  errorDiv.classList.add('hidden');
  
  try {
    courses = await api.getCourses();
    loading.style.display = 'none';
    
    if (courses.length === 0) {
      container.innerHTML = '<div class="card text-center" style="padding: 40px;"><p style="color: #64748b;">No courses yet. Create your first course to get started!</p></div>';
      return;
    }
    
    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      const courseTypeLabel = course.course_type === 'manual' ? '<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">Manual</span>' : '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">AI-Generated</span>';
      card.innerHTML = `
        <h3>${course.title} ${courseTypeLabel}</h3>
        ${course.goal ? `<p style="color: #64748b; margin-top: 8px;">${course.goal}</p>` : ''}
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #64748b;">${course.target_timeline ? `Estimated Timeline: ${course.target_timeline}` : course.course_type === 'manual' ? 'Manual Course' : 'Timeline: To be estimated'}</span>
          <span style="font-size: 14px; color: #64748b;">Progress: ${course.progress_percentage || 0}%</span>
        </div>
        <div style="margin-top: 16px;">
          <a href="course.html?id=${course._id}" class="btn btn-primary" style="text-decoration: none; display: inline-block;">View Course</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    loading.style.display = 'none';
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

// Modal handling
const modal = document.getElementById('create-course-modal');
const createBtn = document.getElementById('create-course-btn');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-course-btn');

createBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Toggle course type fields
document.getElementById('course-type').addEventListener('change', (e) => {
  const courseType = e.target.value;
  const goalGroup = document.getElementById('course-goal-group');
  const outlineGroup = document.getElementById('course-outline-group');
  const goalInput = document.getElementById('course-goal');
  
  if (courseType === 'manual') {
    goalGroup.style.display = 'none';
    outlineGroup.style.display = 'none';
    goalInput.removeAttribute('required');
  } else {
    goalGroup.style.display = 'block';
    outlineGroup.style.display = 'block';
    goalInput.setAttribute('required', 'required');
  }
});

// Create course form
document.getElementById('create-course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  const courseType = document.getElementById('course-type').value;
  const formData = new FormData();
  formData.append('title', document.getElementById('course-title').value);
  formData.append('course_type', courseType);
  
  // Only add goal and outline for AI-generated courses
  if (courseType === 'ai_generated') {
    formData.append('goal', document.getElementById('course-goal').value);
    const outlineFile = document.getElementById('course-outline').files[0];
    if (outlineFile) {
      formData.append('outline', outlineFile);
    }
  } else {
    // For manual courses, explicitly send empty goal to avoid validation issues
    formData.append('goal', '');
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    await api.createCourse(formData);
    successDiv.textContent = 'Course created successfully!';
    successDiv.classList.remove('hidden');
    modal.classList.add('hidden');
    form.reset();
    loadCourses();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Course';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Load courses on page load
loadCourses();


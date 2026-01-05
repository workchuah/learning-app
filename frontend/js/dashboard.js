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
      card.innerHTML = `
        <h3>${course.title}</h3>
        <p style="color: #64748b; margin-top: 8px;">${course.goal}</p>
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #64748b;">${course.target_timeline ? `Estimated Timeline: ${course.target_timeline}` : 'Timeline: To be estimated'}</span>
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

// Create course form
document.getElementById('create-course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  const formData = new FormData();
  formData.append('title', document.getElementById('course-title').value);
  formData.append('goal', document.getElementById('course-goal').value);
  // Timeline will be auto-estimated by AI during course structure generation
  
  const outlineFile = document.getElementById('course-outline').files[0];
  if (outlineFile) {
    formData.append('outline', outlineFile);
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


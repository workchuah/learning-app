// Load courses from backend
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const authenticated = await requireAuth();
    if (authenticated) {
        await loadCourses();
    }
});

async function loadCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    
    try {
        const response = await apiFetch('/courses');
        if (!response.ok) throw new Error('Failed to load courses');
        
        const courses = await response.json();
        
        // Load progress
        const progressResponse = await apiFetch('/progress');
        const progress = progressResponse.ok ? await progressResponse.json() : {};
        
        coursesGrid.innerHTML = '';
        
        if (courses.length === 0) {
            coursesGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1; padding: 3rem;">No courses yet. Create your first course to get started!</p>';
            return;
        }
        
        courses.forEach(course => {
            const courseCard = createCourseCard(course, progress);
            coursesGrid.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesGrid.innerHTML = '<p style="text-align: center; color: var(--danger-color); grid-column: 1 / -1; padding: 3rem;">Error loading courses. Make sure the backend server is running.</p>';
    }
}

function createCourseCard(course, progress) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    // Calculate progress
    let totalTopics = 0;
    let completedTopics = 0;
    
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
    
    const progressPercent = totalTopics > 0 
        ? Math.round((completedTopics / totalTopics) * 100) 
        : 0;
    
    card.innerHTML = `
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.description || 'No description')}</p>
        <div class="course-progress">
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">${progressPercent}% Complete (${completedTopics}/${totalTopics} topics)</div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.location.href = `course-detail.html?id=${course.id}`;
    });
    
    return card;
}

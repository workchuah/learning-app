document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const authenticated = await requireAuth();
    if (!authenticated) return;
    await loadProgress();
});

async function loadProgress() {
    try {
        const [coursesResponse, progressResponse] = await Promise.all([
            apiFetch('/courses'),
            apiFetch('/progress')
        ]);
        
        if (!coursesResponse.ok) throw new Error('Failed to load courses');
        
        const courses = await coursesResponse.json();
        const progress = progressResponse.ok ? await progressResponse.json() : {};
        
        updateStats(courses, progress);
        updateDetails(courses, progress);
    } catch (error) {
        console.error('Error loading progress:', error);
        document.getElementById('progress-details').innerHTML = 
            '<p style="text-align: center; color: var(--danger-color);">Error loading progress data.</p>';
    }
}

function updateStats(courses, progress) {
    let totalTopics = 0;
    let completedTopics = 0;
    
    courses.forEach(course => {
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
    });
    
    document.getElementById('total-courses').textContent = courses.length;
    document.getElementById('completed-topics').textContent = completedTopics;
    document.getElementById('total-progress').textContent = totalTopics > 0 
        ? `${Math.round((completedTopics / totalTopics) * 100)}%` 
        : '0%';
}

function updateDetails(courses, progress) {
    const detailsContainer = document.getElementById('progress-details');
    detailsContainer.innerHTML = '';
    
    if (courses.length === 0) {
        detailsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No courses yet.</p>';
        return;
    }
    
    courses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'progress-course-item';
        
        let courseCompleted = 0;
        let courseTotal = 0;
        
        if (course.modules) {
            course.modules.forEach((module, moduleIndex) => {
                if (module.topics) {
                    module.topics.forEach((topic, topicIndex) => {
                        courseTotal++;
                        const topicId = `${course.id}-${moduleIndex}-${topicIndex}`;
                        if (progress[topicId] && progress[topicId].status === 'completed') {
                            courseCompleted++;
                        }
                    });
                }
            });
        }
        
        const courseProgress = courseTotal > 0 ? Math.round((courseCompleted / courseTotal) * 100) : 0;
        
        courseItem.innerHTML = `
            <h4>${escapeHtml(course.name)}</h4>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${courseProgress}%"></div>
            </div>
            <p class="progress-text">${courseCompleted}/${courseTotal} topics completed (${courseProgress}%)</p>
        `;
        
        courseItem.addEventListener('click', () => {
            window.location.href = `course-detail.html?id=${course.id}`;
        });
        courseItem.style.cursor = 'pointer';
        
        detailsContainer.appendChild(courseItem);
    });
}

// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

let course = null;
let progress = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const authenticated = await requireAuth();
    if (!authenticated) return;
    if (!courseId) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadCourse();
    await loadProgress();
    renderModules();
});

async function loadCourse() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    try {
        const response = await apiFetch(`/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to load course');
        
        course = await response.json();
        
        document.getElementById('course-title').textContent = course.name;
        document.getElementById('course-description').textContent = course.description || '';
        
        // Generate structure if not exists
        if (!course.modules || course.modules.length === 0) {
            await generateStructure();
            await loadCourse(); // Reload
        }
    } catch (error) {
        console.error('Error loading course:', error);
        alert('Failed to load course');
        window.location.href = 'index.html';
    } finally {
        loading.style.display = 'none';
    }
}

async function generateStructure() {
    try {
        await apiFetch(`/courses/${courseId}/generate-structure`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error generating structure:', error);
    }
}

async function loadProgress() {
    try {
        const response = await apiFetch('/progress');
        if (response.ok) {
            progress = await response.json();
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function renderModules() {
    const container = document.getElementById('modules-container');
    container.innerHTML = '';
    
    if (!course.modules || course.modules.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No modules yet. Generating structure...</p>';
        return;
    }
    
    course.modules.forEach((module, moduleIndex) => {
        const moduleCard = createModuleCard(module, moduleIndex);
        container.appendChild(moduleCard);
    });
}

function createModuleCard(module, moduleIndex) {
    const card = document.createElement('div');
    card.className = 'module-card';

    const moduleHeader = document.createElement('div');
    moduleHeader.className = 'module-header';
    moduleHeader.innerHTML = `
        <h3>Module ${moduleIndex + 1}: ${escapeHtml(module.name)}</h3>
        <span class="module-toggle">▼</span>
    `;

    const topicsList = document.createElement('div');
    topicsList.className = 'topics-list';

    if (module.topics && module.topics.length > 0) {
        module.topics.forEach((topic, topicIndex) => {
            const topicItem = createTopicItem(topic, moduleIndex, topicIndex);
            topicsList.appendChild(topicItem);
        });
    }

    moduleHeader.addEventListener('click', () => {
        topicsList.classList.toggle('show');
        const toggle = moduleHeader.querySelector('.module-toggle');
        toggle.classList.toggle('expanded');
    });

    card.appendChild(moduleHeader);
    card.appendChild(topicsList);

    return card;
}

function createTopicItem(topic, moduleIndex, topicIndex) {
    const item = document.createElement('div');
    item.className = 'topic-item';
    
    const topicId = `${courseId}-${moduleIndex}-${topicIndex}`;
    const topicProgress = progress[topicId] || { status: 'not-started', progress: 0 };
    
    if (topicProgress.status === 'completed') {
        item.classList.add('completed');
    }

    item.innerHTML = `
        <span class="topic-name">${escapeHtml(topic.name)}</span>
        <div class="topic-status">
            <span class="status-badge ${topicProgress.status}">${topicProgress.status.replace('-', ' ')}</span>
        </div>
    `;

    item.addEventListener('click', () => {
        window.location.href = `topic-detail.html?courseId=${courseId}&moduleIndex=${moduleIndex}&topicIndex=${topicIndex}`;
    });

    return item;
}

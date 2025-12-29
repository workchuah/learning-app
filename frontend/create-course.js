document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
    document.getElementById('course-form').addEventListener('submit', handleSubmit);
});

function setupFileUpload() {
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('course-outline');
    const uploadContent = fileUploadArea.querySelector('.file-upload-content');
    const fileSelected = fileUploadArea.querySelector('.file-selected');
    const fileName = fileSelected.querySelector('.file-name');

    fileUploadArea.addEventListener('click', () => fileInput.click());
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary-color)';
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'var(--border-color)';
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    document.querySelector('.btn-remove-file').addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileUpload();
    });

    function handleFileSelect(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }
        fileName.textContent = file.name;
        uploadContent.style.display = 'none';
        fileSelected.style.display = 'flex';
    }

    function resetFileUpload() {
        fileInput.value = '';
        uploadContent.style.display = 'flex';
        fileSelected.style.display = 'none';
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseData = {
        name: formData.get('courseName'),
        description: formData.get('courseDescription') || ''
    };

    const file = formData.get('courseOutline');
    const loading = document.getElementById('loading');
    
    try {
        loading.style.display = 'block';
        
        const formDataToSend = new FormData();
        formDataToSend.append('name', courseData.name);
        formDataToSend.append('description', courseData.description);
        
        if (file && file.size > 0) {
            formDataToSend.append('outline', file);
        }

        const headers = getApiHeaders();
        // Remove Content-Type for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: headers,
            body: formDataToSend
        });

        if (!response.ok) throw new Error('Failed to create course');

        const course = await response.json();
        
        // Generate structure if no outline provided
        if (!file || file.size === 0) {
            await apiFetch(`/courses/${course.id}/generate-structure`, {
                method: 'POST'
            });
        }
        
        // Redirect to course detail
        window.location.href = `course-detail.html?id=${course.id}`;
    } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
}

// API Functions
const api = {
  // Helper function to get headers
  getHeaders: (includeAuth = true) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
    }
    
    return headers;
  },

  // Auth API
  login: async (userid, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userid, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || error.detail || 'Login failed');
    }
    
    return await response.json();
  },

  logout: async () => {
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: api.getHeaders(),
      });
    }
    clearAuth();
  },

  // Course API
  getCourses: async () => {
    const response = await fetch(`${API_BASE_URL}/courses/`, {
      method: 'GET',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to load courses');
    }
    
    return await response.json();
  },

  createCourse: async (formData) => {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/courses/`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create course');
    }
    
    return await response.json();
  },

  getCourse: async (id) => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'GET',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to load course');
    }
    
    return await response.json();
  },

  generateCourseStructure: async (courseId) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/generate-structure`, {
      method: 'POST',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate course structure');
    }
    
    return await response.json();
  },

  deleteCourse: async (courseId) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete course');
    }
    
    return await response.json();
  },

  // Topic API
  getTopic: async (id) => {
    const response = await fetch(`${API_BASE_URL}/topics/${id}`, {
      method: 'GET',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to load topic');
    }
    
    return await response.json();
  },

  generateTopicContent: async (topicId) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}/generate-content`, {
      method: 'POST',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate topic content');
    }
    
    return await response.json();
  },

  regenerateTopicSection: async (topicId, section) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}/regenerate/${section}`, {
      method: 'POST',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to regenerate ${section}`);
    }
    
    return await response.json();
  },

  updatePracticalTask: async (topicId, taskIndex, completed) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}/practical-task`, {
      method: 'PATCH',
      headers: api.getHeaders(),
      body: JSON.stringify({ taskIndex, completed }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    
    return await response.json();
  },

  // Progress API
  updateProgress: async (data) => {
    const response = await fetch(`${API_BASE_URL}/progress/`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    return await response.json();
  },

  getProgress: async (courseId, topicId) => {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (topicId) params.append('topic_id', topicId);
    
    const response = await fetch(`${API_BASE_URL}/progress/?${params}`, {
      method: 'GET',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to load progress');
    }
    
    return await response.json();
  },

  // Admin API
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'GET',
      headers: api.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to load settings');
    }
    
    return await response.json();
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: api.getHeaders(),
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }
    
    return await response.json();
  },
};

// Export to window for global access
window.api = api;


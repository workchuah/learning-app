// Common utilities and API configuration
// Load config.js first, then use API_BASE_URL from window object
const API_BASE_URL = window.API_BASE_URL || 'https://learning-app-9oo4.onrender.com/api';

// Authentication check function
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_BASE_URL}/check-auth`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        return data.authenticated === true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Redirect to login if not authenticated
async function requireAuth() {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userid');
        window.location.href = 'login.html';
    }
}

// Get API keys from localStorage
function getApiHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Get agent-specific API keys
    const agents = ['course_structure', 'lecture_notes', 'tutorial', 'practical', 'quiz'];
    
    agents.forEach(agent => {
        const provider = localStorage.getItem(`agent_${agent}_provider`) || 'openai';
        const apiKey = localStorage.getItem(`agent_${agent}_api_key`) || '';
        
        if (apiKey) {
            headers[`X-Agent-${agent}-Provider`] = provider;
            if (provider === 'openai') {
                headers[`X-Agent-${agent}-OpenAI-Key`] = apiKey;
            } else {
                headers[`X-Agent-${agent}-Gemini-Key`] = apiKey;
            }
        }
    });
    
    // Fallback to general API keys if no agent-specific keys
    const provider = localStorage.getItem('api_provider') || 'openai';
    const openaiKey = localStorage.getItem('openai_api_key') || '';
    const geminiKey = localStorage.getItem('gemini_api_key') || '';
    
    if (!headers['X-Agent-course_structure-Provider']) {
        headers['X-API-Provider'] = provider;
        if (openaiKey) headers['X-OpenAI-API-Key'] = openaiKey;
        if (geminiKey) headers['X-Gemini-API-Key'] = geminiKey;
    }
    
    return headers;
}

// Enhanced fetch with API keys
async function apiFetch(url, options = {}) {
    const headers = {
        ...getApiHeaders(),
        ...(options.headers || {})
    };
    
    // Remove Content-Type if FormData
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    return fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include'  // Important for session cookies
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

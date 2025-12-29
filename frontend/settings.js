// API Configuration - Use same logic as common.js
const API_BASE_URL = window.API_BASE_URL || 'https://learning-app-9oo4.onrender.com/api';

// Agent names mapping
const AGENT_NAMES = {
    course_structure: 'Course Structure Designer',
    lecture_notes: 'Lecture Notes Writer',
    tutorial: 'Tutorial Exercise Designer',
    practical: 'Practical Exercise Designer',
    quiz: 'Quiz Creator'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAllAgentSettings();
    setupEventListeners();
});

function setupEventListeners() {
    // Toggle visibility for all agent API keys
    document.querySelectorAll('.btn-toggle-visibility').forEach(btn => {
        btn.addEventListener('click', () => {
            const agent = btn.dataset.target;
            toggleVisibility(agent, btn);
        });
    });

    // Test buttons for each agent
    document.querySelectorAll('.test-agent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const agent = btn.dataset.agent;
            testAgentApiKey(agent);
        });
    });

    // Save all API keys
    document.getElementById('save-all-api-keys-btn').addEventListener('click', saveAllApiKeys);

    // Clear all API keys
    document.getElementById('clear-all-api-keys-btn').addEventListener('click', clearAllApiKeys);
}

function loadAllAgentSettings() {
    const agents = ['course_structure', 'lecture_notes', 'tutorial', 'practical', 'quiz'];
    
    agents.forEach(agent => {
        const provider = localStorage.getItem(`agent_${agent}_provider`) || 'openai';
        const apiKey = localStorage.getItem(`agent_${agent}_api_key`) || '';
        
        const providerSelect = document.querySelector(`.agent-provider[data-agent="${agent}"]`);
        const apiKeyInput = document.querySelector(`.agent-api-key[data-agent="${agent}"]`);
        
        if (providerSelect) providerSelect.value = provider;
        if (apiKeyInput) apiKeyInput.value = apiKey;
    });
}

function toggleVisibility(agent, btn) {
    const input = document.querySelector(`.agent-api-key[data-agent="${agent}"]`);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<span class="eye-icon">🙈</span>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<span class="eye-icon">👁️</span>';
    }
}

function getAgentConfig(agent) {
    const providerSelect = document.querySelector(`.agent-provider[data-agent="${agent}"]`);
    const apiKeyInput = document.querySelector(`.agent-api-key[data-agent="${agent}"]`);
    
    return {
        provider: providerSelect ? providerSelect.value : 'openai',
        apiKey: apiKeyInput ? apiKeyInput.value.trim() : ''
    };
}

function getAllAgentConfigs() {
    const agents = ['course_structure', 'lecture_notes', 'tutorial', 'practical', 'quiz'];
    const configs = {};
    
    agents.forEach(agent => {
        configs[agent] = getAgentConfig(agent);
    });
    
    return configs;
}

function validateApiKey(apiKey, provider) {
    if (!apiKey) {
        return { valid: false, error: 'API key is required' };
    }
    
    if (provider === 'openai') {
        if (!apiKey.startsWith('sk-')) {
            return { valid: false, error: 'Invalid OpenAI API key format. Keys should start with "sk-"' };
        }
    }
    
    return { valid: true };
}

async function testAgentApiKey(agent) {
    const config = getAgentConfig(agent);
    const testResult = document.querySelector(`.agent-test-result[data-agent="${agent}"]`);
    const testBtn = document.querySelector(`.test-agent-btn[data-agent="${agent}"]`);
    
    // Validate
    const validation = validateApiKey(config.apiKey, config.provider);
    if (!validation.valid) {
        showTestResult(agent, false, validation.error);
        return;
    }
    
    // Update button state
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/test-api-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: config.provider,
                api_key: config.apiKey
            })
        });
        
        const data = await response.json();
        
        if (data.valid) {
            showTestResult(agent, true, data.message || 'API key is valid and working!');
        } else {
            showTestResult(agent, false, data.error || 'API key test failed');
        }
    } catch (error) {
        showTestResult(agent, false, `Error: ${error.message}. Make sure the backend server is running.`);
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.textContent = 'Test';
        }
    }
}

function showTestResult(agent, success, message) {
    const testResult = document.querySelector(`.agent-test-result[data-agent="${agent}"]`);
    if (!testResult) return;
    
    testResult.style.display = 'block';
    testResult.className = `agent-test-result ${success ? 'success' : 'error'}`;
    testResult.textContent = `${success ? '✓' : '✗'} ${message}`;
}

async function saveAllApiKeys() {
    const configs = getAllAgentConfigs();
    const errors = [];
    
    // Validate all configs
    Object.keys(configs).forEach(agent => {
        const config = configs[agent];
        const validation = validateApiKey(config.apiKey, config.provider);
        
        if (!validation.valid) {
            errors.push(`${AGENT_NAMES[agent]}: ${validation.error}`);
        }
    });
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }
    
    // Save to localStorage
    Object.keys(configs).forEach(agent => {
        const config = configs[agent];
        localStorage.setItem(`agent_${agent}_provider`, config.provider);
        if (config.apiKey) {
            localStorage.setItem(`agent_${agent}_api_key`, config.apiKey);
        }
    });
    
    // Send to backend
    try {
        const response = await fetch(`${API_BASE_URL}/set-agent-api-keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agents: configs })
        });
        
        if (!response.ok) throw new Error('Failed to save API keys');
        
        alert('All API keys saved successfully!');
    } catch (error) {
        console.error('Error saving API keys:', error);
        alert('Error saving API keys. Make sure the backend server is running.');
    }
}

function clearAllApiKeys() {
    if (!confirm('Are you sure you want to clear all API keys for all agents?')) {
        return;
    }
    
    const agents = ['course_structure', 'lecture_notes', 'tutorial', 'practical', 'quiz'];
    
    agents.forEach(agent => {
        localStorage.removeItem(`agent_${agent}_provider`);
        localStorage.removeItem(`agent_${agent}_api_key`);
        
        const providerSelect = document.querySelector(`.agent-provider[data-agent="${agent}"]`);
        const apiKeyInput = document.querySelector(`.agent-api-key[data-agent="${agent}"]`);
        const testResult = document.querySelector(`.agent-test-result[data-agent="${agent}"]`);
        
        if (providerSelect) providerSelect.value = 'openai';
        if (apiKeyInput) apiKeyInput.value = '';
        if (testResult) {
            testResult.style.display = 'none';
            testResult.textContent = '';
        }
    });
    
    // Clear from backend
    fetch(`${API_BASE_URL}/clear-agent-api-keys`, {
        method: 'POST'
    }).catch(err => console.error('Error clearing API keys from backend:', err));
    
    alert('All API keys cleared');
}
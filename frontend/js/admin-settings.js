// Admin settings functionality
requireAuth();

async function loadSettings() {
  const errorDiv = document.getElementById('error-message');
  
  try {
    const settings = await api.getSettings();
    
    // Update model preferences
    document.getElementById('openai-model').value = settings.openai_model || 'gpt-4';
    document.getElementById('gemini-model').value = settings.gemini_model || 'gemini-pro';
    
    // Initialize originalProviders and configured status
    originalProviders = {};
    agentConfiguredStatus = {};
    
    // Initialize defaults for all agents
    ['cs', 'cg', 'te', 'pt', 'qz', 'ab'].forEach(prefix => {
      originalProviders[prefix] = 'openai';
      agentConfiguredStatus[prefix] = false;
    });
    
    // Update API key status and provider for each agent
    if (settings.api_keys) {
      // Course Structure Agent
      updateAgentUI('cs', settings.api_keys.course_structure_agent);
      // Content Generation Agent
      updateAgentUI('cg', settings.api_keys.content_generation_agent);
      // Tutorial Exercise Agent
      updateAgentUI('te', settings.api_keys.tutorial_exercise_agent);
      // Practical Task Agent
      updateAgentUI('pt', settings.api_keys.practical_task_agent);
      // Quiz Agent
      updateAgentUI('qz', settings.api_keys.quiz_agent);
      // Audiobook Agent
      updateAgentUI('ab', settings.api_keys.audiobook_agent);
    }
    
    // Keys are now loaded into input fields (masked as password type)
    // Users can toggle visibility with the eye icon
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

// Store original provider values and configured status to detect changes
let originalProviders = {};
let agentConfiguredStatus = {};

function updateAgentUI(prefix, agentData) {
  if (!agentData) {
    // Agent not configured yet
    agentConfiguredStatus[prefix] = false;
    originalProviders[prefix] = 'openai'; // default
    return;
  }
  
  // Update provider dropdown
  const providerSelect = document.getElementById(`${prefix}-provider`);
  if (providerSelect && agentData.provider) {
    providerSelect.value = agentData.provider;
    // Store original value
    originalProviders[prefix] = agentData.provider;
  } else {
    originalProviders[prefix] = 'openai'; // default
  }
  
  // Store configured status
  agentConfiguredStatus[prefix] = agentData.configured || false;
  
  // Update API key field with saved value (masked by default)
  const apiKeyInput = document.getElementById(`${prefix}-api-key`);
  if (apiKeyInput && agentData.api_key) {
    // Store the actual key value (for editing)
    apiKeyInput.value = agentData.api_key;
    // Keep it as password type (masked) by default
    apiKeyInput.type = 'password';
  }
  
  // Update status badge
  const statusBadge = document.getElementById(`${prefix}-status`);
  if (statusBadge) {
    statusBadge.textContent = agentData.configured ? '✓ Configured' : '✗ Not Configured';
    statusBadge.className = `status-badge ${agentData.configured ? 'status-success' : 'status-error'}`;
  }
}

// Save model settings
document.getElementById('save-models-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-models-btn');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const settings = {
      openai_model: document.getElementById('openai-model').value,
      gemini_model: document.getElementById('gemini-model').value,
    };
    
    await api.updateSettings(settings);
    successDiv.textContent = 'Model settings saved successfully!';
    successDiv.classList.remove('hidden');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Model Settings';
  }
});

// Save API Keys
document.getElementById('save-api-keys-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-api-keys-btn');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    // Get API keys from input fields - only include agents that have values
    const apiKeys = {};
    
    // Helper function to add agent if it has a value or provider changed
    const addAgentIfHasValue = (agentName, prefix) => {
      const apiKeyValue = document.getElementById(`${prefix}-api-key`).value.trim();
      const providerValue = document.getElementById(`${prefix}-provider`).value;
      const originalProvider = originalProviders[prefix] || 'openai';
      const isConfigured = agentConfiguredStatus[prefix] || false;
      
      // Include if:
      // 1. api_key has a value (user is setting/updating it), OR
      // 2. agent is already configured AND provider changed (update provider only)
      const providerChanged = providerValue !== originalProvider;
      
      if (apiKeyValue) {
        // User is providing/updating API key
        apiKeys[agentName] = {
          provider: providerValue,
          api_key: apiKeyValue,
        };
      } else if (isConfigured && providerChanged) {
        // Agent is configured, provider changed, but no new API key
        // Only update provider, keep existing API key
        apiKeys[agentName] = {
          provider: providerValue,
          // Don't include api_key - backend will keep existing value
        };
      }
      // If api_key is empty and provider didn't change, don't include (preserve everything)
    };
    
    // Only add agents that have API key values
    addAgentIfHasValue('course_structure_agent', 'cs');
    addAgentIfHasValue('content_generation_agent', 'cg');
    addAgentIfHasValue('tutorial_exercise_agent', 'te');
    addAgentIfHasValue('practical_task_agent', 'pt');
    addAgentIfHasValue('quiz_agent', 'qz');
    addAgentIfHasValue('audiobook_agent', 'ab');
    
    // Only send if there are keys to update
    if (Object.keys(apiKeys).length === 0) {
      errorDiv.textContent = 'Please enter at least one API key to save.';
      errorDiv.classList.remove('hidden');
      return;
    }
    
    // Update settings with API keys (only the ones with values)
    const settings = {
      api_keys: apiKeys,
    };
    
    await api.updateSettings(settings);
    successDiv.textContent = `API keys saved successfully! (${Object.keys(apiKeys).length} agent(s) updated)`;
    successDiv.classList.remove('hidden');
    
    // Clear only the input fields that were saved
    Object.keys(apiKeys).forEach(agentName => {
      const prefixMap = {
        'course_structure_agent': 'cs',
        'content_generation_agent': 'cg',
        'tutorial_exercise_agent': 'te',
        'practical_task_agent': 'pt',
        'quiz_agent': 'qz',
        'audiobook_agent': 'ab'
      };
      const prefix = prefixMap[agentName];
      if (prefix) {
        document.getElementById(`${prefix}-api-key`).value = '';
      }
    });
    
    // Reload settings to update status badges
    loadSettings();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save All API Keys';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Toggle API key visibility
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('toggle-key-btn') || e.target.closest('.toggle-key-btn')) {
    const btn = e.target.classList.contains('toggle-key-btn') ? e.target : e.target.closest('.toggle-key-btn');
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }
  }
});

// Load settings on page load
loadSettings();

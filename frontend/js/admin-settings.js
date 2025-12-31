// Admin settings functionality
requireAuth();

async function loadSettings() {
  const errorDiv = document.getElementById('error-message');
  
  try {
    const settings = await api.getSettings();
    
    // Update model preferences
    document.getElementById('openai-model').value = settings.openai_model || 'gpt-4';
    document.getElementById('gemini-model').value = settings.gemini_model || 'gemini-pro';
    
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
    }
    
    // Clear all input fields (never show existing keys for security)
    ['cs', 'cg', 'te', 'pt', 'qz'].forEach(prefix => {
      document.getElementById(`${prefix}-api-key`).value = '';
    });
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

function updateAgentUI(prefix, agentData) {
  if (!agentData) return;
  
  // Update provider dropdown
  const providerSelect = document.getElementById(`${prefix}-provider`);
  if (providerSelect && agentData.provider) {
    providerSelect.value = agentData.provider;
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
    // Get API keys from input fields for each agent
    const apiKeys = {
      course_structure_agent: {
        provider: document.getElementById('cs-provider').value,
        api_key: document.getElementById('cs-api-key').value.trim(),
      },
      content_generation_agent: {
        provider: document.getElementById('cg-provider').value,
        api_key: document.getElementById('cg-api-key').value.trim(),
      },
      tutorial_exercise_agent: {
        provider: document.getElementById('te-provider').value,
        api_key: document.getElementById('te-api-key').value.trim(),
      },
      practical_task_agent: {
        provider: document.getElementById('pt-provider').value,
        api_key: document.getElementById('pt-api-key').value.trim(),
      },
      quiz_agent: {
        provider: document.getElementById('qz-provider').value,
        api_key: document.getElementById('qz-api-key').value.trim(),
      },
    };
    
    // Update settings with API keys
    const settings = {
      api_keys: apiKeys,
    };
    
    await api.updateSettings(settings);
    successDiv.textContent = 'API keys saved successfully!';
    successDiv.classList.remove('hidden');
    
    // Clear input fields after saving
    ['cs', 'cg', 'te', 'pt', 'qz'].forEach(prefix => {
      document.getElementById(`${prefix}-api-key`).value = '';
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

// Load settings on page load
loadSettings();

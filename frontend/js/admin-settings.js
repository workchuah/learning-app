// Admin settings functionality
requireAuth();

// Store API keys temporarily in memory (never in localStorage for security)
let tempApiKeys = {
  course_structure_agent: { openai_key: '', gemini_key: '' },
  content_generation_agent: { openai_key: '', gemini_key: '' }
};

async function loadSettings() {
  const errorDiv = document.getElementById('error-message');
  
  try {
    const settings = await api.getSettings();
    
    // Update global status badges
    document.getElementById('openai-status').textContent = settings.openai_configured ? '✓ Configured' : '✗ Not Configured';
    document.getElementById('openai-status').className = `status-badge ${settings.openai_configured ? 'status-success' : 'status-error'}`;
    
    document.getElementById('gemini-status').textContent = settings.gemini_configured ? '✓ Configured' : '✗ Not Configured';
    document.getElementById('gemini-status').className = `status-badge ${settings.gemini_configured ? 'status-success' : 'status-error'}`;
    
    // Update form values
    document.getElementById('ai-provider').value = settings.ai_provider_preference || 'auto';
    document.getElementById('openai-model').value = settings.openai_model || 'gpt-4';
    document.getElementById('gemini-model').value = settings.gemini_model || 'gemini-pro';
    
    // Update API key status badges (never show actual keys)
    if (settings.api_keys) {
      // Course Structure Agent
      const csStatus = settings.api_keys.course_structure_agent || {};
      document.getElementById('cs-openai-status').textContent = csStatus.openai_configured ? '✓ Configured' : '✗ Not Configured';
      document.getElementById('cs-openai-status').className = `status-badge ${csStatus.openai_configured ? 'status-success' : 'status-error'}`;
      
      document.getElementById('cs-gemini-status').textContent = csStatus.gemini_configured ? '✓ Configured' : '✗ Not Configured';
      document.getElementById('cs-gemini-status').className = `status-badge ${csStatus.gemini_configured ? 'status-success' : 'status-error'}`;
      
      // Content Generation Agent
      const cgStatus = settings.api_keys.content_generation_agent || {};
      document.getElementById('cg-openai-status').textContent = cgStatus.openai_configured ? '✓ Configured' : '✗ Not Configured';
      document.getElementById('cg-openai-status').className = `status-badge ${cgStatus.openai_configured ? 'status-success' : 'status-error'}`;
      
      document.getElementById('cg-gemini-status').textContent = cgStatus.gemini_configured ? '✓ Configured' : '✗ Not Configured';
      document.getElementById('cg-gemini-status').className = `status-badge ${cgStatus.gemini_configured ? 'status-success' : 'status-error'}`;
    }
    
    // Clear input fields (never show existing keys for security)
    document.getElementById('cs-openai-key').value = '';
    document.getElementById('cs-gemini-key').value = '';
    document.getElementById('cg-openai-key').value = '';
    document.getElementById('cg-gemini-key').value = '';
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  }
}

// Save settings
document.getElementById('save-settings-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-settings-btn');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  try {
    const settings = {
      ai_provider_preference: document.getElementById('ai-provider').value,
      openai_model: document.getElementById('openai-model').value,
      gemini_model: document.getElementById('gemini-model').value,
    };
    
    await api.updateSettings(settings);
    successDiv.textContent = 'Settings saved successfully!';
    successDiv.classList.remove('hidden');
    
    // Reload settings to get updated status
    loadSettings();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Settings';
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
    // Get API keys from input fields
    const apiKeys = {
      course_structure_agent: {
        openai_key: document.getElementById('cs-openai-key').value.trim(),
        gemini_key: document.getElementById('cs-gemini-key').value.trim(),
      },
      content_generation_agent: {
        openai_key: document.getElementById('cg-openai-key').value.trim(),
        gemini_key: document.getElementById('cg-gemini-key').value.trim(),
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
    document.getElementById('cs-openai-key').value = '';
    document.getElementById('cs-gemini-key').value = '';
    document.getElementById('cg-openai-key').value = '';
    document.getElementById('cg-gemini-key').value = '';
    
    // Reload settings to update status badges
    loadSettings();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save API Keys';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Load settings on page load
loadSettings();


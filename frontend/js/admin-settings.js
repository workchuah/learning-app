// Admin settings functionality
requireAuth();

async function loadSettings() {
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error-message');
  
  try {
    const settings = await api.getSettings();
    
    // Update status badges
    document.getElementById('openai-status').textContent = settings.openai_configured ? '✓ Configured' : '✗ Not Configured';
    document.getElementById('openai-status').className = `status-badge ${settings.openai_configured ? 'status-success' : 'status-error'}`;
    
    document.getElementById('gemini-status').textContent = settings.gemini_configured ? '✓ Configured' : '✗ Not Configured';
    document.getElementById('gemini-status').className = `status-badge ${settings.gemini_configured ? 'status-success' : 'status-error'}`;
    
    // Update form values
    document.getElementById('ai-provider').value = settings.ai_provider_preference || 'auto';
    document.getElementById('openai-model').value = settings.openai_model || 'gpt-4';
    document.getElementById('gemini-model').value = settings.gemini_model || 'gemini-pro';
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

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Load settings on page load
loadSettings();


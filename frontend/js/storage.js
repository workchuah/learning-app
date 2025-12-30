// Storage utilities
function setAuthToken(token, remember = false) {
  if (remember) {
    localStorage.setItem('auth_token', token);
  } else {
    sessionStorage.setItem('auth_token', token);
  }
}

function getAuthToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('learning_app_user');
}

// Export to window
window.setAuthToken = setAuthToken;
window.getAuthToken = getAuthToken;
window.clearAuth = clearAuth;


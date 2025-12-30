// Auth utilities
function checkAuth() {
  const token = getAuthToken();
  const user = localStorage.getItem('learning_app_user');
  return !!(token && user);
}

function requireAuth() {
  if (!checkAuth()) {
    window.location.href = 'login.html';
  }
}

// Export to window
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;


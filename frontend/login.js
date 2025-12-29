// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'https://learning-app-9oo4.onrender.com/api';

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Redirect to dashboard
        window.location.href = 'index.html';
        return;
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Toggle password visibility
    document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '<span class="eye-icon">🙈</span>';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '<span class="eye-icon">👁️</span>';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const userid = document.getElementById('userid').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important for cookies/sessions
            body: JSON.stringify({
                userid: userid,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Login successful
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userid', userid);
            
            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            // Login failed
            errorDiv.textContent = data.error || 'Invalid user ID or password';
            errorDiv.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Connection error. Please check if the backend server is running.';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

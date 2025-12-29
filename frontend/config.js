// API Configuration
// This file can be customized per environment
// For production, Netlify can inject environment variables here

// Detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// API Base URL - can be overridden by Netlify environment variable
window.API_BASE_URL = window.API_BASE_URL || 
    (isLocalhost 
        ? 'http://localhost:5000/api' 
        : 'https://your-backend.onrender.com/api'); // Replace with your Render URL

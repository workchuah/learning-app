// keepalive.js
// Periodically ping the backend to keep the Render service warm.

// Uses the same API_BASE_URL as the rest of the frontend
const KEEPALIVE_API_BASE_URL = window.API_BASE_URL || 'https://learning-app-9oo4.onrender.com/api';

// Interval in milliseconds (e.g. 10 minutes)
const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;

async function pingBackend() {
    try {
        const response = await fetch(`${KEEPALIVE_API_BASE_URL}/health`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.warn('Keepalive: backend health check failed with status', response.status);
            return;
        }

        const data = await response.json().catch(() => ({}));
        console.log('Keepalive: backend is alive', data);
    } catch (error) {
        console.warn('Keepalive: error pinging backend', error);
    }
}

// Start keepalive when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initial ping shortly after load
    setTimeout(pingBackend, 5000);

    // Periodic pings
    setInterval(pingBackend, KEEPALIVE_INTERVAL_MS);
});



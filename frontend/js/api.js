/**
 * CESS Dynamics — API Configuration Module
 * 
 * Provides a centralized API base URL and helper functions.
 * When served from the backend (same origin), API_BASE is empty (relative URLs).
 * When opened as a local file, falls back to http://localhost:5001.
 */

const API_BASE = (function () {
  // If served by the backend (HTTP), use same-origin relative paths
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return '';
  }
  // Opened as a file:// — point to the running backend
  return 'http://localhost:5001';
})();

/**
 * Wrapper around fetch that automatically prepends the API base URL
 * and attaches the auth token if present.
 */
async function apiFetch(endpoint, options = {}) {
  const url = API_BASE + endpoint;

  // Inject auth header if token exists and not already set
  const token = localStorage.getItem('token');
  if (token && !options.headers?.['Authorization']) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  const response = await fetch(url, options);

  // If we get a 401, the token is expired — clear auth state
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
  }

  return response;
}

/**
 * Check if the user is currently authenticated.
 * Returns the user object or null.
 */
function getAuthUser() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear auth state and redirect to login.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

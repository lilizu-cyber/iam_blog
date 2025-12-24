/**
 * Get the API base URL from environment variables
 * Handles both absolute URLs (production) and relative paths (development)
 */
export function getApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  // Remove trailing slash if present
  return apiUrl.replace(/\/$/, '')
}

/**
 * Build a full API endpoint URL
 * @param {string} endpoint - API endpoint (e.g., '/auth/me' or 'auth/me')
 * @returns {string} Full URL
 */
export function buildApiUrl(endpoint) {
  const baseUrl = getApiUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // If baseUrl is absolute (starts with http), use it directly
  if (baseUrl.startsWith('http')) {
    return `${baseUrl}${cleanEndpoint}`
  }
  
  // If baseUrl is relative, combine them
  return `${baseUrl}${cleanEndpoint}`
}




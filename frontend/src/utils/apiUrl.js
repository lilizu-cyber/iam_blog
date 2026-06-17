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
 * Base URL for uploaded files (images, PDFs).
 * In production this is the backend origin from VITE_API_URL.
 * In local dev it stays empty so /uploads can be proxied by Vite.
 */
export function getUploadsBaseUrl() {
  if (import.meta.env.VITE_UPLOADS_URL) {
    return import.meta.env.VITE_UPLOADS_URL.replace(/\/$/, '')
  }

  const apiUrl = getApiUrl()
  if (apiUrl.startsWith('http')) {
    return new URL(apiUrl).origin
  }

  return ''
}

/**
 * Turn a stored upload path into a browser-loadable URL.
 */
export function resolveUploadUrl(path) {
  if (!path || typeof path !== 'string') return path
  if (/^(https?:\/\/|blob:|data:)/i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const uploadsBase = getUploadsBaseUrl()

  return uploadsBase ? `${uploadsBase}${normalizedPath}` : normalizedPath
}

/**
 * Resolve /uploads/... paths inside stored HTML before rendering.
 */
export function resolveContentUploadUrls(html) {
  if (!html || typeof html !== 'string') return html

  return html
    .replace(
      /(<img\b[^>]*\bsrc=")(\/uploads\/[^"]+)(")/gi,
      (_, prefix, uploadPath, suffix) => `${prefix}${resolveUploadUrl(uploadPath)}${suffix}`
    )
    .replace(
      /(<a\b[^>]*\bhref=")(\/uploads\/[^"]+)(")/gi,
      (_, prefix, uploadPath, suffix) => `${prefix}${resolveUploadUrl(uploadPath)}${suffix}`
    )
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




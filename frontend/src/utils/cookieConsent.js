/**
 * Cookie Consent Utilities
 * Manages cookie consent preferences and checks
 */

const COOKIE_CONSENT_KEY = 'cookie-consent'

/**
 * Get current cookie consent preferences
 * @returns {Object|null} Consent preferences or null if not set
 */
export function getCookieConsent() {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) return null
    
    const consentData = JSON.parse(consent)
    
    // Check if consent has expired (older than 1 year)
    if (consentData.timestamp) {
      const consentDate = new Date(consentData.timestamp)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      if (consentDate < oneYearAgo) {
        // Consent expired, remove it
        localStorage.removeItem(COOKIE_CONSENT_KEY)
        return null
      }
    }
    
    return consentData
  } catch (error) {
    console.error('Error reading cookie consent:', error)
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    return null
  }
}

/**
 * Check if user has consented to a specific cookie category
 * @param {string} category - 'essential', 'analytics', or 'preferences'
 * @returns {boolean}
 */
export function hasConsent(category) {
  const consent = getCookieConsent()
  if (!consent) return false
  
  // Essential cookies are always allowed
  if (category === 'essential') return true
  
  return consent[category] === true
}

/**
 * Check if analytics cookies are allowed
 * @returns {boolean}
 */
export function canUseAnalytics() {
  return hasConsent('analytics')
}

/**
 * Check if preference cookies are allowed
 * @returns {boolean}
 */
export function canUsePreferences() {
  return hasConsent('preferences')
}

/**
 * Clear cookie consent (for testing or user request)
 */
export function clearCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY)
}

/**
 * Re-open the cookie preferences banner
 */
export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('openCookiePreferences'))
  }
}


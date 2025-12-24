/**
 * Analytics Service
 * Handles page views, events, and user engagement tracking
 * Only tracks if user has given consent for analytics cookies
 */

import { canUseAnalytics } from '../utils/cookieConsent'
import { analyticsApi } from './api'

// Track if analytics has been initialized
let analyticsInitialized = false
let pendingEvents = []

/**
 * Initialize analytics (only if consent is given)
 */
export function initializeAnalytics() {
  if (analyticsInitialized) return
  
  const hasConsent = canUseAnalytics()
  if (!hasConsent) {
    console.log('[Analytics] User has not consented to analytics cookies')
    return
  }
  
  analyticsInitialized = true
  console.log('[Analytics] Initialized')
  
  // Process any pending events
  if (pendingEvents.length > 0) {
    pendingEvents.forEach(event => {
      if (event.type === 'pageview') {
        trackPageView(event.data)
      } else if (event.type === 'engagement') {
        trackEngagement(event.data)
      }
    })
    pendingEvents = []
  }
  
  // Track initial page view
  trackPageView({
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer
  })
}

/**
 * Track a page view
 * @param {Object} data - Page view data
 */
export function trackPageView(data = {}) {
  if (!canUseAnalytics()) {
    // Queue event if consent not yet given
    pendingEvents.push({ type: 'pageview', data })
    return
  }
  
  const pageViewData = {
    path: data.path || window.location.pathname,
    title: data.title || document.title,
    referrer: data.referrer || document.referrer,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language
  }
  
  // Send to backend (fire and forget)
  analyticsApi.trackPageView(pageViewData).catch(error => {
    console.warn('[Analytics] Failed to track page view:', error)
  })
}

/**
 * Track user engagement event
 * @param {string} action - Action name (e.g., 'click', 'scroll', 'share')
 * @param {Object} data - Additional event data
 */
export function trackEngagement(action, data = {}) {
  if (!canUseAnalytics()) {
    // Queue event if consent not yet given
    pendingEvents.push({ type: 'engagement', data: { action, ...data } })
    return
  }
  
  const engagementData = {
    action,
    ...data,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  }
  
  // Send to backend (fire and forget)
  analyticsApi.trackEngagement(engagementData).catch(error => {
    console.warn('[Analytics] Failed to track engagement:', error)
  })
}

/**
 * Track specific events
 */
export const trackEvents = {
  // Blog post interactions
  postView: (postId, postTitle) => {
    trackEngagement('post_view', { postId, postTitle })
  },
  
  postShare: (postId, platform) => {
    trackEngagement('post_share', { postId, platform })
  },
  
  postRead: (postId, readingTime) => {
    trackEngagement('post_read', { postId, readingTime })
  },
  
  // Navigation
  search: (query, resultsCount) => {
    trackEngagement('search', { query, resultsCount })
  },
  
  categoryClick: (categoryId, categoryName) => {
    trackEngagement('category_click', { categoryId, categoryName })
  },
  
  tagClick: (tag) => {
    trackEngagement('tag_click', { tag })
  },
  
  // Newsletter
  newsletterSubscribe: (email) => {
    trackEngagement('newsletter_subscribe', { email })
  },
  
  // Contact
  contactFormSubmit: () => {
    trackEngagement('contact_form_submit')
  }
}

// Listen for cookie consent events (only in browser)
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('cookieConsentGiven', (event) => {
      if (event.detail?.analytics) {
        initializeAnalytics()
      }
    })
    
    // Initialize on load if consent already given
    if (canUseAnalytics()) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAnalytics)
      } else {
        initializeAnalytics()
      }
    }
  } catch (error) {
    console.warn('[Analytics] Error initializing:', error)
  }
}


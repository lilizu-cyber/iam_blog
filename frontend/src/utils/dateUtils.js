import { formatDistanceToNow, format } from 'date-fns'

/** Prefer publish time, fall back to created time for display. */
export function getPostDisplayDate(timestamps) {
  if (!timestamps) return null
  return timestamps.publishedAt || timestamps.createdAt || null
}

/**
 * Safely formats a date as relative time (e.g., "2 days ago")
 * Returns "Just now" if date is null, invalid, or in the future
 */
export function formatRelativeTime(date) {
  if (!date) {
    return 'Just now'
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Just now'
    }
    
    // Check if date is in the future (shouldn't happen, but handle gracefully)
    const now = new Date()
    if (dateObj > now) {
      return 'Just now'
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    console.warn('Error formatting relative time:', error)
    return 'Just now'
  }
}

/**
 * Safely formats a date as absolute time (e.g., "January 15, 2024")
 * Returns empty string if date is null or invalid
 */
export function formatAbsoluteTime(date, formatStr = 'MMMM d, yyyy') {
  if (!date) {
    return ''
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return ''
    }
    
    return format(dateObj, formatStr)
  } catch (error) {
    console.warn('Error formatting absolute time:', error)
    return ''
  }
}



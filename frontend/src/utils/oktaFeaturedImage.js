/**
 * Utility functions for automatically assigning Okta featured image
 * to posts that mention "Okta"
 */

// Okta featured image configuration
export const OKTA_FEATURED_IMAGE = {
  url: '/images/okta-featured-image.png',
  alt: 'Okta Identity and Access Management Platform',
  width: 1200,
  height: 630
};

/**
 * Check if text mentions Okta (case-insensitive)
 * @param {string} text - Text to check
 * @returns {boolean} - True if Okta is mentioned
 */
export function mentionsOkta(text) {
  if (!text || typeof text !== 'string') return false;
  const oktaKeywords = ['okta', 'Okta', 'OKTA'];
  const lowerText = text.toLowerCase();
  return oktaKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Check if a post mentions Okta in title, content, excerpt, or tags
 * @param {Object} postData - Post data object
 * @returns {boolean} - True if Okta is mentioned
 */
export function postMentionsOkta(postData) {
  const { title = '', content = '', excerpt = '', tags = [] } = postData;
  
  // Check title
  if (mentionsOkta(title)) return true;
  
  // Check excerpt
  if (mentionsOkta(excerpt)) return true;
  
  // Check content (strip HTML tags first)
  const plainContent = content.replace(/<[^>]*>/g, '');
  if (mentionsOkta(plainContent)) return true;
  
  // Check tags
  const tagsString = Array.isArray(tags) ? tags.join(' ') : tags;
  if (mentionsOkta(tagsString)) return true;
  
  return false;
}

/**
 * Get featured image for a post, automatically assigning Okta image if Okta is mentioned
 * @param {Object} postData - Post data object
 * @param {Object} currentFeaturedImage - Current featured image (if any)
 * @returns {Object|null} - Featured image object or null
 */
export function getFeaturedImageForPost(postData, currentFeaturedImage = null) {
  // If post mentions Okta and doesn't have a featured image, use Okta image
  if (postMentionsOkta(postData) && !currentFeaturedImage) {
    return OKTA_FEATURED_IMAGE;
  }
  
  // Otherwise, return current featured image (or null)
  return currentFeaturedImage || null;
}


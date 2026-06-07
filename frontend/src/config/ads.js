/**
 * Google AdSense configuration.
 * Components render nothing until client ID and slot IDs are set in env.
 *
 * Vercel / .env:
 *   VITE_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
 *   VITE_ADSENSE_SLOT_BLOG_LIST=1234567890
 *   VITE_ADSENSE_SLOT_BLOG_POST_SIDEBAR=1234567891
 *   VITE_ADSENSE_SLOT_BLOG_POST_IN_ARTICLE=1234567892
 */
export const adsConfig = {
  clientId: import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || '',
  slots: {
    blogListBanner: import.meta.env.VITE_ADSENSE_SLOT_BLOG_LIST || '',
    blogPostSidebar: import.meta.env.VITE_ADSENSE_SLOT_BLOG_POST_SIDEBAR || '',
    blogPostInArticle: import.meta.env.VITE_ADSENSE_SLOT_BLOG_POST_IN_ARTICLE || '',
  },
}

export function isAdSenseConfigured() {
  return Boolean(adsConfig.clientId)
}

export function hasAdSlot(slotKey) {
  return Boolean(adsConfig.clientId && adsConfig.slots[slotKey])
}

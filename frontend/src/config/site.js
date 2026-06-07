/** Public site identity — keep in sync with src/backend/config/site.js */
export const siteConfig = {
  siteName: import.meta.env.VITE_SITE_NAME || 'cyberiam',
  authorName: import.meta.env.VITE_SITE_AUTHOR_NAME || 'Ilirijana Zuka',
  authorFirstName: import.meta.env.VITE_SITE_AUTHOR_FIRST_NAME || 'Ilirijana',
  authorEmail: import.meta.env.VITE_SITE_AUTHOR_EMAIL || 'admin@example.com',
}

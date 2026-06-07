/**
 * Public site identity — used for author bylines, About page, and legal pages.
 * Override via environment variables in production.
 */
module.exports = {
  siteName: process.env.SITE_NAME || 'cyberiam',
  authorName: process.env.SITE_AUTHOR_NAME || 'Ilirijana Zuka',
  authorFirstName: process.env.SITE_AUTHOR_FIRST_NAME || 'Ilirijana',
  authorEmail: process.env.SITE_AUTHOR_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com',
};

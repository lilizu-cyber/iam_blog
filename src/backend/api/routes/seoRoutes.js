const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

module.exports = (readModelStore) => {
  // Generate sitemap.xml
  router.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
      const today = new Date().toISOString().split('T')[0];

      const staticPages = [
        { path: '/', changefreq: 'daily', priority: '1.0' },
        { path: '/blog', changefreq: 'daily', priority: '0.9' },
        { path: '/security', changefreq: 'weekly', priority: '0.8' },
        { path: '/iam', changefreq: 'weekly', priority: '0.8' },
        { path: '/about', changefreq: 'monthly', priority: '0.7' },
        { path: '/contact', changefreq: 'monthly', priority: '0.6' },
        { path: '/privacy', changefreq: 'yearly', priority: '0.5' },
        { path: '/terms', changefreq: 'yearly', priority: '0.5' },
        { path: '/cookies', changefreq: 'yearly', priority: '0.5' },
        { path: '/disclaimer', changefreq: 'yearly', priority: '0.5' },
      ];
      
      // Get all published posts
      const posts = await readModelStore.find('BlogPost', { 
        status: 'published' 
      }, {
        sort: { publishedAt: -1 },
        limit: 10000 // Get all posts
      });

      // Generate sitemap XML
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

      staticPages.forEach(({ path, changefreq, priority }) => {
        sitemap += `  <url>
    <loc>${baseUrl}${path === '/' ? '' : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      });

      sitemap += `
  <!-- Blog Posts -->
`;

      // Add each blog post
      posts.forEach(post => {
        const lastmod = post.updatedAt || post.publishedAt || post.createdAt;
        const lastmodDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        sitemap += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        // Add featured image if available
        if (post.featuredImage && post.featuredImage.url) {
          sitemap += `
    <image:image>
      <image:loc>${post.featuredImage.url}</image:loc>
      <image:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
      ${post.featuredImage.alt ? `<image:caption>${post.featuredImage.alt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:caption>` : ''}
    </image:image>`;
        }

        sitemap += `
  </url>
`;
      });

      sitemap += `</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
      
      logger.debug('Sitemap generated', { 
        postCount: posts.length,
        baseUrl 
      });
    } catch (error) {
      logger.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Generate robots.txt
  router.get('/robots.txt', (req, res) => {
    try {
      const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
      
      const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /api-docs/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for bots (optional, adjust as needed)
Crawl-delay: 1

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Block bad bots (optional)
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
`;

      res.set('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      logger.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });

  return router;
};


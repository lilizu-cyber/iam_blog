/**
 * Security Headers Configuration
 * 
 * Comprehensive security headers configuration using Helmet.js
 * with production-ready Content Security Policy (CSP)
 */

const logger = require('../utils/logger');

/**
 * Get Content Security Policy directives based on environment
 */
function getCSPDirectives() {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  // Base directives for all environments
  const baseDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    upgradeInsecureRequests: isProduction ? [] : null, // Only in production
  };

  // Script sources
  if (isProduction) {
    // Production: Strict - no unsafe-inline or unsafe-eval
    baseDirectives.scriptSrc = [
      "'self'",
      // Add any trusted CDNs here if needed (e.g., for analytics)
    ];
  } else {
    // Development: Allow unsafe-inline and unsafe-eval for Vite HMR
    baseDirectives.scriptSrc = [
      "'self'",
      "'unsafe-inline'", // Required for Vite HMR
      "'unsafe-eval'", // Required for Vite HMR
    ];
  }

  // Style sources
  baseDirectives.styleSrc = [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and inline styles
    'https://fonts.googleapis.com', // Google Fonts CSS
  ];

  // Font sources
  baseDirectives.fontSrc = [
    "'self'",
    'https://fonts.gstatic.com', // Google Fonts
    'data:', // For data URIs (e.g., embedded fonts)
  ];

  // Image sources
  baseDirectives.imgSrc = [
    "'self'",
    'data:', // For data URIs (e.g., base64 images)
    'https:', // For external images (blog post images, etc.)
    'blob:', // For blob URLs (image uploads)
  ];

  // Connect sources (API calls, WebSockets, etc.)
  const connectSources = ["'self'"];
  
  if (!isProduction) {
    // Development: Allow localhost connections
    connectSources.push('http://localhost:3000');
    connectSources.push('http://localhost:3001');
    connectSources.push('ws://localhost:3000'); // WebSocket for Vite HMR
    connectSources.push('ws://localhost:3001');
  } else {
    // Production: Only allow frontend and backend URLs
    if (frontendUrl) {
      connectSources.push(frontendUrl);
      // Add WebSocket version if needed
      const wsUrl = frontendUrl.replace(/^http/, 'ws');
      connectSources.push(wsUrl);
    }
    if (backendUrl) {
      connectSources.push(backendUrl);
      const wsUrl = backendUrl.replace(/^http/, 'ws');
      connectSources.push(wsUrl);
    }
  }
  
  baseDirectives.connectSrc = connectSources;

  // Media sources (for video/audio if needed)
  baseDirectives.mediaSrc = ["'self'", 'https:'];

  // Object sources (for plugins like Flash, if needed)
  baseDirectives.objectSrc = ["'none'"];

  // Worker sources (for service workers, web workers)
  baseDirectives.workerSrc = ["'self'", 'blob:'];

  // Frame sources (for iframes)
  baseDirectives.frameSrc = ["'none'"];

  // Manifest source (for web app manifest)
  baseDirectives.manifestSrc = ["'self'"];

  // Remove null values (Helmet doesn't like them)
  Object.keys(baseDirectives).forEach(key => {
    if (baseDirectives[key] === null) {
      delete baseDirectives[key];
    }
  });

  return baseDirectives;
}

/**
 * Get Helmet configuration
 */
function getHelmetConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const config = {
    // Content Security Policy
    contentSecurityPolicy: {
      useDefaults: true,
      directives: getCSPDirectives(),
      reportOnly: false, // Set to true to test CSP without blocking
    },
    
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: false, // Disable DNS prefetching for security
    },
    
    // X-Frame-Options
    frameguard: {
      action: 'sameorigin', // Prevent clickjacking
    },
    
    // X-Powered-By
    hidePoweredBy: true, // Remove X-Powered-By header
    
    // Strict-Transport-Security (HSTS)
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false, // Disable in development
    
    // X-Content-Type-Options
    noSniff: true, // Prevent MIME type sniffing
    
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
    
    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    
    // X-XSS-Protection (legacy, but still useful for older browsers)
    // Note: Helmet v5+ sets this to '0' by default. We'll set it manually below.
    xssFilter: false, // Disable Helmet's default to set our own
  };

  return config;
}

/**
 * Apply security headers middleware
 */
function applySecurityHeaders(app) {
  const helmet = require('helmet');
  const config = getHelmetConfig();
  
  try {
    app.use(helmet(config));
    
    // Manually set X-XSS-Protection header (Helmet v5+ sets it to '0' by default)
    // We set it to '1; mode=block' for legacy browser support
    app.use((req, res, next) => {
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    
    logger.info('Security headers configured', {
      environment: process.env.NODE_ENV,
      cspEnabled: config.contentSecurityPolicy !== false,
    });
  } catch (error) {
    logger.error('Failed to configure security headers', {
      error: error.message,
      stack: error.stack,
    });
    // Fallback to basic Helmet configuration
    app.use(helmet());
    // Still set X-XSS-Protection manually
    app.use((req, res, next) => {
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    logger.warn('Using basic Helmet configuration as fallback');
  }
}

/**
 * Get CSP report endpoint handler (for CSP violation reporting)
 * This is optional but useful for monitoring CSP violations
 */
function getCSPReportHandler() {
  return (req, res) => {
    try {
      const report = req.body;
      logger.warn('CSP violation reported', {
        'csp-report': report['csp-report'],
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
      
      // In production, you might want to send this to a monitoring service
      // For now, we just log it
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error processing CSP report', {
        error: error.message,
      });
      res.status(204).send();
    }
  };
}

module.exports = {
  getHelmetConfig,
  getCSPDirectives,
  applySecurityHeaders,
  getCSPReportHandler,
};


# Security Headers Configuration

This document describes the security headers configuration for the IAM Blog application.

## Overview

The application uses [Helmet.js](https://helmetjs.github.io/) to set various HTTP security headers that help protect against common web vulnerabilities.

## Headers Configured

### 1. Content Security Policy (CSP)

The Content Security Policy restricts which resources can be loaded and executed, helping prevent XSS attacks.

#### Production Configuration

**Strict CSP** with no `unsafe-inline` or `unsafe-eval` for scripts:

- **defaultSrc**: `'self'` - Only allow resources from same origin
- **scriptSrc**: `'self'` - Only allow scripts from same origin (no inline scripts)
- **styleSrc**: `'self' 'unsafe-inline' https://fonts.googleapis.com` - Allow inline styles (required for Tailwind CSS) and Google Fonts
- **fontSrc**: `'self' data: https://fonts.gstatic.com` - Allow fonts from same origin, data URIs, and Google Fonts
- **imgSrc**: `'self' data: https: blob:` - Allow images from same origin, data URIs, HTTPS, and blob URLs
- **connectSrc**: `'self'` + frontend/backend URLs - Allow API calls and WebSocket connections
- **workerSrc**: `'self' blob:` - Allow service workers
- **frameSrc**: `'none'` - Block all iframes
- **objectSrc**: `'none'` - Block plugins

#### Development Configuration

**Permissive CSP** to support Vite HMR:

- **scriptSrc**: Includes `'unsafe-inline'` and `'unsafe-eval'` for Vite HMR
- **connectSrc**: Includes `localhost` URLs for development server

### 2. HTTP Strict Transport Security (HSTS)

**Production Only**:
- `maxAge`: 1 year (31536000 seconds)
- `includeSubDomains`: true
- `preload`: true

Forces browsers to use HTTPS for all future requests to the domain.

### 3. X-Frame-Options

- **Value**: `SAMEORIGIN`

Prevents the page from being displayed in an iframe, protecting against clickjacking attacks.

### 4. X-Content-Type-Options

- **Value**: `nosniff`

Prevents browsers from MIME-sniffing responses, forcing them to respect the declared Content-Type.

### 5. Referrer-Policy

- **Value**: `strict-origin-when-cross-origin`

Controls how much referrer information is sent with requests:
- Same-origin: Full URL
- Cross-origin HTTPS: Origin only
- Cross-origin HTTP: No referrer

### 6. X-XSS-Protection

- **Value**: `1; mode=block`

Enables XSS filtering in legacy browsers (IE, older Chrome).

### 7. DNS Prefetch Control

- **Value**: Disabled

Prevents browsers from prefetching DNS to reduce information leakage.

### 8. Permitted Cross-Domain Policies

- **Value**: `none`

Prevents loading of cross-domain policy files (for Flash/PDF plugins).

## Configuration

Security headers are configured in `src/backend/config/securityHeaders.js`.

### Environment Variables

- `NODE_ENV`: Determines if production or development CSP is used
- `FRONTEND_URL`: Frontend URL for production CSP (e.g., `https://example.com`)
- `BACKEND_URL`: Backend URL for production CSP (e.g., `https://api.example.com`)

### Customization

To customize CSP directives, edit `getCSPDirectives()` in `src/backend/config/securityHeaders.js`.

## CSP Violation Reporting

The application includes an optional CSP violation reporting endpoint that can be enabled to monitor CSP violations.

### Enable Reporting

Uncomment the following line in `src/backend/server.js`:

```javascript
this.app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), getCSPReportHandler());
```

### Configure Reporting in CSP

Add `report-uri` or `report-to` directive to CSP:

```javascript
contentSecurityPolicy: {
  directives: {
    // ... other directives
    reportUri: '/api/csp-report', // For older browsers
    reportTo: [{ group: 'csp-endpoint', max_age: 10886400 }], // For newer browsers
  },
}
```

## Testing CSP

### 1. Check Headers

Use browser DevTools → Network tab → Response Headers to verify headers are set.

### 2. Test CSP Violations

1. Open browser DevTools → Console
2. Try to load a resource that violates CSP
3. Check console for CSP violation warnings

### 3. Use CSP Evaluator

Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to test your CSP policy.

## Common Issues

### Issue: Styles not loading

**Solution**: Ensure `'unsafe-inline'` is in `styleSrc` (required for Tailwind CSS).

### Issue: Scripts not executing

**Solution**: 
- In development: Ensure `'unsafe-inline'` and `'unsafe-eval'` are in `scriptSrc` for Vite HMR
- In production: Use nonce-based CSP or hash-based CSP instead of `unsafe-inline`

### Issue: Images not loading

**Solution**: Ensure `https:`, `data:`, and `blob:` are in `imgSrc` if you need external images.

### Issue: API calls blocked

**Solution**: Ensure frontend/backend URLs are in `connectSrc`.

## Best Practices

1. **Start Strict**: Begin with a strict CSP and relax only as needed
2. **Use Nonces**: In production, use nonces instead of `unsafe-inline` for scripts
3. **Monitor Violations**: Enable CSP violation reporting to identify issues
4. **Test Regularly**: Test CSP after any frontend changes
5. **Document Changes**: Document any CSP relaxations and why they're needed

## References

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP: Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)


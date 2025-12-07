# E2E Testing with Playwright

End-to-end tests for the IAM Blog application using Playwright.

## Setup

1. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

2. **Set up test environment:**
   - Ensure backend is running on `http://localhost:3001`
   - Ensure frontend is running on `http://localhost:3000`
   - Or let Playwright start them automatically (configured in `playwright.config.js`)

3. **Set test credentials** (optional, uses defaults):
   ```bash
   export ADMIN_USERNAME=admin
   export ADMIN_PASSWORD=your-password
   ```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test tests/e2e/user-flows.spec.js
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
```

## Test Structure

- **User Flows** (`user-flows.spec.js`): Tests for public-facing features
  - Home page display
  - Blog navigation
  - Post viewing
  - Search functionality
  - Newsletter subscription
  - Contact form

- **Admin Flows** (`admin-flows.spec.js`): Tests for admin features
  - Login/logout
  - Dashboard access
  - Post management
  - Contact messages
  - Admin-only routes

## Test Coverage

### Critical User Flows ✅
- [x] View home page
- [x] Navigate blog pages
- [x] View blog posts
- [x] Search functionality
- [x] IAM/Security page navigation
- [x] Newsletter subscription
- [x] Contact form submission

### Admin Workflows ✅
- [x] Admin login
- [x] Login failure handling
- [x] Dashboard access
- [x] Post management
- [x] Create blog post
- [x] View contact messages
- [x] Logout

## Debugging

### View test report
```bash
npx playwright show-report
```

### Debug a test
```bash
npx playwright test --debug
```

### Take screenshots
Screenshots are automatically taken on failure. Check `test-results/` directory.

### View trace
Traces are captured on retry. View with:
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

Tests run automatically in GitHub Actions (see `.github/workflows/e2e.yml`).

## Best Practices

1. **Use data-testid attributes** in components for reliable selectors
2. **Wait for elements** instead of fixed timeouts
3. **Clean up test data** after tests
4. **Use page object model** for complex flows
5. **Keep tests independent** - each test should work in isolation

## Troubleshooting

### Tests timing out
- Check if backend/frontend are running
- Increase timeout in `playwright.config.js`
- Check network tab for failed requests

### Elements not found
- Use `page.waitForSelector()` before interacting
- Check if element is in iframe
- Verify element is visible (not hidden)

### Authentication issues
- Verify admin credentials in `.env`
- Check if cookies are being set correctly
- Ensure backend authentication is working


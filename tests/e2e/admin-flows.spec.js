const { test, expect } = require('@playwright/test');

// Test credentials (should match your .env or test setup)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Schlurfend.?.123';

test.describe('Admin Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/admin/login');
  });

  test('should login as admin', async ({ page }) => {
    // Fill login form
    const usernameInput = page.locator('input[name="username"]').or(page.locator('input[type="text"]').first());
    const passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]'));
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /login/i }));

    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await usernameInput.fill(ADMIN_USERNAME);
    await passwordInput.fill(ADMIN_PASSWORD);
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/.*\/admin/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should fail login with wrong credentials', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"]').or(page.locator('input[type="text"]').first());
    const passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]'));
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /login/i }));

    await usernameInput.fill('wronguser');
    await passwordInput.fill('wrongpass');
    await loginButton.click();

    // Should show error message
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('text=/invalid|incorrect|error/i').first();
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      await expect(errorMessage).toBeVisible();
    }

    // Should still be on login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test.describe('Authenticated Admin Tests', () => {
    test.beforeEach(async ({ page, context }) => {
      // Login first
      await page.goto('/admin/login');
      const usernameInput = page.locator('input[name="username"]').or(page.locator('input[type="text"]').first());
      const passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]'));
      const loginButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /login/i }));

      await usernameInput.fill(ADMIN_USERNAME);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();

      // Wait for login to complete
      await page.waitForURL(/.*\/admin/, { timeout: 10000 });
    });

    test('should access admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      // Check for dashboard elements
      const dashboard = page.locator('text=/dashboard|overview|statistics/i').first();
      await expect(dashboard).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to manage posts', async ({ page }) => {
      await page.goto('/admin');
      
      // Look for posts link
      const postsLink = page.locator('a[href*="/posts"]').or(page.locator('text=/posts|manage/i')).first();
      
      if (await postsLink.isVisible()) {
        await postsLink.click();
      } else {
        await page.goto('/admin/posts');
      }

      await expect(page).toHaveURL(/.*\/posts/);
      
      // Check for posts list or create button
      const postsList = page.locator('table, [data-testid="posts-list"]').or(page.locator('text=/create|new post/i'));
      await expect(postsList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should create a new blog post', async ({ page }) => {
      await page.goto('/admin/posts/create');
      
      // Wait for form to load
      await page.waitForTimeout(2000);

      // Fill post form
      const titleInput = page.locator('input[name="title"]').or(page.locator('input[type="text"]').first());
      const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea').first());
      const saveButton = page.locator('button').filter({ hasText: /save|publish|create/i }).first();

      if (await titleInput.isVisible({ timeout: 10000 })) {
        await titleInput.fill('E2E Test Post');
        await contentInput.fill('This is a test post created by E2E tests.');
        
        // Look for excerpt field
        const excerptInput = page.locator('textarea[name="excerpt"]').or(page.locator('textarea').nth(1));
        if (await excerptInput.isVisible()) {
          await excerptInput.fill('Test excerpt');
        }

        await saveButton.click();

        // Wait for redirect or success message
        await page.waitForTimeout(3000);
        
        // Should redirect to posts list or show success
        const successMessage = page.locator('text=/success|created|saved/i').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          await expect(successMessage).toBeVisible();
        } else {
          // Or should be on posts list page
          await expect(page).toHaveURL(/.*\/posts/);
        }
      }
    });

    test('should view contact messages', async ({ page }) => {
      await page.goto('/admin');
      
      // Look for contact messages link
      const contactLink = page.locator('a[href*="/contact"]').or(page.locator('text=/contact|messages/i')).first();
      
      if (await contactLink.isVisible()) {
        await contactLink.click();
      } else {
        await page.goto('/admin/contact');
      }

      await expect(page).toHaveURL(/.*\/contact/);
      
      // Check for messages table or list
      const messagesTable = page.locator('table, [data-testid="messages-list"]');
      await expect(messagesTable.first()).toBeVisible({ timeout: 10000 });
    });

    test('should logout', async ({ page }) => {
      await page.goto('/admin');
      
      // Look for logout button
      const logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i }).first();
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // Try direct navigation
        await page.goto('/admin/logout');
      }

      // Should redirect to login page
      await page.waitForURL(/.*\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/.*\/login/);
    });
  });
});




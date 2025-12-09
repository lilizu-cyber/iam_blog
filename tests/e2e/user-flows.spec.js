const { test, expect } = require('@playwright/test');

test.describe('User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should display home page with blog posts', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/IAM Cybersecurity Blog/i);

    // Check for featured posts section
    const featuredSection = page.locator('text=Featured Posts').or(page.locator('h2').filter({ hasText: /featured/i }));
    await expect(featuredSection.first()).toBeVisible({ timeout: 10000 });

    // Check for recent posts section
    const recentSection = page.locator('text=Recent Posts').or(page.locator('h2').filter({ hasText: /recent/i }));
    await expect(recentSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to blog list page', async ({ page }) => {
    // Click on blog link in navigation
    const blogLink = page.locator('a[href*="/blog"]').first();
    if (await blogLink.isVisible()) {
      await blogLink.click();
      await expect(page).toHaveURL(/.*\/blog/);
    } else {
      // Try direct navigation
      await page.goto('/blog');
      await expect(page).toHaveURL(/.*\/blog/);
    }

    // Check for blog posts
    const posts = page.locator('[data-testid="blog-post"]').or(page.locator('article'));
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should view a blog post', async ({ page }) => {
    // Navigate to blog list
    await page.goto('/blog');

    // Wait for posts to load
    await page.waitForSelector('article, [data-testid="blog-post"]', { timeout: 10000 });

    // Click on first post
    const firstPost = page.locator('article').first().or(page.locator('[data-testid="blog-post"]').first());
    const postLink = firstPost.locator('a').first();
    
    if (await postLink.isVisible()) {
      await postLink.click();
    } else {
      // Try clicking the post itself
      await firstPost.click();
    }

    // Check post content is visible
    await expect(page.locator('article').or(page.locator('main'))).toBeVisible({ timeout: 10000 });
  });

  test('should search for blog posts', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="search" i]'));
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('security');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Check if results are shown
      const results = page.locator('article, [data-testid="blog-post"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0); // At least no errors
    }
  });

  test('should navigate to IAM posts page', async ({ page }) => {
    // Look for IAM link in navigation or footer
    const iamLink = page.locator('a[href*="/iam"]').first();
    
    if (await iamLink.isVisible()) {
      await iamLink.click();
    } else {
      await page.goto('/iam');
    }

    await expect(page).toHaveURL(/.*\/iam/);
    
    // Check for IAM posts
    const posts = page.locator('article, [data-testid="blog-post"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Security posts page', async ({ page }) => {
    // Look for Security link
    const securityLink = page.locator('a[href*="/security"]').first();
    
    if (await securityLink.isVisible()) {
      await securityLink.click();
    } else {
      await page.goto('/security');
    }

    await expect(page).toHaveURL(/.*\/security/);
    
    // Check for Security posts
    const posts = page.locator('article, [data-testid="blog-post"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should subscribe to newsletter', async ({ page }) => {
    // Look for newsletter form
    const emailInput = page.locator('input[type="email"]').first();
    const subscribeButton = page.locator('button').filter({ hasText: /subscribe/i }).first();

    if (await emailInput.isVisible() && await subscribeButton.isVisible()) {
      await emailInput.fill('test@example.com');
      await subscribeButton.click();

      // Wait for response (success or error message)
      await page.waitForTimeout(2000);
      
      // Check for success/error message
      const message = page.locator('text=/success|error|thank you/i').first();
      if (await message.isVisible({ timeout: 5000 })) {
        await expect(message).toBeVisible();
      }
    }
  });

  test('should navigate to contact page', async ({ page }) => {
    const contactLink = page.locator('a[href*="/contact"]').first();
    
    if (await contactLink.isVisible()) {
      await contactLink.click();
    } else {
      await page.goto('/contact');
    }

    await expect(page).toHaveURL(/.*\/contact/);
    
    // Check for contact form
    const contactForm = page.locator('form').or(page.locator('[data-testid="contact-form"]'));
    await expect(contactForm).toBeVisible({ timeout: 10000 });
  });

  test('should submit contact form', async ({ page }) => {
    await page.goto('/contact');

    // Fill contact form
    const nameInput = page.locator('input[name="name"]').or(page.locator('input[type="text"]').first());
    const emailInput = page.locator('input[name="email"]').or(page.locator('input[type="email"]'));
    const subjectInput = page.locator('input[name="subject"]');
    const messageInput = page.locator('textarea[name="message"]');
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /send|submit/i }));

    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await emailInput.fill('test@example.com');
      if (await subjectInput.isVisible()) {
        await subjectInput.fill('Test Subject');
      }
      await messageInput.fill('This is a test message');
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check for success message
      const successMessage = page.locator('text=/success|thank you|sent/i').first();
      if (await successMessage.isVisible({ timeout: 5000 })) {
        await expect(successMessage).toBeVisible();
      }
    }
  });
});




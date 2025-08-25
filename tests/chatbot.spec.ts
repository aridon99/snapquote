import { test, expect } from '@playwright/test';

test('chatbot widget appears on homepage', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await expect(page.locator('h1')).toContainText('Transform Your Home');
  
  // Check if chatbot button is visible
  const chatbotButton = page.locator('button:has(svg)').filter({ hasText: '' }); // Button with MessageCircle icon
  await expect(chatbotButton).toBeVisible();
  
  // Check button positioning (should be in bottom-right)
  const buttonBox = await chatbotButton.boundingBox();
  const pageSize = await page.viewportSize();
  
  if (buttonBox && pageSize) {
    // Button should be near the bottom-right corner
    expect(buttonBox.x).toBeGreaterThan(pageSize.width - 150); // Within 150px of right edge
    expect(buttonBox.y).toBeGreaterThan(pageSize.height - 150); // Within 150px of bottom edge
  }
});

test('chatbot opens when clicked', async ({ page }) => {
  await page.goto('/');
  
  // Find and click the chatbot button
  const chatbotButton = page.locator('button:has(svg)').filter({ hasText: '' });
  await chatbotButton.click();
  
  // Check if chat interface opens
  await expect(page.locator('text=Emma')).toBeVisible();
  await expect(page.locator('text=Renovation Assistant')).toBeVisible();
  
  // Check for close button
  const closeButton = page.locator('button:has-text("×")').or(page.locator('button:has(svg[data-lucide="x"])'));
  await expect(closeButton).toBeVisible();
});

test('chatbot can be closed', async ({ page }) => {
  await page.goto('/');
  
  // Open chatbot
  const chatbotButton = page.locator('button:has(svg)').filter({ hasText: '' });
  await chatbotButton.click();
  
  // Wait for chat to open
  await expect(page.locator('text=Emma')).toBeVisible();
  
  // Click close button
  const closeButton = page.locator('button:has(svg[data-lucide="x"])');
  await closeButton.click();
  
  // Chat should close - only floating button should remain
  await expect(page.locator('text=Emma')).not.toBeVisible();
  await expect(chatbotButton).toBeVisible();
});

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check key elements are present
  await expect(page.locator('text=RenovationAdvisor')).toBeVisible();
  await expect(page.locator('text=Transform Your Home')).toBeVisible();
  await expect(page.locator('text=With Expert Guidance')).toBeVisible();
  
  // Check navigation elements
  await expect(page.locator('text=Get Started')).toBeVisible();
  
  // Check that page loaded without errors
  await expect(page).toHaveTitle(/RenovationAdvisor/i);
});
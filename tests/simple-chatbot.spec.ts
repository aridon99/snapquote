import { test, expect } from '@playwright/test';

test('red chatbot button is visible', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Look specifically for the red circular chatbot button
  const chatbotButton = page.locator('button.rounded-full.h-14.w-14.bg-red-500');
  
  // Check if it's visible
  await expect(chatbotButton).toBeVisible();
  
  // Verify it has the correct styling
  await expect(chatbotButton).toHaveClass(/bg-red-500/);
  await expect(chatbotButton).toHaveClass(/rounded-full/);
  
  console.log('✅ Chatbot button found and is visible!');
});

test('chatbot button positioning', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const chatbotButton = page.locator('button.rounded-full.h-14.w-14.bg-red-500');
  await expect(chatbotButton).toBeVisible();
  
  // Check positioning
  const buttonBox = await chatbotButton.boundingBox();
  const pageSize = await page.viewportSize();
  
  if (buttonBox && pageSize) {
    console.log(`Button position: x=${buttonBox.x}, y=${buttonBox.y}`);
    console.log(`Page size: width=${pageSize.width}, height=${pageSize.height}`);
    
    // Button should be in bottom-right corner
    expect(buttonBox.x).toBeGreaterThan(pageSize.width - 200); // Within 200px of right edge
    expect(buttonBox.y).toBeGreaterThan(pageSize.height - 200); // Within 200px of bottom edge
    
    console.log('✅ Chatbot button is positioned correctly in bottom-right corner!');
  }
});
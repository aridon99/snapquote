import { test, expect } from '@playwright/test';

test('debug chatbot button', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's happening
  await page.screenshot({ path: 'chatbot-debug.png', fullPage: true });
  
  // Find the chatbot button
  const chatbotButton = page.locator('button.rounded-full.h-14.w-14.bg-red-500');
  
  // Check if it exists
  const count = await chatbotButton.count();
  console.log(`Found ${count} chatbot buttons`);
  
  if (count > 0) {
    // Get its position and style info
    const buttonBox = await chatbotButton.boundingBox();
    const styles = await chatbotButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        top: computed.top,
        right: computed.right,
        bottom: computed.bottom,
        left: computed.left,
        zIndex: computed.zIndex,
        display: computed.display,
        visibility: computed.visibility
      };
    });
    
    console.log('Button bounding box:', buttonBox);
    console.log('Button styles:', styles);
    
    // Check if it's actually visible on screen
    await expect(chatbotButton).toBeVisible();
    
    // Take a screenshot highlighting the button
    await chatbotButton.highlight();
    await page.screenshot({ path: 'chatbot-highlighted.png' });
  }
});
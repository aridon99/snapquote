import { test, expect } from '@playwright/test';

test.describe('Interactive Chatbot Testing', () => {
  test('should interact with Emma chatbot and test lead capture', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('http://localhost:3000');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/chatbot-initial.png', fullPage: true });
    
    // Find and click the chatbot button to open it
    await test.step('Open chatbot', async () => {
      // Look for the chat button (might be minimized initially)
      const chatButton = page.locator('button').filter({ hasText: /Emma|Chat|Ask|Help/i }).first();
      
      if (await chatButton.isVisible()) {
        await chatButton.click();
        console.log('Clicked chat button to open');
      } else {
        // Try to find the chatbot widget directly
        const chatWidget = page.locator('[class*="chatbot"]').first();
        if (await chatWidget.isVisible()) {
          await chatWidget.click();
          console.log('Clicked chat widget');
        }
      }
      
      // Wait for chat to open
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/chatbot-opened.png', fullPage: true });
    });
    
    // Test conversation flow
    await test.step('Test basic conversation', async () => {
      // Find the chat input field
      const chatInput = page.locator('input[type="text"], textarea').filter({ hasNot: page.locator('[type="email"], [type="tel"]') }).first();
      
      if (await chatInput.isVisible()) {
        // Type a message
        await chatInput.fill('Hi, I need help with a kitchen renovation');
        await page.screenshot({ path: 'test-results/chatbot-typed-message.png', fullPage: true });
        
        // Send the message (Enter key or send button)
        await chatInput.press('Enter');
        
        // Wait for response
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/chatbot-first-response.png', fullPage: true });
        
        // Continue conversation
        await chatInput.fill('My budget is around $50,000');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/chatbot-budget-response.png', fullPage: true });
        
        // Test lead capture trigger
        await chatInput.fill('Can someone call me about this project?');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/chatbot-lead-trigger.png', fullPage: true });
      }
    });
    
    // Test lead capture form if it appears
    await test.step('Test lead capture form', async () => {
      // Check if lead form appears
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Lead capture form detected');
        
        // Fill out the lead form
        await nameInput.fill('John Test');
        
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible()) {
          await emailInput.fill('test@example.com');
        }
        
        const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
        if (await phoneInput.isVisible()) {
          await phoneInput.fill('555-0123');
        }
        
        await page.screenshot({ path: 'test-results/chatbot-lead-form-filled.png', fullPage: true });
        
        // Submit the form
        const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /submit|send|contact/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-results/chatbot-lead-submitted.png', fullPage: true });
        }
      }
    });
    
    // Test mobile responsiveness
    await test.step('Test mobile chatbot', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'test-results/chatbot-mobile.png', fullPage: true });
    });
    
    // Verify chatbot elements
    await test.step('Verify chatbot UI elements', async () => {
      // Check for Emma branding
      const emmaText = page.locator('text=/Emma|AI Assistant/i');
      if (await emmaText.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Emma branding found');
      }
      
      // Check for message history
      const messages = page.locator('[class*="message"]');
      const messageCount = await messages.count();
      console.log(`Found ${messageCount} messages in chat`);
      
      // Check for proper styling (green for bot, blue for user)
      const botMessage = page.locator('[class*="bg-green"]').first();
      const userMessage = page.locator('[class*="bg-blue"]').first();
      
      if (await botMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Bot message styling verified (green)');
      }
      if (await userMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('User message styling verified (blue)');
      }
    });
    
    // Final full page screenshot
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: 'test-results/chatbot-final.png', fullPage: true });
    
    console.log('Chatbot interactive testing completed');
  });
  
  test('should test chatbot minimize and restore', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Open chatbot
    const chatButton = page.locator('button').filter({ hasText: /Emma|Chat|Ask|Help/i }).first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for minimize button
    const minimizeButton = page.locator('button').filter({ hasText: /−|minimize/i }).first();
    if (await minimizeButton.isVisible()) {
      await minimizeButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/chatbot-minimized.png', fullPage: true });
      
      // Restore chatbot
      const restoreButton = page.locator('button').filter({ hasText: /Emma|Chat|Ask|Help/i }).first();
      if (await restoreButton.isVisible()) {
        await restoreButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/chatbot-restored.png', fullPage: true });
      }
    }
  });
});

// Performance test
test('chatbot performance', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Measure chatbot load time
  const startTime = Date.now();
  const chatButton = page.locator('button').filter({ hasText: /Emma|Chat|Ask|Help/i }).first();
  await chatButton.click();
  
  // Wait for chat to be interactive
  const chatInput = page.locator('input[type="text"], textarea').first();
  await chatInput.waitFor({ state: 'visible' });
  
  const loadTime = Date.now() - startTime;
  console.log(`Chatbot load time: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
  
  // Measure response time
  const messageStartTime = Date.now();
  await chatInput.fill('Hello');
  await chatInput.press('Enter');
  
  // Wait for bot response
  await page.waitForSelector('[class*="bg-green"]', { timeout: 5000 });
  const responseTime = Date.now() - messageStartTime;
  console.log(`Chatbot response time: ${responseTime}ms`);
  expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
});
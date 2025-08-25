import { test, expect } from '@playwright/test';

test.describe('Simple Chatbot Test', () => {
  test('verify chatbot presence and basic interaction', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('http://localhost:3000');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/simple-initial.png', fullPage: true });
    
    // Look for the chatbot using different selectors
    console.log('Looking for chatbot element...');
    
    // Try finding by fixed position element (chatbot is usually fixed positioned)
    const fixedElements = await page.locator('[style*="fixed"], [class*="fixed"]').all();
    console.log(`Found ${fixedElements.length} fixed positioned elements`);
    
    // Try finding elements with "chat" in class
    const chatElements = await page.locator('[class*="chat" i]').all();
    console.log(`Found ${chatElements.length} elements with "chat" in class`);
    
    // Try finding the chatbot icon/button specifically
    const possibleChatbot = page.locator('div').filter({ 
      has: page.locator('button, svg, img').first() 
    }).filter({
      hasText: /Emma|Chat|Ask|Message|Help|💬/i
    });
    
    const chatbotCount = await possibleChatbot.count();
    console.log(`Found ${chatbotCount} possible chatbot elements`);
    
    // Look for the minimized chatbot button (usually in bottom-right)
    const bottomRightElement = page.locator('button, div').filter(async (el) => {
      const box = await el.boundingBox();
      if (!box) return false;
      // Check if element is in bottom-right area of viewport
      return box.x > 800 && box.y > 400;
    });
    
    // Try to interact with any found chat element
    if (chatbotCount > 0) {
      const firstChatElement = possibleChatbot.first();
      await firstChatElement.screenshot({ path: 'test-results/chatbot-element.png' });
      
      // Try clicking it
      try {
        await firstChatElement.click({ timeout: 5000 });
        console.log('Successfully clicked on chatbot element');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/after-click.png', fullPage: true });
        
        // Look for chat input after opening
        const chatInput = page.locator('input[type="text"], textarea').last();
        if (await chatInput.isVisible({ timeout: 3000 })) {
          console.log('Chat input found!');
          await chatInput.fill('Hello, I need help with a renovation');
          await page.screenshot({ path: 'test-results/typed-message.png', fullPage: true });
          await chatInput.press('Enter');
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/after-send.png', fullPage: true });
        }
      } catch (e) {
        console.log('Could not interact with chatbot:', e.message);
      }
    }
    
    // Alternative: Look for iframe (some chatbots use iframes)
    const iframes = await page.locator('iframe').all();
    console.log(`Found ${iframes.length} iframes on page`);
    
    // Log all visible text containing "Emma" or "Chat"
    const emmaElements = await page.locator('text=/Emma|Chat/i').all();
    for (const el of emmaElements) {
      const text = await el.textContent();
      console.log(`Found text: "${text}"`);
    }
    
    // Final check: Look at page HTML for chatbot
    const pageContent = await page.content();
    const hasChatbotWidget = pageContent.includes('ChatbotWidget');
    const hasEmma = pageContent.includes('Emma');
    console.log(`Page contains ChatbotWidget: ${hasChatbotWidget}`);
    console.log(`Page contains Emma: ${hasEmma}`);
    
    // Check if chatbot might be hidden or not rendering
    const hiddenElements = await page.locator('[style*="display: none"], [style*="visibility: hidden"], [hidden]').all();
    console.log(`Found ${hiddenElements.length} hidden elements`);
    
    // Try scrolling to bottom to see if chatbot appears
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/scrolled-bottom.png', fullPage: true });
  });
});
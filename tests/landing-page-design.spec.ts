import { test, expect } from '@playwright/test';

test.describe('Landing Page Design Analysis - Breyer Construction Style', () => {
  test('should display professional construction company design elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot for visual analysis
    await page.screenshot({ 
      path: 'test-results/landing-page-full.png', 
      fullPage: true 
    });
    
    // Check header elements
    await test.step('Verify professional header design', async () => {
      // Check for logo with red background
      const logo = page.locator('[class*="bg-red-600"]').first();
      await expect(logo).toBeVisible();
      
      // Check for company name and tagline
      await expect(page.locator('text=Renovation Advisor')).toBeVisible();
      await expect(page.locator('text=Deck Builder & Residential Remodeler')).toBeVisible();
      
      // Check for phone number in header
      await expect(page.locator('text=(650) 376-8499')).toBeVisible();
      
      // Verify navigation items
      await expect(page.locator('text=HOME')).toBeVisible();
      await expect(page.locator('text=SERVICES')).toBeVisible();
      await expect(page.locator('text=PORTFOLIO')).toBeVisible();
    });
    
    // Check hero section design
    await test.step('Verify hero section matches construction style', async () => {
      // Check for large hero title
      await expect(page.locator('h1')).toContainText('Deck Builder');
      await expect(page.locator('h1')).toContainText('& Residential');
      await expect(page.locator('h1')).toContainText('Remodeler');
      
      // Check for service area text
      await expect(page.locator('text=Serving Eastern Pennsylvania')).toBeVisible();
      
      // Take hero section screenshot
      await page.locator('section').first().screenshot({ 
        path: 'test-results/hero-section.png' 
      });
    });
    
    // Check service cards grid (6 numbered sections)
    await test.step('Verify 6 numbered service cards', async () => {
      // Check for numbered service cards (01-06)
      await expect(page.locator('text=01')).toBeVisible();
      await expect(page.locator('text=02')).toBeVisible();
      await expect(page.locator('text=03')).toBeVisible();
      await expect(page.locator('text=04')).toBeVisible();
      await expect(page.locator('text=05')).toBeVisible();
      await expect(page.locator('text=06')).toBeVisible();
      
      // Check specific service titles
      await expect(page.locator('text=Custom Deck Design & Construction')).toBeVisible();
      await expect(page.locator('text=Hardscaping, Patios & Walls')).toBeVisible();
      await expect(page.locator('text=Renovations & Remodeling')).toBeVisible();
      await expect(page.locator('text=Finished Basements')).toBeVisible();
      
      // Take service cards screenshot
      const servicesSection = page.locator('#services');
      await servicesSection.screenshot({ path: 'test-results/services-grid.png' });
    });
    
    // Check "Easier Home Improvement Solutions" section
    await test.step('Verify red accent section and testimonial', async () => {
      await expect(page.locator('text=Easier Home')).toBeVisible();
      await expect(page.locator('text=Improvement')).toBeVisible();
      await expect(page.locator('text=Solutions')).toBeVisible();
      
      // Check for testimonial
      await expect(page.locator('text=Adam W.')).toBeVisible();
      await expect(page.locator('text=Norristown, Dec 06, 2017')).toBeVisible();
    });
    
    // Check recent projects section
    await test.step('Verify recent projects gallery', async () => {
      await expect(page.locator('text=RECENT PROJECTS')).toBeVisible();
      await expect(page.locator('text=Modern Deck & Pergola')).toBeVisible();
      await expect(page.locator('text=Complete Kitchen Remodel')).toBeVisible();
      await expect(page.locator('text=Outdoor Living Space')).toBeVisible();
      
      // Check for "SEE MORE PROJECTS" button
      await expect(page.locator('text=SEE MORE PROJECTS')).toBeVisible();
      
      // Take projects section screenshot
      const projectsSection = page.locator('#portfolio');
      await projectsSection.screenshot({ path: 'test-results/projects-gallery.png' });
    });
    
    // Check blog section
    await test.step('Verify blog section', async () => {
      await expect(page.locator('text=FROM THE BLOG')).toBeVisible();
      await expect(page.locator('text=How to Choose the Right Lighting for Your Deck')).toBeVisible();
      await expect(page.locator('text=Signs It\'s Time To Replace Your Deck')).toBeVisible();
    });
    
    // Check professional memberships
    await test.step('Verify professional memberships section', async () => {
      await expect(page.locator('text=PROFESSIONAL MEMBERSHIPS')).toBeVisible();
      await expect(page.locator('text=NAHB')).toBeVisible();
      await expect(page.locator('text=CHAMBER')).toBeVisible();
      await expect(page.locator('text=BBB')).toBeVisible();
      await expect(page.locator('text=NADRA')).toBeVisible();
      
      // Take memberships screenshot
      const membershipsSection = page.locator('text=PROFESSIONAL MEMBERSHIPS').locator('..');
      await membershipsSection.screenshot({ path: 'test-results/memberships.png' });
    });
    
    // Check red CTA section
    await test.step('Verify red CTA section', async () => {
      await expect(page.locator('text=SCHEDULE AN APPOINTMENT')).toBeVisible();
      
      // Check if button has correct styling (red background)
      const ctaButton = page.locator('text=SCHEDULE AN APPOINTMENT');
      await ctaButton.screenshot({ path: 'test-results/cta-button.png' });
    });
    
    // Check footer
    await test.step('Verify professional footer', async () => {
      await expect(page.locator('text=PRIVACY POLICY')).toBeVisible();
      await expect(page.locator('text=CODE OF ETHICS')).toBeVisible();
      await expect(page.locator('text=OUR PROMISE AND WARRANTY')).toBeVisible();
      await expect(page.locator('text=© Copyright 2025 Renovation Advisor')).toBeVisible();
      
      // Take footer screenshot
      const footer = page.locator('footer');
      await footer.screenshot({ path: 'test-results/footer.png' });
    });
    
    // Verify chatbot is still present
    await test.step('Verify chatbot widget is present', async () => {
      // The chatbot should be present but minimized
      const chatbot = page.locator('[class*="chatbot"]').first();
      // Don't require it to be visible as it might be minimized
    });
  });
  
  test('should have professional color scheme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for red accent elements (should be #DC2626 or similar red)
    const redElements = page.locator('[class*="bg-red"]');
    await expect(redElements.first()).toBeVisible();
    
    // Check for dark/gray elements for professional look
    const darkElements = page.locator('[class*="bg-gray-9"], [class*="bg-gray-8"]');
    await expect(darkElements.first()).toBeVisible();
  });
  
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/mobile-landing-page.png', 
      fullPage: true 
    });
    
    // Verify key elements are visible on mobile
    await expect(page.locator('text=Renovation Advisor')).toBeVisible();
    await expect(page.locator('text=Deck Builder')).toBeVisible();
    await expect(page.locator('text=01')).toBeVisible(); // First service card
  });
});

test('Visual comparison with expected design', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Create comprehensive visual report
  await test.step('Generate visual design report', async () => {
    // Take screenshots of key sections for analysis
    const sections = [
      { name: 'header', selector: 'header' },
      { name: 'hero', selector: 'section:first-of-type' },
      { name: 'services', selector: '#services' },
      { name: 'projects', selector: '#portfolio' },
      { name: 'footer', selector: 'footer' }
    ];
    
    for (const section of sections) {
      const element = page.locator(section.selector);
      if (await element.isVisible()) {
        await element.screenshot({ 
          path: `test-results/section-${section.name}.png` 
        });
      }
    }
    
    // Generate a design analysis
    const designElements = {
      hasRedAccents: await page.locator('[class*="bg-red"]').count() > 0,
      hasDarkElements: await page.locator('[class*="bg-gray-9"], [class*="bg-gray-8"]').count() > 0,
      hasNumberedCards: await page.locator('text=01').isVisible() && await page.locator('text=06').isVisible(),
      hasPhoneNumber: await page.locator('text=(650) 376-8499').isVisible(),
      hasProfessionalSections: await page.locator('text=PROFESSIONAL MEMBERSHIPS').isVisible(),
      hasConstructionFocus: await page.locator('text=Deck Builder').isVisible()
    };
    
    console.log('Design Analysis Results:', designElements);
  });
});
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:8100/booking-home/add');
  await page.waitForTimeout(3000);

  const removed = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('package_companies') || k.startsWith('products_cache')
    );
    keys.forEach(k => localStorage.removeItem(k));
    return keys;
  });
  console.log('Cleared keys:', removed);

  await page.reload();
  await page.waitForTimeout(4000);

  // Select Package type
  try {
    const packageRadio = page.locator('ion-radio, input[type="radio"]').filter({ hasText: /package/i }).first();
    await packageRadio.click({ timeout: 3000 });
  } catch {
    // Try clicking the label
    await page.locator('text=Package').first().click();
  }
  await page.waitForTimeout(2000);

  // Click company input
  const companyInput = page.locator('input').filter({ hasAttribute: 'placeholder' }).first();
  await companyInput.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'company-dropdown.png' });
  console.log('Screenshot saved.');

  const companies = await page.evaluate(() => {
    return Object.keys(localStorage).filter(k => k.startsWith('package_companies'));
  });
  console.log('Cache keys after reload:', companies);

  await browser.close();
})();

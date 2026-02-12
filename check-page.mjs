import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  try {
    const response = await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Status:', response?.status());

    // Wait for React to render
    await page.waitForTimeout(5000);

    const title = await page.title();
    console.log('Title:', title);

    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 3000) : 'ROOT NOT FOUND';
    });
    console.log('\nRoot HTML (first 3000 chars):\n', rootHTML);

    if (consoleErrors.length > 0) {
      console.log('\n--- Console Errors ---');
      consoleErrors.forEach(m => console.log(m));
    }

    if (pageErrors.length > 0) {
      console.log('\n--- Page Errors ---');
      pageErrors.forEach(e => console.log(e));
    }

    await page.screenshot({ path: 'screenshot.png', fullPage: false });
    console.log('\nScreenshot saved to screenshot.png');
  } catch (err) {
    console.error('Error:', err.message);
  }

  await browser.close();
})();

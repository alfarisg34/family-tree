import { chromium } from 'playwright';

// Usage: node open-url.mjs <url> [--headless] [--screenshot <path>]
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node open-url.mjs <url> [--headless] [--screenshot <output_path>]');
  process.exit(1);
}

const targetUrl = args[0];
const isHeadless = !args.includes('--headed');
const screenshotIndex = args.indexOf('--screenshot');
const screenshotPath = screenshotIndex !== -1 ? args[screenshotIndex + 1] : null;

(async () => {
  const browser = await chromium.launch({
    headless: isHeadless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 }
  });

  try {
    console.log(`[Playwright] Navigating to: ${targetUrl}`);
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`[Playwright] Status code: ${response ? response.status() : 'N/A'}`);
    console.log(`[Playwright] Page title: ${await page.title()}`);

    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[Playwright] Screenshot saved to: ${screenshotPath}`);
    }
  } catch (err) {
    console.error(`[Playwright] Error:`, err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

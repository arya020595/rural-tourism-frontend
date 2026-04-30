// Playwright test: login → booking list → click BK_A001 → generate PDF → verify download
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

(async () => {
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "booking-pdf-"));
  console.log(`📁 Download dir: ${downloadDir}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Capture console errors from the page
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[PAGE ERROR]", msg.text());
  });

  try {
    // ── 1. Login ─────────────────────────────────────────────────────────────
    console.log("Step 1: Navigating to login page...");
    await page.goto("http://localhost:8100/login", {
      waitUntil: "networkidle",
    });

    // Ionic uses shadow DOM for ion-input — fill the native input inside the shadow root
    const usernameInput = page.locator('ion-input[name="username"]');
    await usernameInput.locator("input").fill("operator_seed");

    const passwordInput = page.locator('ion-input[name="password"]');
    await passwordInput.locator("input").fill("password123");

    console.log("Step 1: Submitting login form...");
    await page
      .locator('ion-button[type="submit"], button[type="submit"]')
      .first()
      .click();

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.toString().includes("/login"), {
      timeout: 15000,
    });
    console.log("Step 1: Logged in ✓ — current URL:", page.url());

    // ── 2. Navigate to Booking Home ──────────────────────────────────────────
    console.log("Step 2: Navigating to booking home...");
    await page.goto("http://localhost:8100/booking-home", {
      waitUntil: "networkidle",
    });

    // Wait for the booking table to appear
    await page.waitForSelector("table tbody tr", { timeout: 10000 });
    console.log("Step 2: Booking table loaded ✓");

    // ── 3. Click the info button for BK_A001 ─────────────────────────────────
    console.log("Step 3: Looking for BK_A001 row...");
    // Find the row containing BK_A001
    const bkRow = page.locator("tr", {
      has: page.locator("td.booking-id", { hasText: "BK_A001" }),
    });
    await bkRow.waitFor({ timeout: 5000 });
    const infoBtn = bkRow.locator("button.icon-btn.info");
    await infoBtn.click();
    console.log("Step 3: Clicked info button for BK_A001 ✓");

    // ── 4. Wait for detail page ───────────────────────────────────────────────
    await page.waitForURL(/booking-home\/detail/, { timeout: 10000 });
    await page.waitForSelector(".pdf-button", { timeout: 10000 });
    console.log("Step 4: Booking detail page loaded ✓ — URL:", page.url());

    // Confirm booking title is visible (use first matching h1 that contains 'View Booking')
    const title = await page
      .locator("h1", { hasText: "View Booking" })
      .textContent();
    console.log("Step 4: Page title:", title?.trim());

    // ── 5. Click Generate PDF and capture download ────────────────────────────
    console.log('Step 5: Clicking "Manjana PDF/Generate PDF" button...');

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      page.locator(".pdf-button").click(),
    ]);

    const suggestedFilename = download.suggestedFilename();
    const savePath = path.join(downloadDir, suggestedFilename || "booking.pdf");
    await download.saveAs(savePath);

    const stats = fs.statSync(savePath);
    console.log(`Step 5: PDF downloaded ✓`);
    console.log(`        Filename : ${suggestedFilename}`);
    console.log(`        Size     : ${stats.size} bytes`);
    console.log(`        Saved to : ${savePath}`);

    // Verify it is a real PDF (starts with %PDF)
    const header = Buffer.alloc(4);
    const fd = fs.openSync(savePath, "r");
    fs.readSync(fd, header, 0, 4, 0);
    fs.closeSync(fd);
    const isPdf = header.toString() === "%PDF";
    console.log(
      `        Valid PDF : ${isPdf ? "YES ✓" : "NO ✗ (header: " + header.toString() + ")"}`,
    );

    if (!isPdf) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    // Take a screenshot for debugging
    const screenshotPath = path.join(downloadDir, "failure-screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error("   Screenshot saved to:", screenshotPath);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (!process.exitCode) {
      console.log("\n✅ TEST PASSED — PDF download works correctly");
    }
  }
})();

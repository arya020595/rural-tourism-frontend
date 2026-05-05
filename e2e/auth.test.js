// Playwright test: login and register feature verification
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const http = require("http");

// Read BASE_URL from the backend .env (CORS_ORIGIN)
function loadEnv(envPath) {
  const vars = {};
  if (!fs.existsSync(envPath)) return vars;
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    });
  return vars;
}

const ENV_PATH = path.resolve(__dirname, "../../rural-tourism-backend/.env");
const env = loadEnv(ENV_PATH);
const BASE_URL = env.CORS_ORIGIN || "http://localhost:8100";

console.log(`Using BASE_URL: ${BASE_URL} (from ${ENV_PATH})`);

const TIMEOUT = 15000;

// Helper: fill an ion-input and dispatch ionInput/ionChange on the host element
// so Angular's ngModel *and* (ionInput) event handlers both receive the value
// (handlers read event.detail.value which only exists on Ionic's CustomEvent).
async function fillIonInput(page, selector, value) {
  const ionInput = page.locator(selector);
  await ionInput.waitFor({ timeout: TIMEOUT });
  await ionInput.locator("input").fill(value);
  await ionInput.evaluate((el, val) => {
    el.value = val;
    el.dispatchEvent(
      new CustomEvent("ionInput", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
    el.dispatchEvent(
      new CustomEvent("ionChange", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
  }, value);
}

// ─── Test runner ────────────────────────────────────────────────────────────
(async () => {
  let passed = 0;
  let failed = 0;

  const browser = await chromium.launch({ headless: true });

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 1 — Login with valid credentials
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━ TEST 1: Login ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("  [PAGE ERROR]", msg.text());
    });

    try {
      // Step 1 – Navigate to login
      console.log("  Step 1: Navigating to login page...");
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      console.log("  Step 1: Login page loaded ✓");

      // Step 2 – Fill credentials
      console.log("  Step 2: Filling credentials...");
      await fillIonInput(page, 'ion-input[name="username"]', "operator_seed");
      await fillIonInput(page, 'ion-input[name="password"]', "password123");
      console.log("  Step 2: Credentials filled ✓");

      // Step 3 – Submit
      console.log("  Step 3: Submitting login...");
      await page.locator('ion-button[type="submit"]').first().click();

      // Step 4 – Verify redirect away from /login
      await page.waitForURL((url) => !url.toString().includes("/login"), {
        timeout: TIMEOUT,
      });
      const landingUrl = page.url();
      console.log("  Step 4: Redirected to:", landingUrl, "✓");

      // Step 5 – Verify no error toast is actively open (ion-toast uses is-open attr when shown)
      const openToast = page.locator('ion-toast[is-open="true"]');
      const toastOpen = await openToast.isVisible().catch(() => false);
      if (toastOpen) {
        const toastText = await openToast.textContent();
        throw new Error(`Login error toast shown: ${toastText}`);
      }

      console.log("  ✅ TEST 1 PASSED — Login works correctly");
      passed++;
    } catch (err) {
      console.error("  ❌ TEST 1 FAILED:", err.message);
      const screenshotPath = `/tmp/login-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error("     Screenshot saved to:", screenshotPath);
      failed++;
    } finally {
      await context.close();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 2 — Login with wrong credentials (should show error)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(
    "\n━━━ TEST 2: Login – wrong credentials ━━━━━━━━━━━━━━━━━━━━━━━",
  );
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      await fillIonInput(page, 'ion-input[name="username"]', "wrong_user");
      await fillIonInput(page, 'ion-input[name="password"]', "wrongpass");
      await page.locator('ion-button[type="submit"]').first().click();

      // Should stay on login or show an error — must NOT redirect to a non-login page
      await page.waitForTimeout(3000);
      const stillOnLogin = page.url().includes("/login");

      if (!stillOnLogin) {
        throw new Error(
          "Expected to stay on /login with wrong credentials, but was redirected to: " +
            page.url(),
        );
      }
      console.log("  Stayed on /login after bad credentials ✓");
      console.log("  ✅ TEST 2 PASSED — Bad-credentials rejection works");
      passed++;
    } catch (err) {
      console.error("  ❌ TEST 2 FAILED:", err.message);
      const screenshotPath = `/tmp/login-wrong-creds-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error("     Screenshot saved to:", screenshotPath);
      failed++;
    } finally {
      await context.close();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 3 — Register page: association dropdown loads options
  // ══════════════════════════════════════════════════════════════════════════
  console.log(
    "\n━━━ TEST 3: Register – association dropdown ━━━━━━━━━━━━━━━━━",
  );
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("  [PAGE ERROR]", msg.text());
    });

    try {
      console.log("  Step 1: Navigating to register page...");
      await page.goto(`${BASE_URL}/register`, {
        waitUntil: "domcontentloaded",
      });
      // Wait for Angular to render the component
      await page.waitForSelector('select[name="associationId"]', {
        timeout: TIMEOUT,
      });
      console.log("  Step 1: Register page loaded ✓");

      // Wait for the association dropdown to populate
      console.log("  Step 2: Waiting for association options to load...");
      await page.waitForFunction(
        () => {
          const select = document.querySelector('select[name="associationId"]');
          return select && select.options.length > 1; // more than just the placeholder
        },
        { timeout: TIMEOUT },
      );

      const optionCount = await page.evaluate(() => {
        const select = document.querySelector('select[name="associationId"]');
        return select ? select.options.length - 1 : 0; // exclude placeholder
      });

      console.log(
        `  Step 2: Association dropdown has ${optionCount} option(s) ✓`,
      );

      if (optionCount === 0) {
        throw new Error("Association dropdown is empty — no options loaded");
      }

      // List the options
      const options = await page.evaluate(() => {
        const select = document.querySelector('select[name="associationId"]');
        return Array.from(select.options)
          .filter((o) => o.value !== "")
          .map((o) => `${o.value}: ${o.text}`);
      });
      console.log("  Associations loaded:", options.join(", "));

      console.log("  ✅ TEST 3 PASSED — Association dropdown loads correctly");
      passed++;
    } catch (err) {
      console.error("  ❌ TEST 3 FAILED:", err.message);
      const screenshotPath = `/tmp/register-assoc-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error("     Screenshot saved to:", screenshotPath);
      failed++;
    } finally {
      await context.close();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 4 — Register full flow (section 1 → section 2 → submit)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(
    "\n━━━ TEST 4: Register – full flow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("  [PAGE ERROR]", msg.text());
    });

    const timestamp = Date.now();
    const testUsername = `test_e2e_${timestamp}`;
    const testEmail = `test_e2e_${timestamp}@example.com`;

    try {
      await page.goto(`${BASE_URL}/register`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector('select[name="associationId"]', {
        timeout: TIMEOUT,
      });

      // ── Section 1 ──────────────────────────────────────────────────────
      console.log("  Step 1: Filling section 1...");

      // Business name
      await fillIonInput(
        page,
        'ion-input[name="business_name"]',
        "E2E Test Business Sdn. Bhd.",
      );

      // Association dropdown — wait for options then select first real one
      await page.waitForFunction(
        () => {
          const sel = document.querySelector('select[name="associationId"]');
          return sel && sel.options.length > 1;
        },
        { timeout: TIMEOUT },
      );
      await page.selectOption('select[name="associationId"]', { index: 1 });

      // Business address — ion-textarea
      const textarea = page.locator('ion-textarea[name="business_address"]');
      await textarea.locator("textarea").fill("123 E2E Test Street, Sabah");

      // Poscode — handler reads event.detail.value, so use fillIonInput
      await fillIonInput(page, 'ion-input[name="poscode"]', "89200");

      // Location dropdown
      await page.selectOption('select[name="location"]', { value: "Kiulu" });

      // Owner full name
      await fillIonInput(
        page,
        'ion-input[name="owner_full_name"]',
        "E2E Test Owner",
      );

      // Contact no — also reads event.detail.value
      await fillIonInput(page, 'ion-input[name="contact_no"]', "0123456789");

      // Staff counts
      await fillIonInput(page, 'ion-input[name="no_of_full_time_staff"]', "2");
      await fillIonInput(page, 'ion-input[name="no_of_part_time_staff"]', "1");

      console.log("  Step 1: Section 1 filled ✓");

      // ── Click "Seterusnya" (Next) ──────────────────────────────────────
      console.log("  Step 2: Clicking Seterusnya (Next)...");

      // The button is enabled once isSection1Valid() returns true
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll("ion-button"));
          const btn = btns.find((b) => b.textContent.trim() === "Seterusnya");
          return btn && !btn.hasAttribute("disabled");
        },
        { timeout: 10000 },
      );

      await page.locator("ion-button", { hasText: "Seterusnya" }).click();

      // Wait for section 2 to appear
      await page.waitForSelector('ion-input[name="username"]', {
        timeout: TIMEOUT,
      });
      console.log("  Step 2: Section 2 loaded ✓");

      // ── Section 2 ──────────────────────────────────────────────────────
      console.log("  Step 3: Filling section 2...");
      await fillIonInput(page, 'ion-input[name="username"]', testUsername);
      await fillIonInput(page, 'ion-input[name="email_address"]', testEmail);
      await fillIonInput(page, 'ion-input[name="password"]', "TestPass@2026!");
      await fillIonInput(
        page,
        'ion-input[name="confirmed_password"]',
        "TestPass@2026!",
      );
      console.log("  Step 3: Section 2 filled ✓");

      // ── Submit "Daftar" ────────────────────────────────────────────────
      console.log("  Step 4: Submitting registration...");

      // Wait for the Daftar button to be enabled
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll("ion-button"));
          const btn = btns.find((b) => b.textContent.trim() === "Daftar");
          return btn && !btn.hasAttribute("disabled");
        },
        { timeout: 10000 },
      );

      await page.locator("ion-button", { hasText: "Daftar" }).click();

      // ── Verify success alert ───────────────────────────────────────────
      console.log("  Step 5: Waiting for success alert...");
      await page.waitForSelector("ion-alert", { timeout: TIMEOUT });

      const alertHeader = await page
        .locator("ion-alert .alert-head")
        .textContent()
        .catch(() => null);

      if (!alertHeader || !alertHeader.includes("Berjaya")) {
        // Check for an error toast instead
        const toastEl = page.locator("ion-toast");
        const toastVisible = await toastEl.isVisible().catch(() => false);
        const toastText = toastVisible
          ? await toastEl.textContent()
          : "no toast";
        throw new Error(
          `Expected success alert but got: "${alertHeader}". Toast: "${toastText}"`,
        );
      }

      console.log("  Step 5: Success alert displayed ✓");
      console.log(`  Registered as: ${testUsername} / ${testEmail}`);
      console.log("  ✅ TEST 4 PASSED — Full registration flow works");
      passed++;
    } catch (err) {
      console.error("  ❌ TEST 4 FAILED:", err.message);
      const screenshotPath = `/tmp/register-full-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error("     Screenshot saved to:", screenshotPath);
      failed++;
    } finally {
      await context.close();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 5 — Register with file uploads and verify files were saved
  // ══════════════════════════════════════════════════════════════════════════
  console.log(
    "\n━━━ TEST 5: Register – file uploads saved ━━━━━━━━━━━━━━━━━━━━",
  );
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("  [PAGE ERROR]", msg.text());
    });

    const timestamp = Date.now();
    const testUsername = `test_upload_${timestamp}`;
    const testEmail = `test_upload_${timestamp}@example.com`;

    // Create minimal valid PNG files in a temp dir
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-upload-"));

    // 1×1 red pixel PNG (valid PNG binary, well under 1 MB)
    const minimalPng = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
        "2e00000000c4944415478016360f8cfc00000000200019e221bc330000000" +
        "0049454e44ae426082",
      "hex",
    );

    const logoFile = path.join(tmpDir, "logo.png");
    const motacFile = path.join(tmpDir, "motac.png");
    const tradingFile = path.join(tmpDir, "trading.png");
    const homestayFile = path.join(tmpDir, "homestay.png");
    for (const f of [logoFile, motacFile, tradingFile, homestayFile]) {
      fs.writeFileSync(f, minimalPng);
    }

    let companyId = null;

    try {
      // ── Intercept the register API response to capture company_id ────────
      page.on("response", async (response) => {
        if (
          response.url().includes("/api/auth/register") &&
          response.request().method() === "POST"
        ) {
          try {
            const body = await response.json();
            if (body?.data?.user?.company_id) {
              companyId = body.data.user.company_id;
            }
          } catch (_) {}
        }
      });

      await page.goto(`${BASE_URL}/register`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector('select[name="associationId"]', {
        timeout: TIMEOUT,
      });

      // ── Section 1 ─────────────────────────────────────────────────────
      console.log("  Step 1: Filling section 1 with file uploads...");

      await fillIonInput(
        page,
        'ion-input[name="business_name"]',
        "E2E Upload Test Sdn. Bhd.",
      );

      await page.waitForFunction(
        () => {
          const sel = document.querySelector('select[name="associationId"]');
          return sel && sel.options.length > 1;
        },
        { timeout: TIMEOUT },
      );
      await page.selectOption('select[name="associationId"]', { index: 1 });

      const textarea = page.locator('ion-textarea[name="business_address"]');
      await textarea.locator("textarea").fill("456 Upload Test Road, Sabah");

      await fillIonInput(page, 'ion-input[name="poscode"]', "88000");
      await page.selectOption('select[name="location"]', { value: "Ranau" });
      await fillIonInput(
        page,
        'ion-input[name="owner_full_name"]',
        "Upload Test Owner",
      );
      await fillIonInput(page, 'ion-input[name="contact_no"]', "0198765432");
      await fillIonInput(page, 'ion-input[name="no_of_full_time_staff"]', "3");
      await fillIonInput(page, 'ion-input[name="no_of_part_time_staff"]', "2");

      // ── Attach files ──────────────────────────────────────────────────
      console.log("  Step 1b: Attaching files...");
      await page.setInputFiles('input[name="operator_logo_image"]', logoFile);
      await page.setInputFiles('input[name="motac_license_file"]', motacFile);
      await page.setInputFiles(
        'input[name="trading_operation_license"]',
        tradingFile,
      );
      await page.setInputFiles(
        'input[name="homestay_certificate"]',
        homestayFile,
      );

      // Verify filenames appeared in UI
      const logoName = await page.locator("p.file-name").nth(0).textContent();
      const motacName = await page.locator("p.file-name").nth(1).textContent();
      console.log(
        `  Step 1b: Files attached — logo: "${logoName?.trim()}", motac: "${motacName?.trim()}" ✓`,
      );

      console.log("  Step 1: Section 1 done ✓");

      // ── Click Seterusnya ──────────────────────────────────────────────
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll("ion-button"));
          const btn = btns.find((b) => b.textContent.trim() === "Seterusnya");
          return btn && !btn.hasAttribute("disabled");
        },
        { timeout: 10000 },
      );
      await page.locator("ion-button", { hasText: "Seterusnya" }).click();
      await page.waitForSelector('ion-input[name="username"]', {
        timeout: TIMEOUT,
      });

      // ── Section 2 ─────────────────────────────────────────────────────
      console.log("  Step 2: Filling section 2...");
      await fillIonInput(page, 'ion-input[name="username"]', testUsername);
      await fillIonInput(page, 'ion-input[name="email_address"]', testEmail);
      await fillIonInput(page, 'ion-input[name="password"]', "TestPass@2026!");
      await fillIonInput(
        page,
        'ion-input[name="confirmed_password"]',
        "TestPass@2026!",
      );

      // ── Submit ────────────────────────────────────────────────────────
      console.log("  Step 3: Submitting registration...");
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll("ion-button"));
          const btn = btns.find((b) => b.textContent.trim() === "Daftar");
          return btn && !btn.hasAttribute("disabled");
        },
        { timeout: 10000 },
      );
      await page.locator("ion-button", { hasText: "Daftar" }).click();

      await page.waitForSelector("ion-alert", { timeout: TIMEOUT });
      const alertHeader = await page
        .locator("ion-alert .alert-head")
        .textContent()
        .catch(() => null);

      if (!alertHeader || !alertHeader.includes("Berjaya")) {
        throw new Error(`Expected success alert but got: "${alertHeader}"`);
      }
      console.log("  Step 3: Registration success alert shown ✓");

      // ── Verify files via API ──────────────────────────────────────────
      // Login to get a token, then GET /api/companies/:id and check file fields
      console.log("  Step 4: Logging in to verify uploaded files via API...");

      const loginResp = await new Promise((resolve, reject) => {
        const body = JSON.stringify({
          username: testUsername,
          password: "TestPass@2026!",
        });
        const parsed = new URL(BASE_URL);
        const reqModule = parsed.protocol === "https:" ? https : http;
        const req = reqModule.request(
          {
            host: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: "/api/auth/login",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
            },
          },
          (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          },
        );
        req.on("error", reject);
        req.write(body);
        req.end();
      });

      const token = loginResp?.data?.token || loginResp?.token;
      if (!token) {
        throw new Error(
          `Login after register failed — no token. Response: ${JSON.stringify(loginResp)}`,
        );
      }
      console.log("  Step 4: Login successful, token obtained ✓");

      if (!companyId) {
        throw new Error(
          "company_id was not captured from the register response",
        );
      }
      console.log(`  Step 4: company_id = ${companyId}`);

      // GET /api/companies/:id
      const companyResp = await new Promise((resolve, reject) => {
        const parsed = new URL(BASE_URL);
        const reqModule = parsed.protocol === "https:" ? https : http;
        const req = reqModule.request(
          {
            host: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: `/api/companies/${companyId}`,
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
          (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          },
        );
        req.on("error", reject);
        req.end();
      });

      console.log("  Step 5: Checking file fields in company record...");
      const company = companyResp?.data;
      if (!company) {
        throw new Error(
          `Company API response missing data: ${JSON.stringify(companyResp)}`,
        );
      }

      const fileFields = [
        "operator_logo_image",
        "motac_license_file",
        "trading_operation_license",
        "homestay_certificate",
      ];

      const results = fileFields.map((field) => {
        const val = company[field];
        const saved =
          typeof val === "string" && val.length > 0 && val.startsWith("data:");
        return { field, saved, preview: val ? val.slice(0, 30) + "…" : "null" };
      });

      for (const r of results) {
        if (r.saved) {
          console.log(`  ✓ ${r.field}: saved (${r.preview})`);
        } else {
          console.error(`  ✗ ${r.field}: NOT saved (value: ${r.preview})`);
        }
      }

      const allSaved = results.every((r) => r.saved);
      if (!allSaved) {
        const missing = results
          .filter((r) => !r.saved)
          .map((r) => r.field)
          .join(", ");
        throw new Error(`File(s) not saved in DB: ${missing}`);
      }

      console.log("  ✅ TEST 5 PASSED — All uploaded files saved correctly");
      passed++;
    } catch (err) {
      console.error("  ❌ TEST 5 FAILED:", err.message);
      const screenshotPath = `/tmp/register-upload-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error("     Screenshot saved to:", screenshotPath);
      failed++;
    } finally {
      // Clean up temp files
      for (const f of [logoFile, motacFile, tradingFile, homestayFile]) {
        try {
          fs.unlinkSync(f);
        } catch (_) {}
      }
      try {
        fs.rmdirSync(tmpDir);
      } catch (_) {}
      await context.close();
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  await browser.close();
  console.log("\n━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed > 0) {
    console.log("\n❌ SOME TESTS FAILED");
    process.exitCode = 1;
  } else {
    console.log("\n✅ ALL TESTS PASSED");
  }
})();

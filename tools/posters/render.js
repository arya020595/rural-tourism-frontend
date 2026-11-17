/**
 * Renders a poster / infographic template to a PNG.
 *
 *   node tools/posters/render.js maintenance            -> tools/posters/out/maintenance.png
 *   node tools/posters/render.js quotation-module out.png
 *
 * - The canvas size is the template's own <body> width/height (CSS).
 * - <img data-qr="https://..."> gets a QR code of that link (navy on white).
 * - Warns when text runs past the canvas edges, and when the Montserrat font
 *   didn't load (it comes from Google Fonts, so rendering needs internet).
 *
 * Needs `puppeteer`. The frontend doesn't install it, so this falls back to the
 * backend repo's copy (../rural-tourism-backend, next to this repo).
 * See docs/POSTERS.md.
 */
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const QRCode = require("qrcode");

const loadPuppeteer = () => {
  try {
    return require("puppeteer");
  } catch {
    const backendCopy = path.resolve(__dirname, "../../../rural-tourism-backend/node_modules/puppeteer");
    try {
      return require(backendCopy);
    } catch {
      console.error("puppeteer not found. Run `npm install` in rural-tourism-backend, or `npm i -D puppeteer` here.");
      process.exit(1);
    }
  }
};

const [, , nameArg, outArg] = process.argv;
if (!nameArg) {
  const names = fs.readdirSync(path.join(__dirname, "templates")).filter((f) => f.endsWith(".html"));
  console.error(`usage: node tools/posters/render.js <template> [output.png]\ntemplates: ${names.map((f) => f.replace(/\.html$/, "")).join(", ")}`);
  process.exit(2);
}
const templatePath = path.resolve(
  fs.existsSync(nameArg) ? nameArg : path.join(__dirname, "templates", nameArg.replace(/\.html$/, "") + ".html"),
);
if (!fs.existsSync(templatePath)) {
  console.error(`template not found: ${templatePath}`);
  process.exit(2);
}
const outPath = path.resolve(outArg || path.join(__dirname, "out", path.basename(templatePath, ".html") + ".png"));

(async () => {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({ headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto(pathToFileURL(templatePath).href, { waitUntil: "networkidle0" });

    // QR codes: generate in Node, put them in as data URLs.
    const links = await page.$$eval("img[data-qr]", (imgs) => imgs.map((i) => i.dataset.qr));
    for (const link of [...new Set(links)]) {
      const dataUrl = await QRCode.toDataURL(link, {
        errorCorrectionLevel: "M", margin: 1, width: 420, color: { dark: "#13306b", light: "#ffffff" },
      });
      await page.$$eval(`img[data-qr="${link}"]`, (imgs, src) => imgs.forEach((i) => { i.src = src; }), dataUrl);
    }

    // Canvas = the template's body size.
    const { width, height } = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { width: Math.round(parseFloat(cs.width)), height: Math.round(parseFloat(cs.height)) };
    });
    await page.setViewport({ width, height });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
    });

    // Checks
    const report = await page.evaluate((W, H) => {
      const fontOk = document.fonts.check("900 40px Montserrat");
      const brokenImages = [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src") || i.dataset.qr);
      const outside = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const r = range.getBoundingClientRect();
        if (r.bottom > H - 4 || r.right > W - 4 || r.left < 4 || r.top < 4) outside.push(node.textContent.trim().slice(0, 50));
      }
      return { fontOk, brokenImages, outside };
    }, width, height);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, type: "png" });

    console.log(`saved ${outPath} (${width}x${height}, ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
    if (links.length) console.log(`QR codes: ${[...new Set(links)].join(", ")}`);
    if (!report.fontOk) console.warn("WARNING: Montserrat didn't load (no internet?). The PNG uses a fallback font.");
    if (report.brokenImages.length) console.warn(`WARNING: images not found: ${report.brokenImages.join(", ")}`);
    if (report.outside.length) {
      console.warn("WARNING: text touches or runs past the canvas edge (make the body taller or the text smaller):");
      report.outside.forEach((t) => console.warn(`  - "${t}"`));
    }
  } finally {
    await browser.close();
  }
})();

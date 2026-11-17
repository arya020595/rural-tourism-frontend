# Posters & Infographics

How RuTEC announcement posters and feature infographics are made, so anyone (or
Claude) can make the next one in the same style. Templates and the render script
are in [`tools/posters/`](../tools/posters/).

**Asking Claude for a new one:** say what it's for and point it here, e.g.

> Read `docs/POSTERS.md` and make a maintenance poster for Friday 5 December,
> 9:00 PM, purpose: monthly update. Save it to my Downloads.

> Read `docs/POSTERS.md` and make an infographic for the new booking calendar,
> based on `tools/posters/templates/quotation-module.html`.

---

## 1. Templates

| Template | Size | Use it for |
|---|---|---|
| `maintenance.html` | 1080×1552 | Maintenance / downtime notice: date, time, purpose, what users should do |
| `quotation-module.html` | 1080×2090 | A new feature: 4 numbered steps + a status legend |
| `user-guide-video.html` | 1080×1800 | Two cards with a picture and a **QR code** each + "where to find it" |
| `registration-approval.html` | 1080×2110 | A new feature for one audience (associations): steps + 3 coloured tabs + 2 notes |

Each template is one self-contained HTML file. To make a new one, **copy the
closest template**, change the text, then render.

The examples are the real ones published on 2026-11-17 (maintenance poster for the
release that night, and infographics for the quotation module, the user guide and
video, and registration approval).

## 2. Render

```bash
# from the frontend repo
node tools/posters/render.js maintenance                 # -> tools/posters/out/maintenance.png
node tools/posters/render.js my-new-poster ~/Downloads/RuTEC-Something.png
```

- The PNG size is the template's `body { width; height }` in CSS.
- `<img data-qr="https://…">` becomes a QR code of that link (navy on white).
- The script warns when text touches or runs past the canvas edge, when an image is
  missing, or when the font didn't load.
- Needs **internet** (Montserrat comes from Google Fonts) and `puppeteer`. The
  frontend doesn't install puppeteer; the script uses the backend repo's copy
  (`../rural-tourism-backend/node_modules/puppeteer`), so run `npm install` there
  once if it's missing.
- `tools/posters/out/` is git-ignored. Give finished files a clear name in
  Downloads, e.g. `RuTEC-Maintenance-17Nov2026.png`.

## 3. Style rules

| | |
|---|---|
| Logos | RuTEC (`src/assets/icon/rutec_icon.png`) + Explore Sabah (`src/assets/icon/explore_sabah-without_bg.png`) side by side in a white rounded card at the top, as on the login page |
| Font | Montserrat (Google Fonts), 900 for titles, 600–800 for text |
| Colours | navy `#13306b`, dark navy `#0b1f4a`, teal `#138a7c` (from the logo), orange `#f28c1e` (tags / highlights), app green `#04552f` |
| Status colours | same as the app: Sent `#dbeafe`/`#1f4e8c`, Accepted `#a4d6af`/`#015c2f`, Expired `#f7d4a0`/`#a65c00`, Cancelled / Inactive `#f8d7da`/`#721c24`, Pending `#f7d4a0`/`#a65c00` |
| Language | **BM first, then English** (smaller, grey), like the app: "Penyelenggaraan Sistem / System Maintenance" |
| Layout | navy header with logos, an orange tag pill (NOTIS · NOTICE, BAHARU · NEW, UNTUK PERSATUAN · FOR ASSOCIATIONS), big title, white cards on a light background, navy footer bar |
| Width | always 1080 px. Height to fit: 1350 (4:5) is the most Instagram shows uncropped; taller is fine for WhatsApp |

## 4. Checklist before sharing

1. **Facts come from the docs, not memory.** Feature names, buttons, tabs and
   statuses from the module docs (`docs/QUOTATION_MODULE_FRONTEND.md`,
   `docs/REGISTRATION_APPROVAL_FRONTEND.md`, `docs/USER_GUIDE.md`, …). Check what is
   actually in a release with `git log --oneline --no-merges origin/main..origin/develop`
   in both repos.
2. **No text off the edge:** render prints no warning, and look at the PNG.
3. **QR codes scan.** With Python + OpenCV:
   ```bash
   python -c "import cv2; ok,v,_,_=cv2.QRCodeDetector().detectAndDecodeMulti(cv2.imread('tools/posters/out/user-guide-video.png')); print(v)"
   ```
4. **Timing:** don't promote a feature or a link (e.g. `rutec.my/user-guide`) before
   it is on production. A Play Store update can take hours to reach users after
   publishing, so posters say "once complete", not a time.
5. **Times are Malaysia time** (the server runs on UTC, the poster doesn't).
6. Don't invent an end time for maintenance; leave "Starting 10:00 PM" unless you know it.

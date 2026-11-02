# Panduan Pengguna / User Guide — Frontend

The in-app guide for **operators** (operator_admin and operator_staff), added
2026-11-02 on branch `Features/newfeatures29oct`.

## 1. What it is

- **Public page** `/user-guide`. No login is needed, so new operators can read it
  before registering.
- **Opened from the login page:** **Panduan Pengguna / User Guide** button under
  "Daftar Akaun / Register Account". Its partner button, **Video Tutorial**,
  opens the YouTube video.
- **Layout:**
  - top bar: back to Login, RuTEC logo, search, **BM / EN** toggle;
  - contents sidebar, a drop-down on phones;
  - sections with numbered steps, tips / notes / warnings, tables and
    screenshots (tap a screenshot to enlarge it).
- **One language at a time.** The choice is remembered per device
  (`localStorage` key `rutec_guide_lang`); the default is BM.
- **Search** filters the sections by any word in the current language.

## 2. Files

| File | What |
|---|---|
| `src/app/user-guide/user-guide.config.ts` | **`VIDEO_TUTORIAL_URL`** (YouTube link) and `USER_GUIDE_UPDATED` (the "Last updated" date) |
| `src/app/user-guide/user-guide.content.ts` | all guide text (BM + EN) and which screenshot goes where |
| `src/app/user-guide/user-guide.page.{ts,html,scss}`, `user-guide.module.ts`, `user-guide-routing.module.ts` | the page |
| `src/assets/user-guide/*.webp` | 22 screenshots (1280×800, WebP quality 80, ~1.1 MB total; was 1.7 MB as JPEG) |
| `src/app/app-routing.module.ts` | public route `user-guide` (no guards) |
| `src/app/login/login.page.{html,ts,scss}` | the two help buttons (`openUserGuide`, `openVideoTutorial`) |

## 3. Adding the YouTube video

The link is set in `user-guide.config.ts` (added 2026-11-02):

```ts
export const VIDEO_TUTORIAL_URL = 'https://youtu.be/6vxCw2Jhb0o';
```

The video is the operator walkthrough: 8 min, BM/EN captions, made with the
fictional demo operator. To use a different video later, replace this link.

- While it's empty, both Video Tutorial buttons (login page and guide) show
  "Video tutorial akan datang / coming soon".
- With a link, they open it with `window.open(url, '_blank')`: a new tab on the
  web, the phone's browser or YouTube app in the Android build.

## 4. Changing the text

Edit `user-guide.content.ts`:

- Each section has an `id`, a `group` (sidebar heading), an Ionicons `icon`, a
  `title` and `blocks`.
- Blocks:
  - `p` paragraph;
  - `steps` numbered list;
  - `list` bullets;
  - `tip` / `note` / `warn` callouts;
  - `img` screenshot + caption;
  - `table`.
- Every text is `{ bm, en }`. Write both.
- The only formatting is `**bold**`. Text is HTML-escaped before display.
- Update `USER_GUIDE_UPDATED` in the config when the guide changes.

## 5. Retaking screenshots

All screenshots come from a **fictional demo operator**, not real customers.
Its details:

- company "Demo Homestay & Adventure" under KTA;
- owner "Aminah Binti Demo";
- products River Rafting, Jungle Trekking, Chalet Kayu;
- customers like "Ahmad Bin Ali" and "John Smith";
- one quotation and one staff user.

Never use a real operator's account for guide screenshots.

The capture was done with three Node scripts kept outside the repo, run against
a local backend + MySQL:

1. **Seed:** registers the demo operator through the API, approves it, then
   creates the products, 7 bookings (paid / deposit / cancelled across Sep–Nov),
   the quotation and the staff user.
2. **Shoot:** Puppeteer at 1280×800, logged in as the demo operator, saves
   each page as `src/assets/user-guide/<name>.webp` (WebP, quality 80).
3. **Clean up:** deletes everything for the demo company and refuses to run on
   any other company name.

To retake one screen, recreate the demo data the same way, capture that page at
1280×800 and save it over the file with the same name. Then delete the demo
data.

## 6. Tests (2026-11-02)

- `ng build --configuration development`: clean.
- Browser test (Puppeteer, local): **17/17**. Covered:
  - the login page has both buttons;
  - Video shows "coming soon";
  - the guide opens without login;
  - BM by default, EN toggle remembered;
  - all 22 screenshots load;
  - a contents link scrolls to and highlights its section;
  - search narrows the list, shows "no matches", and clear restores it;
  - screenshot enlarge / close;
  - back to login;
  - phone: no sideways scroll, contents drop-down closes after picking.

## 7. Notes

- The enlarged-screenshot overlay is outside `ion-content`; inside it, the top
  bar covered its ✕ button.
- Screens change over time. When a page is redesigned, retake its screenshot
  and check the steps still match.
- Associations and superadmins are not covered (decided: operators only).

# Association Statistics (own association) — Frontend

As-built reference for the association users' statistics page (branch
`Features/newfeatures29oct`, 2026-11-01 → 2026-11-02). Backend: 
`docs/ASSOCIATION_STATISTICS.md` in the backend repo.

Not to be confused with:

- `/association/dashboard`: the **Power BI** dashboard. It is unchanged and
  shows the association's Power BI link once one is set; until then it shows
  "Unfortunately, the dashboard is not available…".
- `/admin/association-stats`: the superadmin page covering all associations.

---

## 1. Route, menu, permission

| | |
|---|---|
| Route | `/association/statistics`, `authGuard` + `permissionGuard`, `data: { loginRole: 'association', permissions: ['association:read'] }` |
| Menu | `association-statistics`, "Statistik Persatuan / Association Statistics", icon `stats-chart-outline`, role `association`, **first** in the association menu |
| Permission | `association:read`, which association users already have, so no re-login is needed |

## 2. Files

| File | Role |
|---|---|
| `association/statistics/association-statistics.page.{ts,html,scss}`, `association-statistics.module.ts`, `association-statistics-routing.module.ts` | the page |
| `home/dashboard/services/dashboard-api.service.ts` | `getMyAssociationStats(from?, to?)`, `getAssociationMember(companyId)`, types `AssociationMember`, `MyAssociationStatsData`, `AssociationMemberProfile` |

The page's SCSS `@import`s the superadmin page's
(`admin/association-stats/association-stats.page`) for the shared chrome
(header, date filter, loading) and for the stat sections. The stat sections
use the same green tiles and tree diagrams (`.booking-flow`, `.stat-row`,
`.total-tile`), so both pages look the same.
The module imports the standalone `BookingDateSheetComponent`.

## 3. The page, top to bottom

1. **Title** "Statistik Persatuan/Association Statistics", with the
   association's name under it.
2. **Date range:** **Dari / From** and **Hingga / To** fields that open the
   app's pop-up calendar (`app-booking-date-sheet`, the same one as booking /
   quotation):
   - future days are disabled (`max` = today);
   - From ≤ To is kept automatically;
   - **Filter** applies the range; both dates are required;
   - **Reset** clears it (all-time).
3. **Period line:** "Tempoh / Period: Semua masa / All time" or the applied
   range. It shows the range the numbers were **loaded** for, not dates picked
   but not yet filtered.
4. **Tempahan / Bookings:** a tree from **Total Bookings** with arrows to
   Pending (orange), Paid (green) and Cancelled (red).
5. **Ahli, Pelawat & Kewangan / Members, Visitors & Finance:** three tiles:
   - Member Companies (active);
   - Count of Activities Attended by Visitors (paid bookings only);
   - Total Revenue: the full price of paid bookings, deposit included.
6. **Pekerja / Workers:** a tree from **Total Workers** with arrows to
   Full-Time and Part-Time.
7. **Senarai Ahli / Member Companies:**
   - **Columns:** **Info (ⓘ)** · No. · Company · Owner · Location · Workers ·
     **Count of Activities Attended by Visitors** · Joined.
   - **Alignment:** Company and Owner are left-aligned, headings included.
     The other columns are centred.
   - **Search box:** filters on the client (company, owner, location,
     contact, email).
   - **Date range:** the visitor counts follow it (note under the table).
   - Only **approved** companies are listed. Pending and inactive ones are on
     the approvals page.

The column choices were requested: Info on the left, no Revenue column,
"Bookings" replaced by the visitor count, and the same label as the tile.

## 4. ⓘ Company profile pop-up

- Read-only `ion-modal`, loaded from `GET /api/dashboard/my-association-members/:id`.
- Content:
  - logo (if any), name, association, joined date;
  - owner name / email;
  - company email, phone, address (`addressText()` skips empty parts),
    workers;
  - Count of Activities Attended by Visitors for the current date range;
  - the four documents.
- **Buka/Open** shows the document in a **second pop-up** on top of the
  profile, not a new tab:
  - PDFs in an `<iframe>` (Chrome's viewer: zoom / download / print);
  - images in an `<img>`;
  - base64 values are turned into `blob:` URLs, because browsers won't show a
    `data:` PDF in an iframe; the URL is revoked on close;
  - ✕ closes the document only and returns to the profile;
  - full screen on phones.
- The profile pop-up still has a fixed height (`--height: min(620px, 92vh)`),
  unlike the approvals pop-up, which sizes to its content.

## 5. Gotcha: "missing from the TypeScript compilation"

Adding a new lazy-loaded module folder while `ng serve` / `ionic serve` is
running can fail with
`… association-statistics.module.ts is missing from the TypeScript compilation`.
The code is fine (a fresh `ng build` passes). **Restart the dev server.**

## 6. Tests

- `ng build --configuration development` is clean. Karma unit tests were not
  run.
- 2026-11-02: after switching to the superadmin design, screenshots as `kta`
  at 1366 px and 390 px (no sideways scroll).
- Browser tests (Puppeteer, local backend, as `kta`): 15/15 (2026-11-01):
  - route and menu;
  - own association only, with totals matching the superadmin KTA row
    (2,251 bookings, 37 companies);
  - pop-up date range by real clicks (October 2026 → 14 bookings), then Reset;
  - search;
  - profile pop-up open / close;
  - no horizontal scroll at 390 px.
- Document preview: 7/7. Image logo, a real PDF in the iframe, no new tab, ✕
  back to the profile.

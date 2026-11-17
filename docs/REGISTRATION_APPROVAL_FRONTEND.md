# Registration Approval & Member Status — Frontend

As-built reference for the app side of operator registration approval (branch
`Features/newfeatures29oct`, 2026-10-30 → 2026-11-02). The backend reference
(statuses, API, emails, deploy) is `docs/REGISTRATION_APPROVAL.md` in the
backend repo; the change log is `docs/debug/DEBUG_LOG_2026-11-02.md`.

---

## 1. Overview

A new operator's company waits for its association to approve it before anyone
in it can log in. Association users (and superadmins) manage this on
**Kelulusan Pendaftaran / Registration Approvals**, using three tabs:

| Tab | Backend status | ✎ pop-up actions |
|---|---|---|
| Menunggu/Pending | `pending` | Tolak/Reject (reason) · Luluskan/Approve |
| Aktif/Active | `approved` | Nyahaktif/Deactivate (reason) |
| Tidak Aktif/Inactive | `rejected` | Aktifkan/Activate |

The labels come from `REGISTRATION_STATUS_LABELS` in
`services/registration.service.ts`.

## 2. Route, menu, permission

| | |
|---|---|
| Route | `/association/registrations`, `authGuard` + `permissionGuard`, `data: { loginRole: 'association', permissions: ['registration:approve'] }` (`app-routing.module.ts`) |
| Menu | `registration-approvals`, "Kelulusan Pendaftaran / Registration Approvals", icon `person-add-outline`, roles `association` and `superadmin` (`services/menu.service.ts`) |
| Permission | `registration:approve`. Association users must **log in again** after the backend migration to receive it |

## 3. Files

| File | Role |
|---|---|
| `services/registration.service.ts` | `list`, `pendingCount`, `get`, `approve`, `reject`, types, status labels |
| `association/registrations/registrations.page.{ts,html,scss}`, `registrations.module.ts`, `registrations-routing.module.ts` | the page |
| `_shared/notification-panel/notification-panel.component.ts` | a `registration_pending` bell item opens this page |
| `association/dashboard/dashboard.page.html`, `admin/dashboard/dashboard.page.html` | bell added to both dashboards' headers |
| `association/statistics/…page.html`, `association/registrations/…page.html`, `association/change-password/change-password.page.html` | bell on every association page (Account Settings added 2026-11-13) |
| `register/register.page.html` | success pop-up: "Pendaftaran Dihantar / Registration Submitted…" (waits for approval, email when approved) |
| `login/login.page.ts` | `showRegistrationStatus()` pop-up for login codes `REGISTRATION_PENDING` / `REGISTRATION_REJECTED` |
| `services/http-interceptor.service.ts` | no generic 403 toast on `/auth/login` (the login page explains it); signed-out messages for both codes |
| `src/global.scss` | `.alert-btn-confirm` (bold green alert button) and `ion-alert.alert-side-by-side` (two buttons on one line) |

## 4. The page

- **Search:** company, company email, owner name / username / email. Debounced
  350 ms, then searched on the server.
- **Tabs:** a full-width green bar, with an icon above each label
  (`person-add`, `people`, `person-remove`). Pending shows a red count badge;
  the other tabs show the count in brackets.
- **Table:**
  - every tab: Company, Owner (name + email), Submitted, Status, Action ✎;
  - not Pending: also Updated (date + "oleh/by");
  - Inactive: also Reason;
  - superadmins also see an Association column.
  - The "Menunggu/Waiting" column was removed on request; the API still sends
    `waiting_days`.
- **Pagination:** 10 per page.
- **Note under the table:** "Ahli persatuan anda sahaja. / Your association's
  members only." (association users).

### ✎ Review pop-up

- An `ion-modal` with **auto height**. There's no `ion-content` inside, which
  would collapse with `height: auto`; `.review-content` scrolls when taller
  than 92vh (phones).
- Content:
  - header: status chip;
  - banner: "Aktif/Active since … by …", or "Tidak aktif/Inactive since … by
    …" with the reason. "since" is left out when there's no decision date
    (companies from before the feature);
  - owner & company details (`addressText()` skips empty parts);
  - the four documents. "Buka/Open" opens a new tab on this page.
- Buttons are **centred** and depend on the status (§1).
- Confirmation pop-ups:
  - **Approve / Activate:** `ion-alert` with `cssClass: 'alert-side-by-side'`,
    buttons **[Batal/Cancel] [Luluskan/Approve | Aktifkan/Activate]**, the
    action in bold green.
  - **Reject / Deactivate:** `ion-alert` with a required reason textarea
    (≤ 1000). **[Batal/Cancel] [Hantar/Submit]**, Submit in red
    (`alert-btn-danger`). An empty reason shows a warning and keeps the
    pop-up open.
- After a decision: "Menyimpan / Saving..." spinner, a toast ("… diluluskan /
  approved", "… dinyahaktifkan / deactivated", etc.), the pop-up closes, and the
  list reloads. The backend sends the email in the background, so this takes
  about a second, not the ~4 s Gmail needs.

## 5. Operator side

- **Register:** the association field was already required by the form
  (`isSection1Valid`). The backend now refuses registrations without one.
- **Login while pending:** pop-up "Menunggu kelulusan / Awaiting approval".
- **Login while inactive:** pop-up "Akaun tidak aktif / Account inactive",
  showing the reason.
- **Signed in when deactivated:** signed out on the next request, with the same
  message (interceptor `sessionEndedMessage`).

## 6. Related changes in the same release

- **Header logo** (`_components/header-logo/header-logo.component.ts`):
  operators with no logo uploaded now see the grey building icon instead of
  their association's logo. Association accounts still show their association
  logo.
- The "Pending Registrations" card that was briefly on the association BI
  dashboard was **removed** on request. The Power BI section is unchanged.

## 7. Tests

- `ng build --configuration development` is clean after every change. The
  frontend unit tests (Karma) were **not** run for this feature.
- Browser tests (Puppeteer, scripts outside the repo, against a local backend):
  - approvals page: 30/30 (2026-10-30);
  - Pending → Approve → Deactivate → Activate with a login check after each
    step: 14/14 (2026-11-01);
  - header logo for an operator without a logo, and for an association account.

## 8. Release

1. Backend deployed and migrated first; association users log in again.
2. Web: normal deploy (the login-page version check reloads stale clients).
3. Android / iOS: needs a new app build to get these pages.

## 9. Follow-ups

- On this page, documents still open in a **new tab**. The Association
  Statistics page shows them in a pop-up (`openDocument` there); the same could
  be done here for consistency.
- The **Status** column is redundant inside a tab. It was offered for removal;
  no decision yet.
- The page title and menu still say "Registration Approvals" although the page
  now also manages active / inactive members. "Pengurusan Ahli / Member
  Management" was suggested.

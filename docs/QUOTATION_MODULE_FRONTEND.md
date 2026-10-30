# Sebut Harga / Quotation Module — Frontend

As-built reference for the quotation screens (branch
`Features/newfeatures29oct`, 2026-10-29 → 2026-10-30). The API, database,
permissions and conversion rules are documented in the backend repo at
`docs/QUOTATION_MODULE.md`; the change log for this branch is
`docs/debug/DEBUG_LOG_2026-10-30.md`.

> Stack: Ionic 8 + Angular 18 + Capacitor 7. The quotation pages are
> **online only**; the booking created from a quotation still goes through the
> normal offline queue.

---

## 1. Overview

Operators make a quotation (price offer) for a customer, share it as a PDF,
and when the customer agrees convert it into:

- **Tempahan/Booking** — opens Add Booking pre-filled (deposit paid later), or
- **Resit/Receipt** — opens E-Receipt pre-filled (paid in full now).

Statuses shown: **Dihantar/Sent**, **Tamat/Expired** (sent and past its
valid-until date), **Diterima/Accepted** (converted), **Dibatalkan/Cancelled**.
There is no draft and no delete.

## 2. Routes, menu, permissions

| Route | Page | Permission |
|---|---|---|
| `/quotation` | list | `quotation:read` |
| `/quotation/add` | form (add) | `quotation:create` |
| `/quotation/edit/:id` | form (edit) | `quotation:update` |
| `/quotation/:id` | detail | `quotation:read` |

All use `authGuard` + `permissionGuard` (`app-routing.module.ts`). Menu item
**"Quotation / Sebut Harga"** (`services/menu.service.ts`) for operator_admin
and operator_staff with `quotation:read`; not offline-capable.

Sidebar order for operators is now: Dashboard · **Quotation** · Booking ·
My Transaction · E-Receipt · My Profile · User Management · Master Data.

## 3. Files

| File | Role |
|---|---|
| `quotation/quotation.models.ts` | types, status labels, standard notes & terms text |
| `quotation/quotation-page.scss` | shared page chrome + status chip colours |
| `quotation/list/*` | list page |
| `quotation/form/*` | add / edit form |
| `quotation/detail/*` | detail page |
| `services/quotation.service.ts` | API calls (list, get, create, update, cancel, PDF, booking draft, company terms) |
| `utils/quotation-prefill.util.ts` | loads the booking draft and maps it for the booking forms |
| `utils/booking-detail.mapper.ts` | **extracted** shared `mapBookingToDetail` (was duplicated in booking-edit and booking-detail) |

## 4. List page (`/quotation`)

- Search (quotation no. `QT_0007` / name / phone), debounced.
- **Tarikh Dicipta / Created Date** range: *Dari / From* and *Hingga / To*
  fields open the shared date pop-up; a backwards range is impossible (the
  other end moves along); **Kosongkan/Clear** resets. Filtered on the server
  by Malaysia day.
- **Status ⇅** column header: tap to cycle All → Sent → Accepted → Expired →
  Cancelled (header shows e.g. "Dihantar/Sent ▲"), like the Booking list.
- Columns: actions · No. · Customer (name + phone) · Total · Created Date ·
  Valid Until (red + "n days left" while sent) · Status.
- Row icons: view; edit (disabled unless editable); PDF (disabled when
  cancelled). Paging like the booking list. Offline → "needs internet" note.

## 5. Form (`/quotation/add`, `/quotation/edit/:id`)

Sections:
1. **Customer** — full name*, phone* (digits, `+`, `-`, spaces), email,
   Domestik / Antarabangsa / both (full-width row), pax with the booking forms'
   labels ("Bilangan Orang/No. of Pax (Domestik)" …).
2. **Quotation details** — quotation date* (today), valid until* (follows the
   date +7 until changed by hand), **Prepared By** (free text, not the login).
3. **Items*** — the package item card UI: company (own company listed first,
   "Produk anda / Your product" tag), product type, service (only the company's
   active products of that type, no duplicates per company), price (RM, 2
   decimals), activity date + optional time or stay start / end. Our own
   booked dates are marked in the date pop-up for our items only; other
   companies' calendars stay private. Add More + live Total Payment box.
4. **Notes & Terms** — starts with the **company's saved default** (else the
   standard text). Buttons: **Use Standard Text** and **Save Default** (saves
   the box as the company default; greyed when already equal). Each quotation
   keeps its own copy.

Buttons: **Batal/Cancel** · **Simpan Sebut Harga/Save Quotation**. Saving shows
a "Saving quotation…" overlay, then a pop-up **Quotation Created** /
**Quotation Updated** → OK opens the detail page. Errors: pop-up "Please check
the form — n thing(s) need fixing" + red list, or "Not Saved" with the server
message. The same rules are enforced by the server.

Autofill: neutral field names, `autocomplete/autocorrect/aria-autocomplete`
off and hidden trap fields (as in the booking forms) so Edge's "Saved info"
pop-up doesn't cover the company dropdown. Inputs clean themselves as you type
(`cleanInput()` writes the cleaned value back to the box — see the log §7).

Opening the edit URL of a quotation that can't be edited (accepted /
cancelled) shows a warning and returns to its detail page.

## 6. Detail page (`/quotation/:id`)

- Top row: **QT_0048** + status badge on the left; **PDF Quotation**,
  **Tempahan/Booking**, **Resit/Receipt** on the right (stack on phones).
- Banners: Accepted ("Converted to a booking" + *View booking* link), Expired
  ("Edit to extend the valid-until date before converting"), Cancelled.
- Cards: Quotation Details · To; items table (Itinerary Date / Time); total;
  notes & terms.
- Bottom: **Batal Sebut Harga/Cancel Quotation** (red, left) · **Edit Sebut
  Harga/Edit Quotation** (yellow, right); a lone button spans the row. The
  cancel confirmation lists "Ya, batalkan/Yes, cancel" above "Tidak/No".
- Buttons follow the server's `can_*` flags (status + permissions): e.g. staff
  have no Cancel, accepted shows only the PDF, cancelled shows nothing.
- PDF: downloaded on the web, share sheet on Android
  (`NativeDownloadService`).

## 7. Conversion flow

1. Detail → **Tempahan/Booking** opens `/booking-home/add?quotation=<id>`;
   **Resit/Receipt** opens `/e-receipt/add/<type>?quotation=<id>` (type =
   package for 2+ items, else the item's type; a wrong type redirects).
2. The page calls `loadQuotationPrefill()` (`GET …/booking-draft`) and passes
   the result to the booking form's new **`@Input() prefill`**. A green banner
   shows "Dari sebut harga / From quotation QT_0048". On Add Booking the type
   radios are locked.
3. Pre-filled: customer, pax, nationality, items / product, dates, times,
   prices, total, **Operator Name = Prepared By**. Deposit stays empty.
4. Submit adds `quotation_id` to the create payload → offline queue → server
   creates the booking and marks the quotation accepted in one transaction.
5. **Kembali** on these pages returns to the quotation (not the E-Receipt menu
   / booking list).
6. After Convert to Receipt the receipt page opens with
   `?from=quotation&date=<first day>`; its back button reads **Kembali Ke
   Tempahan** and opens **Booking in calendar view on that day** with the new
   booking listed (`booking-home` reads `?view=calendar&date=`).

`prefill` (activity / accommodation / package forms): add mode only; edit and
view still load `booking`. With a prefill, the package form also loads each
company's services so items can be changed.

## 8. Offline

Quotation pages need the network (list / detail / form show a clear message
instead of failing). Loading a quotation into Add Booking / E-Receipt needs the
network; once loaded, submitting works offline like any booking.

## 9. Tests

Browser QA against the built app + local backend (2026-10-30), scripts outside
the repo:

- **Flow (47/47):** menu, add (company / type / service pickers, dates, live
  total), save pop-up, edit, Convert to Booking (pre-filled, locked type,
  Kembali back to quotation), Convert to Receipt (pre-filled, receipt page,
  back to calendar on the day), list.
- **QA (47/47):** form validation pop-up + red list, own-product rule, inputs
  cleaning themselves, Use Standard Text / Save Default and the next new
  quotation using it, valid-until following the date, edit URL of an accepted
  quotation, buttons per status and role, cancel confirmation order and
  result, status filter cycle, disabled PDF / edit icons, search, date range
  (pop-up, empty result, no backwards range, clear), no sideways scrolling on
  a 390-px phone (form, list, detail), offline message, **no JavaScript errors**.

Not covered: the native Android share sheet — check once on the device build.

## 10. Release

Deploy the backend (two migrations) first; operators log in again. Then the
website and the Android build — see `docs/debug/DEBUG_LOG_2026-10-30.md` §9.

# FileUrlService — Shared File/Image URL Resolution (2026-08-18)

Status: Active
Owner: Frontend Team
Scope: How the app resolves a stored company logo/document value into a displayable URL

## 1. What changed

Before this update, 12 different files each reimplemented their own logic for turning a stored file/image value (which can be a legacy base64 blob, a legacy bare filename, a new `/uploads/...` path, or a full URL) into something an `<img>`/`<iframe>` could actually load — and the implementations disagreed with each other, so the same stored value could render on one screen and break on another.

That logic is now centralized in one service:

- [`src/app/services/file-url.service.ts`](../src/app/services/file-url.service.ts) — `FileUrlService.resolve(value, options?)`

## 2. Usage

```ts
constructor(private fileUrlService: FileUrlService) {}

get logoSrc(): string {
  return this.fileUrlService.resolve(this.company.operator_logo_image, {
    base64MimeType: 'image/png', // used only if the value turns out to be a bare base64 blob
  });
}
```

For screens that need the old "assume it's a bare filename under a known folder" behavior (accommodation/activity images — see caveat below), pass `legacySubdir`:

```ts
this.fileUrlService.resolve(imagePath, {
  base64MimeType: 'image/jpeg',
  legacySubdir: 'operator-activities',
});
```

Resolution order: `data:`/`http(s)://`/`blob:`/`assets/` as-is → `/uploads/...` or `uploads/...` prefixed with `environment.API` → base64 heuristic → `legacySubdir` fallback if provided → returned as-is.

## 3. Files migrated to use it

`header-logo.component.ts`, `notification-panel.component.ts`, `notifications.page.ts`, `company-profile.page.ts`, `activity-operator-detail.page.ts`, `receipt.page.ts`, `receipt-package.page.ts`, `receipt-activity.page.ts`, `my-transaction.page.ts`, `accomodation-detail.page.ts`, `activity-operator-list.page.ts`, `home.page.ts`.

## 4. Caveat

The 3 tourist-facing pages (`accomodation-detail`, `activity-operator-list`, `home`) use the `legacySubdir` option to preserve their pre-existing "assume a bare filename under `/uploads/<folder>/`" behavior. At review time, no backend upload path was actually found for accommodation/activity images (no multer file field, no `uploads/accommodations` directory on disk) — the `image` field appears to be assigned directly from the request body as a plain string. This wasn't confirmed as dead code, so the behavior was preserved as-is rather than changed; worth confirming in a future pass.

## 5. Full review

This was one part of a larger full-stack review covering backend upload security hardening and deployment persistence. See `FILE_UPLOAD_STORAGE_REVIEW_2026-08-18.md` in the **backend** repo's `docs/` folder for the complete writeup.

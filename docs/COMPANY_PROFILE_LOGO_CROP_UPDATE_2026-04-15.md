# Company Profile Logo Crop Update (2026-04-15)

Status: Active  
Owner: Frontend Team  
Scope: Operator Company Profile logo replacement flow with pre-upload image cropping

## 1. Objective

This update improves the operator logo editing experience in Company Profile by adding a crop step before upload.

Before:

- user selected logo file directly
- image was uploaded as-is

Now:

- user selects JPG/PNG
- crop modal opens
- user adjusts crop area and confirms
- cropped result is previewed and uploaded

## 2. New dependency

Added frontend dependency:

- `ngx-image-cropper` (version `^9.1.6`)

Files updated:

- `package.json`
- `package-lock.json`

Install command used:

- `npm install ngx-image-cropper --legacy-peer-deps`

Note:

- This is an npm package dependency (not an npx runtime command).
- `--legacy-peer-deps` was used because the workspace currently has peer dependency conflicts in lint-related packages.

## 3. Feature behavior

### 3.1 User flow

1. Operator opens `Company Profile` and enters edit mode.
2. User taps `Upload Logo`.
3. Crop modal opens with square crop settings.
4. User taps `Apply Crop`.
5. Cropped image is set as logo preview.
6. User taps `Update My Profile` to submit.

### 3.2 Validation rules

- Logo accepts image files only: JPG, JPEG, PNG
- Max logo file size: 1MB
- Total upload size policy for profile update remains: 10MB

### 3.3 Replace policy

- Replace only (no Remove Logo action)

## 4. Technical implementation

### 4.1 Frontend wiring

- Imported cropper component in module:
  - `src/app/company-profile/company-profile.module.ts`
- Added crop modal markup and cropper element:
  - `src/app/company-profile/company-profile.page.html`
- Added crop flow handlers and conversion utilities:
  - `src/app/company-profile/company-profile.page.ts`

Key methods:

- `onLogoSelected(...)`
- `onLogoCropped(...)`
- `applyLogoCrop()`
- `cancelLogoCrop()`
- `onLogoCropLoadFailed()`

Key payload behavior:

- Appends cropped logo file as `operator_logo_image` in `FormData` during profile update.

### 4.2 Cropper configuration

Cropper settings in template:

- `maintainAspectRatio = true`
- `aspectRatio = 1 / 1`
- `roundCropper = true`
- `resizeToWidth = 512`
- `onlyScaleDown = true`
- output format bound to selected file type (`png` / `jpeg`)

### 4.3 Modal button styling

Buttons were normalized so Cancel and Apply share the same base shape/size while keeping different colors.

## 5. Backend compatibility

Backend already supports logo update via user update endpoint.

Relevant enforcement already in place:

- logo MIME is image-only in upload middleware (`image/jpeg`, `image/png`)
- logo field accepted as `operator_logo_image` (also `company_logo` alias path remains)

## 6. Verification summary

Validated:

- frontend build succeeds after crop integration
- no Company Profile style-budget warning introduced by final version
- crop modal opens and applies cropped preview correctly

Known existing warnings (unrelated to this feature) still appear in build logs:

- unused TypeScript compilation entries
- CommonJS optimization bailout warnings

## 7. Files touched for this feature

Frontend:

- `src/app/company-profile/company-profile.module.ts`
- `src/app/company-profile/company-profile.page.ts`
- `src/app/company-profile/company-profile.page.html`
- `src/app/company-profile/company-profile.page.scss`
- `package.json`
- `package-lock.json`

## 8. Quick test checklist

1. Open Company Profile as operator.
2. Enter edit mode.
3. Choose PNG/JPG logo under 1MB.
4. Confirm crop modal appears.
5. Change crop and click `Apply Crop`.
6. Confirm logo preview updates.
7. Save profile and refresh page.
8. Confirm updated logo persists in Company Profile and header logo.
9. Try selecting PDF logo and verify rejection.
10. Try selecting image >1MB and verify rejection.

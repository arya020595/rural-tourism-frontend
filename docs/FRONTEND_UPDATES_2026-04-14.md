# Frontend Update Report (2026-04-14)

Status: Active  
Owner: Frontend Team  
Primary scope: canonical auth alignment, route RBAC enforcement, permission-driven UI rendering, shared side-nav stabilization, and ownership field normalization

## 1. Release objective

This frontend cycle aligned Ionic/Angular behavior with backend RBAC and canonical auth contracts while preserving compatibility for transitional backend payloads.

Primary intent:

- move to canonical auth endpoints and reduce role-specific login branching
- enforce role + permission checks at route and template levels
- stabilize post-login session/profile synchronization
- consolidate duplicate side-menu implementations into a shared component
- migrate operator ownership payloads to `user_id`

## 2. Scope boundaries for this phase

Included:

- login/auth/session contract alignment
- permission-aware route guards and template directives
- shared side navigation and context-based menu filtering
- tourist and association flow compatibility through canonical login

Deferred:

- admin page module rollout in frontend (admin routes/pages are intentionally not active in this iteration)
- full endpoint-by-endpoint legacy payload retirement

## 3. Auth contract alignment

### 3.1 Canonical endpoints adopted

`src/app/services/api.service.ts` now uses canonical auth and registration contracts:

- login -> `POST /api/auth/login`
- register -> `POST /api/auth/register` with `user_type`
- association list for public registration UX -> `GET /api/associations/public`

### 3.2 Centralized session logic

`src/app/services/auth.service.ts` now provides:

- normalized role + permission state handling
- mixed identity support (`id`, `unified_user_id`, `legacy_user_id`, role-specific IDs)
- startup refresh via `GET /api/auth/me`
- profile merge helper `syncUserProfile(...)` to keep JWT claims authoritative
- unified logout handling to `/login`

## 4. Route-level RBAC integration

### 4.1 Added guards

- `src/app/auth.guard.ts` (centralized auth-state check)
- `src/app/role.guard.ts`
- `src/app/permission.guard.ts`
- `src/app/login-redirect.guard.ts`

### 4.2 Route metadata enforcement

`src/app/app-routing.module.ts` applies `roles`, `permissions`, and `loginRole` metadata across protected routes.

Behavior outcomes:

- unauthenticated access redirects to `/login` with role-aware query params
- role mismatch and permission mismatch route to unauthorized UX
- legacy role-entry URLs are normalized to `/login`

## 5. Login flow consolidation

### 5.1 Shared login entry retained

`src/app/login/login.page.ts` now handles canonical login response and role-based post-login branching for active role dashboards.

### 5.2 Legacy login pages removed

Removed duplicate role-specific login modules/pages:

- `src/app/tourist/login/*`
- `src/app/association/login/*`

Routing now redirects:

- `/role` -> `/login`
- `/tourist/login` -> `/login`
- `/association/login` -> `/login`

## 6. Permission-aware UI rendering

### 6.1 New shared permission infrastructure

- `src/app/services/permission.service.ts`
- `src/app/_shared/has-permission.directive.ts`

### 6.2 Pages wired to permission checks

Representative updates:

- `src/app/operator-bookings/operator-bookings.page.html`
- `src/app/activity-and-accommodation-management/activity-and-accommodation-management.page.html`
- `src/app/home/home.page.html`

Outcome:

- action buttons and segments are hidden when permissions are missing

## 7. Shared side navigation refactor

### 7.1 Reusable side-nav component

Added:

- `src/app/_shared/side-nav/side-nav.component.ts`
- `src/app/_shared/side-nav/side-nav.component.html`
- `src/app/_shared/side-nav/side-nav.component.scss`

Shared module updated in `src/app/_shared/shared.module.ts` to export:

- `HeaderLogoComponent`
- `HasPermissionDirective`
- `SideNavComponent`

### 7.2 Menu configuration by role context

Added `src/app/services/menu.service.ts` with menu contexts:

- operator
- tourist
- association
- admin (currently empty in this phase)

### 7.3 Page migration to shared side-nav

Updated side-menu rendering in:

- `src/app/home/*`
- `src/app/e-receipt/*`
- `src/app/tourist/home/*`
- `src/app/association/dashboard/*`

## 8. Session/profile synchronization fixes

Direct profile overwrites were replaced with auth-service merge behavior in:

- `src/app/app.component.ts`
- `src/app/home/home.page.ts`
- `src/app/e-receipt/e-receipt.page.ts`

This avoids dropping role/permission claims while still refreshing profile fields.

## 9. Ownership field normalization (`rt_user_id` -> `user_id`)

Frontend payloads and readers were aligned to `user_id` in active flows, including:

- `src/app/add-item/add-item.page.ts`
- `src/app/tourist/activity-booking/activity-booking.page.ts`
- `src/app/tourist/activity-operator-detail/activity-operator-detail.page.ts`
- `src/app/tourist/confirm-booking-details/confirm-booking-details.page.ts`
- related API methods in `src/app/services/api.service.ts`

## 10. Unauthorized handling and interceptor behavior

### 10.1 Unauthorized route

Added:

- `src/app/unauthorized/unauthorized-routing.module.ts`
- `src/app/unauthorized/unauthorized.module.ts`
- `src/app/unauthorized/unauthorized.page.ts`
- `src/app/unauthorized/unauthorized.page.html`
- `src/app/unauthorized/unauthorized.page.scss`

### 10.2 Interceptor alignment

`src/app/services/http-interceptor.service.ts` now treats `/auth/login` as the canonical login request and redirects expired sessions to `/login`.

## 11. UI/UX stabilization details

- `src/app/_components/header-logo/header-logo.component.ts` improved logo source normalization:
  - supports direct URL, uploads path, and base64
  - suppresses default logo fallback noise
  - watches storage snapshots safely
- login page text and spacing refreshed in:
  - `src/app/login/login.page.html`
  - `src/app/login/login.page.scss`

## 12. Current behavior notes

- RBAC guards and permission directive are active for operator/tourist/association flows.
- Admin role is recognized in auth/permission logic, but admin frontend modules/routes are intentionally not active in this phase.

## 13. Quick index of major touched frontend files

### Auth and guards

- `src/app/services/auth.service.ts`
- `src/app/services/api.service.ts`
- `src/app/auth.guard.ts`
- `src/app/role.guard.ts`
- `src/app/permission.guard.ts`
- `src/app/login-redirect.guard.ts`
- `src/app/app-routing.module.ts`

### Shared infrastructure

- `src/app/_shared/shared.module.ts`
- `src/app/_shared/has-permission.directive.ts`
- `src/app/_shared/side-nav/*`
- `src/app/services/menu.service.ts`
- `src/app/services/permission.service.ts`

### Navigation/session integration pages

- `src/app/app.component.ts`
- `src/app/home/*`
- `src/app/e-receipt/*`
- `src/app/tourist/home/*`
- `src/app/association/dashboard/*`

### Contract-alignment touchpoints

- `src/app/add-item/add-item.page.ts`
- `src/app/tourist/activity-booking/activity-booking.page.ts`
- `src/app/tourist/activity-operator-detail/activity-operator-detail.page.ts`
- `src/app/tourist/confirm-booking-details/confirm-booking-details.page.ts`
- `src/app/tourist/register/register.page.ts`
- `src/app/register/register.page.ts`

### Removed duplicate login implementations

- `src/app/tourist/login/*`
- `src/app/association/login/*`

## 14. Recommended validation checklist

1. Login via `/login` for operator/tourist/association and verify role-correct landing.
2. Access protected route directly while logged out and verify redirect with query params.
3. Access route without required permissions and verify `/unauthorized`.
4. Verify side-nav menus differ correctly by context and permission set.
5. Verify booking/operator pages hide receipt actions when permissions are absent.
6. Verify add-item and operator booking flows use `user_id` consistently.

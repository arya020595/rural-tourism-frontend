# Postmortem: Uploaded Images Report "Success" but 404 on View (2026-08-19)

Status: Resolved
Owner: Frontend/Infra
Scope: Every JPG/PNG uploaded through `/company-profile` (company logo, MOTAC license, trading/operation license, homestay certificate) since the Docker/nginx migration

## 1. Summary

Uploading a company logo or license/certificate image on `/company-profile` always returned a success response and updated the database with a valid file path — but the resulting `<img src="https://staging.rutec.my/uploads/companies/<uuid>.png">` always 404'd. This was **not** an upload bug: the backend wrote every file correctly, every time. The fault was in the nginx config sitting in front of both containers, which routed requests for uploaded images to the wrong place before they ever reached the backend.

## 2. Impact

- Affected: **every** company logo, MOTAC license, trading/operation license, or homestay certificate uploaded as a **JPG or PNG** through `/company-profile` since the nginx-fronted Docker setup went live (commit `10ca4c0`, 2026-03-05) — roughly 5.5 months.
- Not affected: PDF uploads (the conflicting nginx rule didn't match `.pdf`), and pre-existing legacy documents stored as inline base64 in the DB (rendered client-side from the API response, never fetched over HTTP).
- No data was lost. Every uploaded file was written successfully and is still sitting in the backend's Docker volume (`rt_backend_uploads_staging`) — only the public serving path was broken.

## 3. Root cause

[`rural-tourism-frontend/nginx/nginx.conf`](../nginx/nginx.conf) had two `location` blocks that both matched requests for an uploaded image, and nginx picked the wrong one:

```nginx
# Meant to proxy uploaded-file requests to the backend
location /uploads/ {
    proxy_pass http://backend:3000/uploads/;
    ...
}

# Meant to add long-lived cache headers to the SPA's own built JS/CSS/icons
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    ...
    try_files $uri =404;
}
```

nginx's location-matching rule: a **regex location always wins over a plain prefix location**, regardless of the order they appear in the file, unless the prefix is marked `^~` (which forces an immediate match with no further regex evaluation). `/uploads/` had no `^~`.

The backend generates every uploaded image's filename as `<uuid>.png` or `<uuid>.jpg` — so **every single image upload** matched the static-asset-caching regex. That block runs `try_files $uri =404` against `root /usr/share/nginx/html` — the built Angular app's own static output, not the backend's uploads volume. No such file exists there, so nginx returned 404 immediately, without the request ever reaching the backend or its `/app/uploads` volume.

Meanwhile the actual upload/write path was, and still is, entirely correct:

- `PUT /api/companies/:id` → `multer` (memory storage) → `verifyFileType()` (magic-byte check) → `saveBufferToDisk()` writes synchronously to the Docker-managed uploads volume → returns `/uploads/companies/<uuid>.png`, which the API includes in its 200 response.
- The frontend's success toast fires on any 2xx PUT response — it never independently checks that the returned image URL is actually reachable, so nothing in the upload request/response cycle could have surfaced this. The two failures (proxy 404, upload success) are on completely different code paths that never talk to each other.

## 4. Why this wasn't caught sooner

- Both conflicting `location` blocks were added together in the original commit that introduced this nginx config (`10ca4c0`, "Implement Docker migration with CI/CD workflows and Nginx configuration", 2026-03-05) — the bug existed from day one of this deployment setup.
- A prior fix attempt on 2026-08-13 ("FIX issue upload file", `f88c40f`) raised `client_max_body_size` and the per-file/total upload size limits (1MB→5MB, 10MB→20MB). That fixed a different, superficially similar symptom — 413 errors on larger uploads — but didn't touch location-block ordering, so the 404-after-success behavior for images was untouched and kept happening.
- Testing the backend directly (e.g. hitting the API on its own port, or checking the file exists via SSH) always looked correct, because it *is* correct — the bug only appears when going through the public domain/nginx, which is also exactly how a real user's browser accesses it.

## 5. How it was found

Reported by the user with a concrete example: uploaded a logo, got a success toast, but `<img>` never rendered. Diagnosed by reproducing directly against staging rather than guessing from code:

1. SSH'd into the staging host and used `docker exec` on the backend container to confirm the exact uploaded file existed on disk in the Docker volume, with the correct byte size.
2. `curl`'d the file directly against the backend container's exposed port (bypassing nginx) → **200**.
3. `curl`'d the same file through the public domain (through nginx) → **404**.

That isolated the fault to the nginx layer specifically, which led directly to the two conflicting `location` blocks above.

## 6. Fix

One-line change in [`nginx/nginx.conf`](../nginx/nginx.conf):

```diff
-    location /uploads/ {
+    location ^~ /uploads/ {
         proxy_pass http://backend:3000/uploads/;
```

`^~` makes nginx stop evaluating regex locations once `/uploads/` matches, so the proxy always wins regardless of the requested file's extension. No backend or Angular application code changed — the write path was never broken.

## 7. Verification

- `curl` before/after the fix against the same previously-uploaded file: 404 → 200, with matching content-type and byte size to the file on disk.
- Live browser reproduction (Playwright, logged in as a real test account): uploaded a brand-new test document through the actual UI, saved, then clicked "View/Lihat" — the new file round-tripped through the real upload → save → serve cycle and rendered with a 200 response, end to end.

## 8. Follow-ups

- **Add a post-deploy smoke test** that uploads a small test image and then fetches the returned URL through the real public domain (not directly against the backend) — this class of bug (backend correct, proxy wrong) is invisible to any check that only exercises the backend in isolation.
- **Consider tightening the frontend's success condition**: `saveProfile()` currently shows "Profile updated successfully" on any 2xx PUT response regardless of whether a returned file URL is actually present/reachable. Not the cause of this incident, but a gap that would let a future regression through the same way.
- **Finish the legacy base64-in-DB migration** (`rural-tourism-backend/scripts/migrate-company-files-to-disk.js` — see [`FILE_URL_SERVICE_2026-08-18.md`](FILE_URL_SERVICE_2026-08-18.md)) so all document fields use the same disk-backed `/uploads/...` path uniformly, instead of some records still carrying inline base64 blobs.

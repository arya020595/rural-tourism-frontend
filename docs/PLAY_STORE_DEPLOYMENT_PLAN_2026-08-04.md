# Play Store Deployment Plan — RuTEC

**Actionable plan to publish the app to the Google Play Store.**

> Created: 2026-08-04
> App: Rural Tourism Sabah (RuTEC) · `com.sabah.ruraltourism`
> Stack: Ionic 8 + Angular 18 + Capacitor 7

This is the **plan and the runbook** — what is done, what is blocking, and a
numbered step-by-step guide with the actual commands (§12).

- §1–§11 — status, critical path, phases, risks
- **§12 — step-by-step execution guide (start here when you're ready to act)**
- §13 — summary checklist

Background reference: [`PLAY_STORE_SETUP_GUIDE.md`](./PLAY_STORE_SETUP_GUIDE.md).
Developer-account creation:
[`PLAY_STORE_ACCOUNT_REQUIREMENTS.md`](./PLAY_STORE_ACCOUNT_REQUIREMENTS.md).

---

## 1. Current status

| Item | State | Notes |
|---|---|---|
| Google Play developer account | ✅ Have | Account exists |
| Domain name | ✅ Have | `rutec.my` (frontend), `api.rutec.my` (backend) |
| App ID `com.sabah.ruraltourism` | ✅ Done | `capacitor.config.ts` + `build.gradle` |
| `native` build config + npm scripts | ✅ Done | `full-release`, `android:sync`, `android:apk`, `android:release` |
| `versionCode` / `versionName` | ✅ Done | `1` / `1.0.0` |
| `.gitignore` protects keystore | ✅ Done | `key.properties`, `*.keystore`, `*.jks` |
| In-app privacy policy page | ✅ Exists | `src/app/privacy-policy` — still needs a **public HTTPS URL** |
| **HTTPS production API** | ✅ **Done (verified 2026-08-10)** | `https://api.rutec.my/api` returns 200; CORS allows `capacitor://localhost`, so `NODE_ENV=production` is set correctly |
| **`environment.native.ts` uses HTTPS** | ✅ **Done (2026-08-10)** | Now `https://api.rutec.my/api` |
| **`capacitor.config.ts` production-safe** | ✅ **Done (2026-08-10)** | `cleartext` / `allowMixedContent` removed, `androidScheme: 'https'` |
| **Signing keystore + `signingConfigs`** | ❌ **BLOCKER** | No `key.properties`; no `signingConfigs` block in `build.gradle` |
| Store assets (icon, feature graphic, screenshots) | ❌ Not prepared | No `resources/` directory yet |

**Verdict:** the infrastructure blocker (HTTPS backend) is resolved and the app
now points at it. The remaining blocker is **code signing** (Step 6–8) — build
the AAB after that. Store assets can be prepared in parallel.

---

## 2. Critical path

```
[1] HTTPS backend on the domain      ← everything depends on this
        ↓
[2] Point the app at the HTTPS URL   (environment.native.ts)
        ↓
[3] Harden capacitor.config.ts       (remove cleartext / mixed content)
        ↓
[4] Code signing (keystore)          (can be prepared in parallel with 1–3)
        ↓
[5] Build + verify signed AAB
        ↓
[6] Store assets + privacy policy URL (can be prepared in parallel)
        ↓
[7] Play Console: internal testing → production
```

---

## 3. Phase 1 — Backend on HTTPS (blocker, infra)

**Owner:** infrastructure / whoever manages the server
**Why first:** Google Play rejects cleartext HTTP. Android also blocks it by
default. A production AAB built against `http://<ip>` will fail on-device and
in review.

Tasks:
1. Point the domain's DNS **A record** at the production server.
2. Deploy `rural-tourism-backend` on that server (if not already).
3. Install an SSL certificate (Let's Encrypt / certbot — free, auto-renewing).
4. Reverse-proxy (nginx) `443` → the backend port (currently `3008`).
5. Set the backend's `.env` for production:
   - `NODE_ENV=production` — **required**, this is what activates the CORS
     allowlist that includes the Capacitor origins (`capacitor://localhost`,
     `http://localhost`). Without it the mobile app's requests are rejected.
   - `CORS_ORIGIN*` → the production web domain(s).
   - `FRONTEND_URL` → the production frontend domain (password-reset links).
6. Run pending migrations on production (`npx sequelize-cli db:migrate`) —
   there are migrations not yet applied there (e.g. the booking recall audit
   columns).

**Exit criteria:** `https://<domain>/api` returns HTTP 200 from an external
network, with a valid (non-self-signed) certificate.

---

## 4. Phase 2 — Point the app at production (repo)

Once Phase 1 passes its exit criteria:

1. `src/environments/environment.native.ts`
   ```ts
   apiUrl: 'https://<domain>/api',
   API:    'https://<domain>',
   ```
2. `capacitor.config.ts` — remove the staging flags (the file is already
   commented "REMOVE before Play Store release"):
   - delete `cleartext: true`
   - delete `allowMixedContent: true`
   - `androidScheme: 'http'` → `'https'`

**Exit criteria:** a debug build installed on a real device can log in and load
bookings against the HTTPS API.

---

## 5. Phase 3 — Code signing (blocker)

**Can be prepared in parallel with Phases 1–2.**

1. Generate the release keystore **outside the repo** (see the setup guide for
   the exact `keytool` command).
2. **Back it up in at least 3 places** (USB, cloud, company vault) and store the
   passwords in a password manager.
3. Create `android/key.properties` (already git-ignored).
4. Add the `signingConfigs.release` block and `buildTypes.release.signingConfig`
   to `android/app/build.gradle`.
5. **Opt into Play App Signing** when uploading. Google then holds the real app
   signing key and you keep only an upload key — if the upload key is lost,
   Google can reset it. For a long-lived government/tourism app this is the
   safer default.

> ⚠️ Without Play App Signing, losing the keystore means the app can **never**
> be updated again under this listing.

**Exit criteria:** `gradlew bundleRelease` produces an AAB and
`jarsigner -verify` prints `jar verified.`

---

## 6. Phase 4 — Build the release AAB

```bash
# from rural-tourism-frontend/
npm run full-release       # ionic build --configuration=native + cap sync
cd android
gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Verify the signature:
```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
# expect: jar verified.
```

**Pre-flight checks before building:**
- [ ] `environment.native.ts` points at the **HTTPS** domain
- [ ] `capacitor.config.ts` has no `cleartext` / `allowMixedContent`
- [ ] `versionCode` is higher than any previously uploaded build
- [ ] Backend is live on HTTPS and migrations are applied

---

## 7. Phase 5 — Store assets & privacy policy

**Can be prepared in parallel.**

| Asset | Spec | Status |
|---|---|---|
| App icon | 512 × 512 PNG, no transparency | ❌ to prepare |
| Feature graphic | 1024 × 500 JPG/PNG | ❌ to prepare |
| Phone screenshots | ≥ 1080 × 1920, 2–8 images | ❌ to prepare |
| Privacy policy | Public HTTPS URL | ⚠️ in-app page exists; needs public hosting |

Suggested screenshots: booking calendar, add-booking form, receipt/e-receipt,
dashboard.

> The app already has a `privacy-policy` page. The simplest path is to host the
> same content at a public URL on the production domain and use that link in
> Play Console.

---

## 8. Phase 6 — Play Console rollout

1. Create the app (name, default language, Free).
2. Complete: **App Access** (provide a reviewer test account — an operator login
   with sample data), **Store Listing**, **Content Rating**, **Data Safety**,
   **Privacy Policy URL**.
3. **Internal testing first** — upload the AAB, add the team as testers, run for
   1–2 weeks on real devices.
4. Promote to **Production** with a staged rollout (start ~20%, monitor, then
   100%).

Google review typically takes 1–7 days.

---

## 9. Data Safety declarations (prepare answers)

The app collects, so declare honestly:
- **Personal info** — name, email, phone (bookings & accounts)
- **Financial info** — booking/payment amounts
- **Photos** — company logo / document uploads
- Mark **encrypted in transit: Yes** (true once HTTPS is live)
- Mark **users can request deletion: Yes** (state the contact route)

---

## 10. Post-launch: releasing updates

Bump both values in `android/app/build.gradle` for every upload:
```gradle
versionCode 2        // must increase by at least 1 each upload
versionName "1.0.1"
```
Then repeat Phase 4 and upload the new AAB.

---

## 11. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Keystore lost | Cannot ever update the app | 3+ backups **and** enable Play App Signing |
| Built against HTTP URL | Rejected / app cannot reach API | Pre-flight checklist in §6 |
| `NODE_ENV` not `production` on server | Mobile requests blocked by CORS | Verify env before release testing |
| Production migrations not run | Runtime 500s on new features | Run `db:migrate` as part of deploy |
| Privacy policy URL missing | Play Console blocks submission | Host before submitting |
| Play raises min `targetSdkVersion` | Upload rejected | Check requirement in Console; bump `variables.gradle` |

---

## 12. Step-by-step execution guide

Follow these in order. Each step states **who** does it and how to know it
worked. Steps marked ⚙️ are infrastructure; 💻 are repo changes; 🌐 are Play
Console.

---

### STEP 1 ⚙️ — Point the domain at the server

On your DNS provider (where the domain was bought):

1. Add an **A record**: `api` (or `@`) → your server's IP.
2. Wait for propagation (usually minutes, up to 24h).

**Verify:**
```bash
nslookup api.<your-domain>
# should return your server IP
```

---

### STEP 2 ⚙️ — Install nginx + SSL on the server

SSH into the production server.

```bash
# 1. Install nginx and certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Create the reverse proxy config
sudo nano /etc/nginx/sites-available/rutec-api
```

Paste (replace the domain):
```nginx
server {
    listen 80;
    server_name api.<your-domain>;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;   # PDF/image uploads
    }
}
```

```bash
# 3. Enable it and reload
sudo ln -s /etc/nginx/sites-available/rutec-api /etc/nginx/sites-enabled/
sudo nginx -t          # must print "syntax is ok"
sudo systemctl reload nginx

# 4. Issue the SSL certificate (certbot edits nginx for you)
sudo certbot --nginx -d api.<your-domain>

# 5. Confirm auto-renewal is armed
sudo certbot renew --dry-run
```

**Verify:**
```bash
curl -I https://api.<your-domain>/api
# expect HTTP/2 200 (or 401 — that still proves HTTPS works)
```

---

### STEP 3 ⚙️ — Configure the backend for production

On the server, in the backend folder:

```bash
# 1. Edit the environment
nano .env
```
Set at minimum:
```
NODE_ENV=production
PORT=3008
DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=...
JWT_SECRET=<a real secret, not the example>
CORS_ORIGIN=https://<your-web-domain>
FRONTEND_URL=https://<your-web-domain>
```

> `NODE_ENV=production` is **not optional** — it is what turns on the CORS
> allowlist containing `capacitor://localhost` and `http://localhost`. Without
> it the Android app's requests are refused.

```bash
# 2. Apply database migrations
npx sequelize-cli db:migrate

# 3. Restart the service (pm2 example)
pm2 restart rutec-api && pm2 logs --lines 50
```

**Verify:** log in from the web app against the new domain; check `pm2 logs`
shows no CORS or DB errors.

---

### STEP 4 💻 — Point the app at the HTTPS API

In `rural-tourism-frontend`:

`src/environments/environment.native.ts`
```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.<your-domain>/api',
  API: 'https://api.<your-domain>',
  enableDebugMode: false,
  logApiCalls: false,
};
```

**Verify:** `npx tsc --noEmit -p tsconfig.json` passes.

---

### STEP 5 💻 — Harden `capacitor.config.ts`

Replace the file with:
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabah.ruraltourism',
  appName: 'RuTEC',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
```

What changed: `androidScheme` `http` → `https`, and the staging-only
`cleartext` / `allowMixedContent` flags are removed.

**Verify:** the file contains no `cleartext` and no `allowMixedContent`.

---

### STEP 6 💻 — Generate the signing keystore

Run **once**, and store the file **outside** the repo.

```bash
# Windows (cmd) — create a folder outside the project
mkdir C:\Users\%USERNAME%\secure-keys

keytool -genkey -v ^
  -keystore "C:\Users\%USERNAME%\secure-keys\rutec-release.keystore" ^
  -alias rutec-key ^
  -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts (organisation, city Kota Kinabalu, state Sabah, country
`MY`) and set a strong password.

**Immediately after:**
1. Copy the `.keystore` to **at least 3** locations (USB, cloud, vault).
2. Save in a password manager: keystore path, store password, key password,
   alias `rutec-key`.

> ⚠️ Lose this file or its password and the app can never be updated on Play
> (unless Play App Signing is enabled — see Step 9).

---

### STEP 7 💻 — Create `android/key.properties`

Create `android/key.properties` (already git-ignored — never commit it):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=rutec-key
storeFile=C:\\Users\\YourName\\secure-keys\\rutec-release.keystore
```

> Windows paths need **double** backslashes.

**Verify:** `git status` does **not** list `android/key.properties`.

---

### STEP 8 💻 — Wire signing into `android/app/build.gradle`

Three edits to the existing file.

**8a.** At the very top, above `android {`:
```gradle
apply plugin: 'com.android.application'

def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

**8b.** Inside `android { ... }`, add a `signingConfigs` block just before
`buildTypes`:
```gradle
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
```

**8c.** Attach it to the release build type:
```gradle
    buildTypes {
        release {
            signingConfig signingConfigs.release   // ← add this line
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
```

**Verify:** `cd android && gradlew tasks` runs without a Gradle error.

---

### STEP 9 💻 — Build and verify the signed AAB

```bash
# from rural-tourism-frontend/
npm run full-release        # native build + cap sync

cd android
gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Verify the signature:**
```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
# expect: jar verified.
```

Also install the APK on a real phone and smoke-test against production:
```bash
gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```
Check: login works, bookings load, a receipt PDF opens.

---

### STEP 10 🌐 — Prepare store assets & privacy policy

1. **Icon** 512×512 PNG (no transparency).
2. **Feature graphic** 1024×500.
3. **Screenshots** ≥1080×1920, at least 2 — suggest booking calendar,
   add-booking form, receipt, dashboard.
4. **Privacy policy** — host the content of the in-app `privacy-policy` page at
   a public HTTPS URL (e.g. `https://<your-web-domain>/privacy-policy`) and
   confirm it opens in a browser.

---

### STEP 11 🌐 — Create the app in Play Console

1. [play.google.com/console](https://play.google.com/console) → **Create app**
2. Name `RuTEC` (or `Rural Tourism Sabah`), language, **App**, **Free**.
3. Complete each checklist section:
   - **App access** — provide a reviewer test login (an operator account with
     sample data) or Google cannot review the app.
   - **Store listing** — descriptions + the assets from Step 10.
   - **Content rating** — questionnaire.
   - **Data safety** — use the declarations in §9 of this plan.
   - **Privacy policy** — paste the public URL.
4. When prompted, **opt into Play App Signing**.

---

### STEP 12 🌐 — Internal testing, then production

```
Release → Testing → Internal testing → Create new release
  → upload app-release.aab → add testers → roll out
```

Run for 1–2 weeks on real devices. Then:

```
Release → Production → Create new release
  → upload AAB → staged rollout (start ~20%) → Submit for review
```

Review typically takes 1–7 days.

---

### STEP 13 💻 — For every future update

```gradle
versionCode 2         // must increase every upload
versionName "1.0.1"
```
Then repeat Step 9 and upload the new AAB.

---

## 13. Summary checklist

**Blockers**
- [ ] Backend live on `https://<domain>` with valid SSL
- [ ] `NODE_ENV=production` + migrations applied on the server
- [ ] `environment.native.ts` → HTTPS domain
- [ ] `capacitor.config.ts` → remove `cleartext` / `allowMixedContent`, scheme `https`
- [ ] Keystore generated, backed up, `key.properties` + `signingConfigs` wired

**Before submitting**
- [ ] Signed AAB built and `jarsigner` verified
- [ ] Tested on a real Android device against production
- [ ] Icon, feature graphic, screenshots ready
- [ ] Privacy policy hosted at a public HTTPS URL
- [ ] Play Console sections complete (Access, Listing, Rating, Data Safety)
- [ ] Internal testing round completed

---

_Related: [`PLAY_STORE_SETUP_GUIDE.md`](./PLAY_STORE_SETUP_GUIDE.md) (how-to) ·
[`PLAY_STORE_ACCOUNT_REQUIREMENTS.md`](./PLAY_STORE_ACCOUNT_REQUIREMENTS.md) (account)_

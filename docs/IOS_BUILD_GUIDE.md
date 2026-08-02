# 📱 RUTeC — iOS Implementation & Deployment Guide

**Complete, step-by-step guide to add iOS to the RUTeC app from scratch and ship it to the Apple App Store.**

> Last Updated: June 3, 2026
> App Version: 0.0.1
> Tech Stack: Ionic 8 + Angular 18 + Capacitor 7
> Status: **iOS not yet added** — this guide takes the project from zero to App Store.

---

## 📑 Table of Contents

1. [Current State & What This Guide Delivers](#current-state)
2. [Does the Backend Need Changes?](#backend)
3. [Prerequisites](#prerequisites)
4. [⚠️ Critical Blocker: HTTP API & iOS ATS](#critical-blocker)
5. [Phase 1 — Add the iOS Platform](#phase-1)
6. [Phase 2 — Configure the iOS Project](#phase-2)
7. [Phase 3 — App Icons & Splash Screen](#phase-3)
8. [Phase 4 — Run & Test Locally](#phase-4)
9. [Phase 5 — Code Signing](#phase-5)
10. [Phase 6 — Build & Archive](#phase-6)
11. [Phase 7 — App Store Connect & Submission](#phase-7)
12. [Implementation Checklist](#checklist)
13. [Android vs iOS Differences](#differences)
14. [Troubleshooting](#troubleshooting)
15. [Quick Reference Commands](#quick-reference)

---

<a name="current-state"></a>
## 🎯 Current State & What This Guide Delivers

### What already exists in this project

- ✅ Working Ionic + Angular + Capacitor app (Android is fully set up)
- ✅ `capacitor.config.ts` with `appId: com.sabah.ruraltourism`, `appName: RUTeC`
- ✅ Capacitor plugins: `app`, `haptics`, `keyboard`, `network`, `status-bar`, `filesystem`, `share`
- ✅ `@capacitor/assets` for icon/splash generation
- ✅ A `native` build configuration in `angular.json` using `environment.native.ts`
- ✅ `NativeDownloadService` for PDF downloads (works on iOS unchanged)
- ✅ Offline mode via Dexie/IndexedDB

### What does NOT exist yet (this guide creates it)

- ❌ `@capacitor/ios` package
- ❌ `ios/` native project folder
- ❌ iOS config in `capacitor.config.ts`
- ❌ iOS entries in `.gitignore`
- ❌ HTTPS API (currently HTTP — **blocks iOS**, see [Critical Blocker](#critical-blocker))
- ❌ Apple Developer account / certificates / App Store Connect listing

---

<a name="backend"></a>
## 🔌 Does the Backend Need Changes?

**No backend code changes are required.** The backend is a platform-agnostic REST API — it does not care whether the client is a browser, Android, or iOS.

**However, there is one infrastructure requirement:** the API **must be served over HTTPS** for iOS production builds. This is not a code change in the backend repo — it's a deployment/hosting concern (TLS certificate + reverse proxy). See the next section.

---

<a name="prerequisites"></a>
## 🛠️ Prerequisites

### Hardware — A Mac is mandatory

> ⚠️ **iOS apps can ONLY be built on macOS.** Xcode does not run on Windows or Linux. There is no workaround for the final build/signing step (cloud Mac services like MacStadium or GitHub Actions macOS runners are the only alternative if no physical Mac is available).

| Requirement | Minimum |
|---|---|
| **Mac** | macOS 14 (Sonoma) or higher (to run Xcode 15+) |
| **Storage** | ~20 GB free (Xcode + simulators) |
| **RAM** | 8 GB (16 GB recommended) |

### Software

| Software | Version | Install |
|---|---|---|
| **Xcode** | 15+ | Mac App Store |
| **Xcode Command Line Tools** | Latest | `xcode-select --install` |
| **CocoaPods** | 1.12+ | `sudo gem install cocoapods` |
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org) |
| **Ionic CLI** | >= 7.2 | `npm install -g @ionic/cli` |

### Accounts

| Account | Cost | Needed for |
|---|---|---|
| **Apple Developer Program** | $99/year | Signing & App Store publishing |
| **Apple ID** | Free | Signing in to Xcode |

Enroll at [developer.apple.com/programs](https://developer.apple.com/programs). Enrollment can take 24–48 hours to verify.

---

<a name="critical-blocker"></a>
## ⚠️ Critical Blocker: HTTP API & iOS App Transport Security

**This is the most important section of this guide. Read it before doing anything else.**

The current native config points to a plain-HTTP API:

```typescript
// src/environments/environment.native.ts  (CURRENT — HTTP)
export const environment = {
  production: true,
  apiUrl: 'http://46.202.163.155:3011/api',
  API: 'http://46.202.163.155:3011',
  ...
};
```

iOS enforces **App Transport Security (ATS)**, which **blocks all plain-HTTP network requests by default**. On Android this is allowed via `cleartext: true` + `allowMixedContent: true`, but **iOS will silently fail every API call** — the app will launch to a white/blank screen or "network error" with no obvious cause.

### You have two options:

#### ✅ Option A (Required for App Store) — Serve the API over HTTPS

1. Put the backend behind a domain with a valid TLS certificate (e.g. via nginx + Let's Encrypt, or a managed host).
2. Update `environment.native.ts` to the HTTPS URL:

   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://api.ruraltourism.sabah.gov.my/api',
     API: 'https://api.ruraltourism.sabah.gov.my',
     enableDebugMode: false,
     logApiCalls: false,
   };
   ```

3. Remove `cleartext: true` and `allowMixedContent: true` from `capacitor.config.ts` (see [Phase 2](#phase-2)).

> **Apple will reject the app** if it relies on `NSAllowsArbitraryLoads` without justification. HTTPS is the only sustainable path.

#### ⚠️ Option B (Development / TestFlight only) — Allow HTTP via ATS exception

Only for testing against the staging HTTP IP before HTTPS is ready. Add to `ios/App/App/Info.plist` (after [Phase 1](#phase-1)):

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

> ⚠️ **Remove this before App Store submission.** Leaving it in is a common rejection reason.

---

<a name="phase-1"></a>
## 📦 Phase 1 — Add the iOS Platform

> Run all of the following **on the Mac**, in the `rural-tourism-frontend` project root.

### Step 1.1 — Install iOS dependencies

```bash
# Match the project convention — it uses --legacy-peer-deps (mixed Capacitor v6/v7 plugins)
npm install --legacy-peer-deps

# Install the iOS platform package
npm install @capacitor/ios --legacy-peer-deps
```

### Step 1.2 — Build the web app first

Capacitor needs the `www/` folder to exist before adding a platform:

```bash
npm run android:build:native   # = ionic build --configuration=native (uses environment.native.ts)
```

> We reuse the existing `native` build configuration so iOS and Android use the same production environment. Make sure you've handled the [HTTPS blocker](#critical-blocker) first.

### Step 1.3 — Add the iOS project

```bash
npx cap add ios
```

This generates the `ios/` folder containing the Xcode workspace and CocoaPods setup.

### Step 1.4 — Sync web assets + plugins into iOS

```bash
npx cap sync ios
```

Expected output ends with:

```
✔ Updating iOS plugins
[info] Found 7 Capacitor plugins for ios:
       @capacitor/app
       @capacitor/filesystem
       @capacitor/haptics
       @capacitor/keyboard
       @capacitor/network
       @capacitor/share
       @capacitor/status-bar
✔ Sync finished
```

If you see a CocoaPods error, run `sudo gem install cocoapods && pod setup` and retry.

---

<a name="phase-2"></a>
## ⚙️ Phase 2 — Configure the iOS Project

### Step 2.1 — Add iOS config to `capacitor.config.ts`

Edit `capacitor.config.ts`. For **production**, the file should look like this (note HTTP allowances removed):

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabah.ruraltourism',
  appName: 'RUTeC',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
```

> For staging against the HTTP IP, keep `androidScheme: 'http'` + `cleartext: true` for Android, and use the [ATS exception](#critical-blocker) for iOS — but revert both before release.

Re-sync after editing config:

```bash
npx cap sync ios
```

### Step 2.2 — Add iOS entries to `.gitignore`

The project's `.gitignore` has **no iOS entries**. Without these, CocoaPods and build artifacts get committed. Append:

```gitignore
# iOS / Capacitor
ios/App/Pods/
ios/App/Podfile.lock
ios/App/App/public/
ios/App/build/
ios/App/output/
ios/capacitor-cordova-ios-plugins/
*.xcuserstate
xcuserdata/
DerivedData/
```

> Note: opinions differ on committing `Podfile.lock`. For a single-developer/single-Mac setup, ignoring it is fine; for a team, you may choose to commit it for reproducible installs.

### Step 2.3 — Set the display name & version (in Xcode)

```bash
npx cap open ios
```

In Xcode → select **App** target → **General** tab:

- **Display Name:** `RUTeC` (or `Rural Tourism Sabah` for the store)
- **Bundle Identifier:** `com.sabah.ruraltourism`
- **Version:** `1.0.0` (marketing version — equivalent to Android `versionName`)
- **Build:** `1` (increment every upload — equivalent to Android `versionCode`)

---

<a name="phase-3"></a>
## 🎨 Phase 3 — App Icons & Splash Screen

The project has `@capacitor/assets` installed, which generates all iOS icon and splash sizes from source images.

### Step 3.1 — Prepare source images

Create a `resources/` folder in the project root with:

| File | Size | Notes |
|---|---|---|
| `resources/icon.png` | 1024×1024px | App icon, no transparency, no rounded corners |
| `resources/splash.png` | 2732×2732px | Splash screen (centered logo on solid background) |
| `resources/splash-dark.png` | 2732×2732px | (Optional) dark-mode splash |

You can base these on the existing logos in `src/assets/icon/` (e.g. `Rural logo.png`, `512.png`).

### Step 3.2 — Generate assets

```bash
npx capacitor-assets generate --ios
```

This populates `ios/App/App/Assets.xcassets/` with all required icon and splash sizes.

### Step 3.3 — Re-sync

```bash
npx cap sync ios
```

---

<a name="phase-4"></a>
## ▶️ Phase 4 — Run & Test Locally

### Step 4.1 — Open in Xcode

```bash
npx cap open ios
```

> ⚠️ Capacitor opens `ios/App/App.xcworkspace` (the **workspace**, which includes Pods). Never open the bare `.xcodeproj`.

### Step 4.2 — Run on the iOS Simulator

1. In Xcode's device dropdown (top toolbar), pick a simulator (e.g. **iPhone 15**).
2. Click **Run** (▶️).
3. The app builds and launches in the simulator.

### Step 4.3 — Run on a physical iPhone

1. Connect the iPhone via USB.
2. On the iPhone: **Settings → Privacy & Security → Developer Mode → On** (iOS 16+), then restart.
3. In Xcode, select your device, click **Run**.
4. First launch: **Settings → General → VPN & Device Management → Trust** your developer certificate.

### Step 4.4 — Smoke-test the critical paths

- ✅ Login (confirms API connectivity — **fails immediately if the HTTPS/ATS blocker isn't resolved**)
- ✅ Browse + create a booking
- ✅ Mark booking as paid → view receipt
- ✅ **PDF download** (booking confirmation + monthly statement → should open the iOS share sheet)
- ✅ **Offline mode** — enable Airplane Mode, create a booking, re-enable network, confirm it syncs
- ✅ Status bar / keyboard / safe-area insets look correct (notch devices)

### Step 4.5 — Debugging the WebView

To inspect console/network like Chrome DevTools: open **Safari → Develop → [your device] → [RUTeC]**. (Enable Safari's Develop menu in Safari → Settings → Advanced.)

---

<a name="phase-5"></a>
## 🔐 Phase 5 — Code Signing

iOS signing is handled by Xcode + your Apple Developer account (no keystore file like Android).

### Step 5.1 — Add your Apple ID to Xcode

Xcode → **Settings → Accounts → +** → **Apple ID** → sign in with your Apple Developer account.

### Step 5.2 — Register the App ID (first time)

If `com.sabah.ruraltourism` isn't registered yet:

1. [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, IDs & Profiles → Identifiers → +**
2. **App IDs → App** → Bundle ID: `com.sabah.ruraltourism`
3. Enable capabilities only if used (e.g. Push Notifications). Register.

> ⚠️ The Bundle Identifier is **permanent** once published, exactly like the Android App ID.

### Step 5.3 — Enable automatic signing

In Xcode → **App** target → **Signing & Capabilities**:

- ✅ **Automatically manage signing**
- **Team:** select your Apple Developer team
- **Bundle Identifier:** `com.sabah.ruraltourism`

Xcode auto-creates the signing certificate and provisioning profile.

---

<a name="phase-6"></a>
## 🏗️ Phase 6 — Build & Archive for the App Store

### Step 6.1 — Rebuild web + sync (always do this before archiving)

```bash
npm run android:build:native   # rebuilds www/ with the production (native) environment
npx cap sync ios
```

### Step 6.2 — Select the archive target

In Xcode's device dropdown, select **Any iOS Device (arm64)** (not a simulator — you cannot archive for a simulator).

### Step 6.3 — Archive

Xcode → **Product → Archive**. Wait ~3–5 minutes. The **Organizer** window opens with the new archive.

### Step 6.4 — Validate (optional but recommended)

In Organizer → select the archive → **Validate App** → follow the wizard. This catches signing/asset issues before upload.

---

<a name="phase-7"></a>
## 🚀 Phase 7 — App Store Connect & Submission

### Step 7.1 — Create the app record

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps → + → New App**
2. Platform: **iOS** · Name: **Rural Tourism Sabah** · Language: **English**
3. Bundle ID: `com.sabah.ruraltourism` · SKU: `ruraltourismsabah`

### Step 7.2 — Upload the build

From Xcode Organizer → select archive → **Distribute App → App Store Connect → Upload** → follow the wizard. The build appears in App Store Connect after ~10–30 min of processing.

### Step 7.3 — Prepare the store listing

| Asset | Spec |
|---|---|
| **App Icon** | 1024×1024px PNG, no alpha (from Phase 3) |
| **iPhone screenshots** | 6.7" (1290×2796px), min 3 |
| **Privacy Policy URL** | `https://ruraltourism.sabah.gov.my/privacy` |
| **Support URL** | `https://ruraltourism.sabah.gov.my/support` |
| **Category** | Travel |

Complete the **App Privacy** questionnaire (data collected: name, email, phone, location for bookings).

### Step 7.4 — Reviewer notes

```
This app requires authentication for booking activities and accommodations.

Test Account:
Email: reviewer@example.com
Password: TestPassword123!

The app supports offline mode — bookings made without connectivity are queued
locally (IndexedDB) and synced automatically when the network returns.
```

### Step 7.5 — Submit

Attach the processed build to the version → **Add for Review → Submit**. Typical review time: **24–72 hours**.

### Step 7.6 — (Recommended) TestFlight first

Before Production, upload the build to **TestFlight** (internal testers need no review; external testers need a quick review) to validate on real devices and OS versions.

---

<a name="checklist"></a>
## ✅ Implementation Checklist

### Pre-work
- [ ] Mac with Xcode 15+, CocoaPods, Node 18+, Ionic CLI installed
- [ ] Apple Developer Program enrollment active ($99/yr)
- [ ] **API reachable over HTTPS** and `environment.native.ts` updated ← critical

### Platform setup
- [ ] `npm install @capacitor/ios --legacy-peer-deps`
- [ ] `npm run android:build:native` (build www/)
- [ ] `npx cap add ios`
- [ ] `npx cap sync ios`
- [ ] iOS config added to `capacitor.config.ts`; HTTP allowances removed for prod
- [ ] iOS entries added to `.gitignore`

### Assets & config
- [ ] `resources/icon.png` (1024²) + `resources/splash.png` (2732²) created
- [ ] `npx capacitor-assets generate --ios` run
- [ ] Display name, Bundle ID, Version, Build set in Xcode

### Testing
- [ ] Runs on simulator
- [ ] Runs on physical device (Developer Mode trusted)
- [ ] Login works (HTTPS confirmed)
- [ ] PDF download opens share sheet
- [ ] Offline create → sync works
- [ ] Safe-area / status bar / keyboard correct on notch device

### Signing & release
- [ ] Apple ID added to Xcode, team selected, automatic signing on
- [ ] App ID `com.sabah.ruraltourism` registered
- [ ] Archive validates successfully
- [ ] App record created in App Store Connect
- [ ] Build uploaded + processed
- [ ] Store listing, screenshots, privacy questionnaire complete
- [ ] **ATS arbitrary-loads exception removed** (if it was ever added)
- [ ] TestFlight tested → submitted for review

---

<a name="differences"></a>
## 🔄 Android vs iOS Differences

| Step | Android | iOS |
|---|---|---|
| **Build machine** | Win / Mac / Linux | **Mac only** |
| **IDE** | Android Studio | Xcode |
| **Platform folder** | `android/` | `ios/` |
| **Open** | `npx cap open android` | `npx cap open ios` |
| **Dependencies** | Gradle | CocoaPods |
| **Output** | APK / AAB | IPA (via Archive) |
| **Signing** | `key.properties` + keystore | Xcode automatic signing |
| **Version fields** | `versionCode` / `versionName` | Build / Version (in Xcode) |
| **HTTP allowed?** | Yes (`cleartext: true`) | **No** — HTTPS required (ATS) |
| **Min OS** | Android 7.0 (API 24) | iOS 16.0 (Xcode 15 default) |
| **Store** | Play Console (web upload) | Xcode Organizer / Transporter |
| **Fee** | $25 one-time | $99/year |

### Plugin parity — all current plugins support iOS

`@capacitor/app`, `haptics`, `keyboard`, `network`, `status-bar`, `filesystem`, `share` — **all cross-platform, no iOS-specific code needed**. `NativeDownloadService` already branches on `Capacitor.isNativePlatform()`, so iOS reuses the Android filesystem+share path unchanged.

---

<a name="troubleshooting"></a>
## 🔧 Troubleshooting

#### White/blank screen on launch, or "network error" on login
**Cause:** iOS ATS blocking the HTTP API. **Fix:** use HTTPS ([Critical Blocker](#critical-blocker)). For staging only, add the ATS exception to `Info.plist`.

#### `npx cap add ios` fails with CocoaPods error
```bash
sudo gem install cocoapods
pod setup
npx cap sync ios
```

#### "No account for team" / "No signing certificate"
Xcode → Settings → Accounts → add Apple ID; then App target → Signing & Capabilities → select Team.

#### `pod install` fails during sync
```bash
cd ios/App
pod install --repo-update
```

#### Archive option is greyed out
You have a **simulator** selected. Switch the device dropdown to **Any iOS Device (arm64)**.

#### Changes not appearing in the app
```bash
npm run android:build:native
npx cap sync ios
# In Xcode: Product → Clean Build Folder (Shift+Cmd+K), then Run
```

#### Layout clipped by the notch / status bar
Ensure Ionic safe-area CSS is applied and `ios.contentInset: 'automatic'` is set in `capacitor.config.ts`.

#### Apple rejects: "uses NSAllowsArbitraryLoads"
Remove the ATS exception from `Info.plist` and serve the API over HTTPS.

---

<a name="quick-reference"></a>
## 📋 Quick Reference Commands

```bash
# ── One-time iOS setup (on Mac) ──
npm install --legacy-peer-deps
npm install @capacitor/ios --legacy-peer-deps
npm run android:build:native          # build www/ with native env
npx cap add ios
npx cap sync ios

# ── App icons / splash ──
npx capacitor-assets generate --ios

# ── Every build cycle ──
npm run android:build:native          # rebuild web (production/native env)
npx cap sync ios                      # sync into iOS project
npx cap open ios                      # open Xcode
#   → select device/simulator → Run (▶️) to test
#   → Any iOS Device → Product → Archive → Distribute to App Store

# ── CocoaPods recovery ──
cd ios/App && pod install --repo-update
```

> 💡 The following npm scripts are already added to `package.json`:
> ```json
> "ios:sync": "npx cap sync ios",
> "ios:open": "npx cap open ios",
> "ios:build": "npm run android:build:native && npx cap sync ios"
> ```
> So you can use `npm run ios:build`, `npm run ios:sync`, `npm run ios:open` directly.

---

## 📚 Resources

- **Capacitor iOS:** [capacitorjs.com/docs/ios](https://capacitorjs.com/docs/ios)
- **Capacitor Assets:** [github.com/ionic-team/capacitor-assets](https://github.com/ionic-team/capacitor-assets)
- **App Transport Security:** [developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity](https://developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity)
- **App Store Connect:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **CocoaPods:** [cocoapods.org](https://cocoapods.org)

---

**Document Version:** 2.0
**Last Updated:** June 3, 2026
**Maintained By:** Development Team

_Companion docs: `NATIVE_APP_BUILD_GUIDE.md` (Android), `OFFLINE_BOOKING_IMPLEMENTATION.md`._

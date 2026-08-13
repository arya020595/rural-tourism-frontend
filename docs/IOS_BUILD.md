# Building the iOS App (.ipa)

This mirrors the Android workflow. The web app is built once, copied into a
native shell by Capacitor, then you build/archive in **Xcode** (like building
the APK/AAB in Android Studio).

App identity (from `capacitor.config.ts`):

- **App ID:** `com.sabah.ruraltourism`
- **App name:** `RUTeC`
- **Web build dir:** `www`

---

## Prerequisites (Mac only)

iOS builds can **only** be done on macOS — Apple's toolchain (Xcode +
CocoaPods) is macOS-only. You need:

- macOS with **Xcode** installed (from the App Store)
- **Xcode Command Line Tools:** `xcode-select --install`
- **CocoaPods:** `sudo gem install cocoapods` (or `brew install cocoapods`)
- **Node.js** (same version the team uses) and `npm install` run once
- An **Apple Developer account** (needed to sign and export an `.ipa`)

---

## One-time setup (run by the first Mac developer, then committed)

The `ios/` native project does not exist yet. It must be generated on a Mac
**once**, then committed to the repo so everyone else can just clone and build
(exactly how `android/` already works).

```bash
# from the repo root (rural-tourism-frontend)
npm install                       # installs JS deps
npm install @capacitor/ios        # adds the iOS Capacitor package
npm run build                     # produces www/ (web assets)
npx cap add ios                   # creates the ios/ folder + runs pod install
```

Then commit the new files:

```bash
git add package.json package-lock.json ios/
git commit -m "chore: add iOS Capacitor platform"
git push
```

> Capacitor writes its own `ios/.gitignore` that excludes build artifacts and
> `Pods/` while keeping the Xcode project — same pattern as `android/.gitignore`.
> Don't hand-edit it.

---

## Day-to-day build flow (any Mac dev, after the one-time setup is committed)

Same three steps as Android (`full-release` → `sync` → `open`):

```bash
npm run ios:build      # builds web (native config) AND runs cap sync ios
npm run ios:open       # opens the project in Xcode
```

(`npm run ios:sync` alone re-copies web assets without rebuilding, if needed.)

Then in **Xcode** (the Android Studio equivalent):

1. Select the **App** target → **Signing & Capabilities** → choose your Team
   (Apple Developer account). This is the iOS equivalent of a keystore.
2. Pick a real device or **Any iOS Device (arm64)** as the run destination.
3. **Product → Archive**.
4. In the Organizer window that opens: **Distribute App** → choose a method
   (App Store Connect, Ad Hoc, Enterprise, or Development) → follow the wizard
   to export the **`.ipa`**.

---

## After pulling new changes

Whenever web code or Capacitor plugins change, re-sync before opening Xcode:

```bash
git pull
npm install            # if dependencies changed
npm run ios:build      # rebuild web + cap sync ios
npm run ios:open
```

If native iOS dependencies changed, refresh CocoaPods:

```bash
cd ios/App && pod install && cd ../..
```

---

## Notes / gotchas

- **Windows users cannot generate or build the iOS project** — only the Mac
  one-time setup unlocks it for the team.
- The `.ipa` cannot be side-loaded as freely as an Android `.apk`. Distribution
  needs a signing method: TestFlight/App Store, Ad Hoc (registered device
  UDIDs), or an Enterprise certificate.
- Keep the Capacitor versions for `@capacitor/core`, `@capacitor/android`, and
  `@capacitor/ios` in sync (all `^7.x` here).

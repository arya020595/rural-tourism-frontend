# Play Store Setup Guide — Rural Tourism Sabah

**Step-by-step guide to fix all blockers and publish the app to Google Play Store.**

> Created: May 12, 2026  
> App: Rural Tourism Sabah  
> Stack: Ionic 8 + Angular 18 + Capacitor 7

---

## Current Status (What's Already Done)

- Android project folder (`android/`) exists and is initialized
- Capacitor 7 + `@capacitor/android` installed
- `capacitor.config.ts` exists
- Dev environments (`environment.ts`, `environment.prod.ts`) exist
- `package.json` npm scripts partially configured

---

## Blockers to Fix (In Order)

1. App ID is still the default placeholder
2. `capacitor.config.ts` has development-only flags still on
3. `environment.prod.ts` uses relative URLs — won't work in native app
4. `android/app/build.gradle` namespace/applicationId not updated
5. No `environment.native.ts` for native builds
6. `angular.json` has no `native` build configuration
7. No keystore / code signing setup
8. No production API server (must be deployed separately)
9. No Play Store assets (icon, screenshots, etc.)

---

## Step 1 — Fix App ID Everywhere

The App ID must be changed from `io.ionic.starter` to `com.sabah.ruraltourism`. This is permanent once published.

### 1A. Update `capacitor.config.ts`

File: `capacitor.config.ts`

**Before:**
```typescript
appId: 'io.ionic.starter',
```

**After:**
```typescript
appId: 'com.sabah.ruraltourism',
```

### 1B. Update `android/app/build.gradle`

File: `android/app/build.gradle`

**Before:**
```gradle
namespace "io.ionic.starter"
...
applicationId "io.ionic.starter"
```

**After:**
```gradle
namespace "com.sabah.ruraltourism"
...
applicationId "com.sabah.ruraltourism"
```

Also update version info while you're here:

```gradle
defaultConfig {
    applicationId "com.sabah.ruraltourism"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
    ...
}
```

> **Why:** The App ID is the unique identifier on Google Play Store. Using the default placeholder will cause rejection. It cannot be changed after the app is published.

---

## Step 2 — Fix `capacitor.config.ts` for Production

The current config has `cleartext: true` and `allowMixedContent: true` — these are development-only and will expose security vulnerabilities in production.

File: `capacitor.config.ts`

**Replace the entire file with:**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabah.ruraltourism',
  appName: 'Rural Tourism Sabah',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
```

> **Why:** `cleartext: true` allows HTTP traffic which is insecure. Google Play requires HTTPS. Removing it enforces HTTPS-only communication.

> **Note for local development only:** If you need to test against a local HTTP backend temporarily, you can re-add `cleartext: true` during dev, but MUST remove it before building for release.

---

## Step 3 — Create Native Environment File

The current `environment.prod.ts` uses relative URLs (`/api`) which only work with nginx proxy on web — they will fail in a native Android app.

### 3A. Create `src/environments/environment.native.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.ruraltourism.sabah.gov.my/api',
  API: 'https://api.ruraltourism.sabah.gov.my',
  enableDebugMode: false,
  logApiCalls: false,
};
```

> **Why:** A native app running on a phone does not go through nginx. It calls the API directly, so it needs absolute HTTPS URLs.

> **Important:** Replace `https://api.ruraltourism.sabah.gov.my` with your actual deployed backend URL before building for release.

### 3B. Register the native configuration in `angular.json`

Open `angular.json` and find the `"configurations"` block under `"build"`. Add a `"native"` configuration after `"production"`:

```json
"native": {
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb",
      "maximumError": "10kb"
    }
  ],
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.native.ts"
    }
  ],
  "outputHashing": "all"
}
```

### 3C. Add `android:native` script to `package.json`

Add this to the `"scripts"` block in `package.json`:

```json
"android:build:native": "ionic build --configuration=native",
"android:sync": "npx cap sync android",
"android:open": "npx cap open android",
"android:release": "cd android && gradlew bundleRelease",
"android:apk": "cd android && gradlew assembleRelease",
"full-release": "npm run android:build:native && npm run android:sync"
```

> **Why:** `--configuration=native` tells Angular to use `environment.native.ts` instead of `environment.prod.ts`, so the native build calls the real API URL.

---

## Step 4 — Set Up Code Signing (Keystore)

Google Play Store requires every app to be digitally signed. Without this you cannot upload to Play Store.

### 4A. Generate the Keystore

Run this command in a terminal. Store the keystore file **outside** the project folder (never commit it to git).

```bash
# Create a secure folder outside your project
mkdir C:\Users\YourName\secure-keys

# Generate the keystore
keytool -genkey -v -keystore "C:\Users\YourName\secure-keys\rural-tourism-release.keystore" ^
  -alias rural-tourism-key ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000
```

When prompted, enter:

| Field | Value |
|---|---|
| First and last name | Rural Tourism Sabah |
| Organizational unit | IT Department |
| Organization | Sabah Tourism Board |
| City or Locality | Kota Kinabalu |
| State or Province | Sabah |
| Country code | MY |

Choose a strong password and write it down — you will need it every time you build a release.

> **CRITICAL: If you lose the keystore file or password, you can NEVER update the app on Play Store. Back it up in at least 3 places (USB drive, cloud storage, company vault).**

### 4B. Back Up the Keystore

```bash
# Copy to at least 2 other secure locations
copy "C:\Users\YourName\secure-keys\rural-tourism-release.keystore" "D:\Backups\"
```

Also save these details in a password manager:
- Keystore file path
- Keystore password
- Key alias: `rural-tourism-key`
- Key password (if different)

### 4C. Create `android/key.properties`

Create this file at `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=rural-tourism-key
storeFile=C:\\Users\\YourName\\secure-keys\\rural-tourism-release.keystore
```

> **Note:** Use double backslashes `\\` for Windows paths in this file.

> **Security:** This file contains your passwords. It must never be committed to git.

### 4D. Verify `android/.gitignore` Has These Entries

Open `android/.gitignore` and confirm these lines exist (add them if missing):

```gitignore
key.properties
*.keystore
*.jks
```

### 4E. Update `android/app/build.gradle` to Use the Keystore

Open `android/app/build.gradle` and update it to:

```gradle
apply plugin: 'com.android.application'

// Load signing config from key.properties
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace "com.sabah.ruraltourism"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.sabah.ruraltourism"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
            ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
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
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

---

## Step 5 — Build the Release AAB

Once all the above fixes are done, run these commands in order:

```bash
# Step 1: Build web app with native environment
npm run full-release

# Step 2: Build signed AAB (App Bundle for Play Store)
cd android
gradlew bundleRelease
```

The signed AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Verify it is signed:
```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
# Should print: jar verified.
```

---

## Step 6 — Backend Production Requirement

The native app will fail if the backend is not deployed to a public HTTPS server.

**What needs to be done:**
1. Deploy the `rural-tourism-backend` to a server (e.g., VPS, AWS, Heroku, Railway)
2. Set up a domain name (e.g., `api.ruraltourism.sabah.gov.my`)
3. Install an SSL certificate (HTTPS) — Let's Encrypt is free
4. Update `src/environments/environment.native.ts` with the real URL
5. Configure CORS in the backend to accept requests from the Android app

**Backend CORS config to update (`rural-tourism-backend`):**
```javascript
// In your Express app CORS config, ensure mobile origins are allowed
cors({
  origin: [
    'http://localhost:8100',           // Ionic dev server
    'https://localhost',               // Capacitor Android scheme
    'https://api.ruraltourism.sabah.gov.my'  // Production
  ]
})
```

> This step is outside the frontend project and requires infrastructure setup. The app cannot be published without a working production API.

---

## Step 7 — Prepare Play Store Assets

You need these before submitting to Play Console:

| Asset | Size | Format | Notes |
|---|---|---|---|
| App Icon | 512 x 512 px | PNG, no transparency | Use [easyappicon.com](https://easyappicon.com/) |
| Feature Graphic | 1024 x 500 px | JPG or PNG | Banner shown at top of listing |
| Phone Screenshots | Min 1080 x 1920 px | PNG or JPG | At least 2, up to 8 |
| Privacy Policy | Hosted at public HTTPS URL | Web page | Required — app collects user data |

**Screenshot suggestions (take these from the running app):**
1. Home / Browse screen
2. Activity or accommodation detail page
3. Booking flow
4. Profile / booking history

**Free tools:**
- Icon: [easyappicon.com](https://easyappicon.com/)
- Screenshot frames: [screenshots.pro](https://screenshots.pro/)
- Privacy policy generator: [termsfeed.com/privacy-policy-generator](https://www.termsfeed.com/privacy-policy-generator/)

---

## Step 8 — Google Play Console Setup

### 8A. Create Developer Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with a Google/Gmail account
3. Click "Create Account"
4. Select "Organization" (recommended for government/tourism board)
5. Pay the one-time $25 USD registration fee (non-refundable)
6. Complete identity verification (upload government-issued ID)
7. Wait 1–3 days for account verification

### 8B. Create the App

1. Play Console Dashboard → "Create App"
2. Fill in:
   - **App name:** `Rural Tourism Sabah`
   - **Default language:** English (UK) or Malay (Bahasa Malaysia)
   - **App or game:** App
   - **Free or paid:** Free
3. Accept declarations → "Create App"

### 8C. Complete Required Sections

Work through each section in the Play Console checklist:

**App Access**
- Select "Yes, all functionality is available"
- Provide a test account (email + password) for Google reviewers

**Store Listing**
- Short description (max 80 chars): `Discover and book authentic rural tourism experiences in Sabah`
- Full description (max 4000 chars): describe features, booking, accommodations, activities
- Upload app icon, feature graphic, and screenshots

**Content Rating**
- Start the questionnaire
- App category: "All other app types"
- Answer all questions honestly (no violence, no adult content, collects personal data: yes)

**Data Safety**
- Disclose all data your app collects:
  - Personal info (name, email) — for account creation
  - Location — for showing nearby activities
  - Financial info — for payment processing
  - Photos — for profile picture upload
- Mark "Data encrypted in transit: Yes"
- Mark "User can request data deletion: Yes"

**Privacy Policy**
- Paste the public URL where your privacy policy is hosted
- Must cover: what you collect, how you use it, how to contact you

### 8D. Upload the AAB

1. Play Console → Release → Testing → Internal Testing → "Create new release"
2. Upload `app-release.aab`
3. Add release notes:
   ```
   Initial beta release of Rural Tourism Sabah.
   - Browse activities and accommodations
   - Secure online booking
   - User profile management
   - Booking history
   ```
4. "Save" → "Review Release" → "Start Rollout to Internal Testing"
5. Add your team's email addresses as internal testers
6. Test for 1–2 weeks, fix any issues found

### 8E. Submit for Production

After internal testing is stable:

1. Play Console → Release → Production → "Create new release"
2. Upload the same or updated AAB
3. Add user-facing release notes
4. Optionally set a staged rollout (start at 20%, monitor, increase to 100%)
5. "Submit for Review"

**Google review takes 1–7 days.** You'll get an email when it's approved or rejected.

---

## Quick Summary Checklist

### Before Building

- [ ] `capacitor.config.ts` — App ID changed to `com.sabah.ruraltourism`
- [ ] `capacitor.config.ts` — `cleartext` and `allowMixedContent` removed
- [ ] `android/app/build.gradle` — namespace + applicationId updated
- [ ] `android/app/build.gradle` — versionCode `1`, versionName `"1.0.0"`
- [ ] `src/environments/environment.native.ts` — created with real HTTPS API URL
- [ ] `angular.json` — `native` build configuration added
- [ ] `package.json` — android release scripts added

### Code Signing

- [ ] Keystore generated and saved outside the project folder
- [ ] Keystore backed up to 3+ secure locations
- [ ] `android/key.properties` created with correct paths and passwords
- [ ] `android/.gitignore` has `key.properties` and `*.keystore` entries
- [ ] `android/app/build.gradle` updated with signingConfigs block

### Before Submitting

- [ ] Backend deployed to production with HTTPS
- [ ] `environment.native.ts` updated with the real API URL
- [ ] App tested on a real Android device
- [ ] App icon (512x512px) ready
- [ ] Feature graphic (1024x500px) ready
- [ ] At least 2 phone screenshots ready
- [ ] Privacy policy hosted at a public URL
- [ ] AAB successfully built and signature verified
- [ ] Play Console developer account created and verified ($25 fee paid)

---

## Releasing Updates (After First Publish)

Each update to the app requires incrementing the version in `android/app/build.gradle`:

```gradle
versionCode 2        // Increment by 1 each release
versionName "1.0.1"  // Semantic version
```

Then repeat the build flow:

```bash
npm run full-release
cd android
gradlew bundleRelease
```

Upload the new AAB to Play Console → Production → Create new release.

---

## Troubleshooting

**"SDK location not found" during Gradle build**
```bash
# Set ANDROID_HOME in system environment variables (Windows)
# Control Panel -> System -> Advanced -> Environment Variables
# Add: ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
```

**"Keystore file not found"**
- Check the `storeFile` path in `android/key.properties` — use absolute path with double backslashes on Windows

**"Version code already used"**
- Increment `versionCode` in `android/app/build.gradle` — it must be higher than the previous upload

**White screen on app launch**
- Run `npm run android:sync` to re-sync web assets
- Check `environment.native.ts` has the correct API URL
- Open Chrome DevTools at `chrome://inspect` to check for JS errors

**"net::ERR_CLEARTEXT_NOT_PERMITTED"**
- Your API URL is still `http://` — it must be `https://`
- Make sure `cleartext: true` is not in `capacitor.config.ts`

**App rejected by Google**
- Read the rejection email carefully — it lists exact reasons
- Common fixes: add/fix privacy policy, correct data safety declarations, fix broken features
- After fixing, resubmit — no additional fee required

---

_Maintained by: Development Team_  
_Last Updated: May 12, 2026_

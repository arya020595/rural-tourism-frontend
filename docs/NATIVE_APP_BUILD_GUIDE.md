# 📱 Rural Tourism Sabah - Native Android App Development & Deployment Guide

**Complete guide for developing, building, and publishing the Rural Tourism Sabah mobile application to Google Play Store.**

> Last Updated: June 3, 2026  
> App Version: 0.0.1  
> Tech Stack: Ionic 8 + Angular 18 + Capacitor 7

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Development Setup](#development-setup)
3. [Development Workflow](#development-workflow)
4. [Building Native Android App](#building-native-android-app)
5. [Google Play Store Publishing](#google-play-store-publishing)
6. [Pre-Publishing Checklist](#pre-publishing-checklist)
7. [Maintenance & Updates](#maintenance--updates)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## 🎯 Overview

### What is This App?

Rural Tourism Sabah is a **native Android application** built with:

- **Ionic Framework** - UI components and mobile-optimized design
- **Angular** - Application logic and structure
- **Capacitor** - Native runtime that wraps the web app into a real Android app

### How It Works

```
Web App (HTML/CSS/TypeScript)
    ↓
Capacitor Bridge
    ↓
Native Android Container (APK/AAB)
    ↓
Google Play Store
```

The app is **NOT just a mobile website**. It's a genuine native Android app that:

- ✅ Runs offline
- ✅ Can be installed from Google Play Store
- ✅ Has access to device features (camera, storage, GPS, etc.)
- ✅ Appears in the app drawer like any native app
- ✅ Can send push notifications
- ✅ Works without a browser

---

## 🛠️ Development Setup

### Prerequisites

#### Required Software

| Software      | Version | Purpose             | Download                            |
| ------------- | ------- | ------------------- | ----------------------------------- |
| **Node.js**   | >= 18.x | Runtime environment | [nodejs.org](https://nodejs.org/)   |
| **npm**       | >= 9.x  | Package manager     | Comes with Node.js                  |
| **Ionic CLI** | >= 7.2  | Ionic commands      | Install via npm                     |
| **Git**       | Latest  | Version control     | [git-scm.com](https://git-scm.com/) |

#### For Native Android Development

| Software           | Version        | Purpose                 | Download                                                             |
| ------------------ | -------------- | ----------------------- | -------------------------------------------------------------------- |
| **Android Studio** | Latest (2024+) | Android development IDE | [developer.android.com/studio](https://developer.android.com/studio) |
| **Java JDK**       | 11 or 17       | Required by Android     | [adoptium.net](https://adoptium.net/)                                |
| **Android SDK**    | API 33+        | Android build tools     | Via Android Studio                                                   |
| **Gradle**         | 8.7+           | Build automation        | Comes with Android Studio                                            |

#### Backend Requirement

| Component             | Endpoint                          | Status                     |
| --------------------- | --------------------------------- | -------------------------- |
| **Rural Tourism API** | `http://localhost:3000/api` (dev) | Must be running            |
| **Production API**    | TBD - configure before release    | Required for native builds |

---

### Step 1: Install Global Tools

Open terminal and run:

```bash
# Install Ionic CLI globally
npm install -g @ionic/cli

# Verify installation
ionic --version

# Install Capacitor CLI (if not already installed)
npm install -g @capacitor/cli

# Verify Capacitor
npx cap --version
```

**Expected Output:**

```
✔ Ionic CLI: 7.2.0
✔ Capacitor CLI: 7.2.0
```

---

### Step 2: Clone and Install Project

```bash
# Navigate to your workspace
cd ~/Documents/work/rural-tourism-new

# Navigate to frontend folder
cd rural-tourism-frontend

# Install dependencies (IMPORTANT: use --legacy-peer-deps flag)
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**  
This resolves peer dependency conflicts between Capacitor 7 and some Ionic plugins.

---

### Step 3: Verify Installation

```bash
# Check Ionic environment
npx ionic info
```

**Expected Output:**

```
Ionic:
   Ionic CLI: 7.2.0
   Ionic Framework: @ionic/angular 8.0.0

Capacitor:
   Capacitor CLI: 7.2.0
   @capacitor/android: 7.2.0
   @capacitor/core: 7.2.0

Utility:
   cordova-res: not installed
   native-run: not installed

System:
   NodeJS: v18.x.x
   npm: 9.x.x
   OS: Linux
```

---

### Step 4: Configure Environment

#### Development Environment

File: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  API: "http://localhost:3000",
};
```

**✅ Already configured** - no changes needed for local development.

#### Production Environment (Native App)

File: `src/environments/environment.native.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.ruraltourism.sabah.gov.my/api", // ✅ Absolute URL
  API: "https://api.ruraltourism.sabah.gov.my",
};
```

**Note:** Update the API URLs to your actual production endpoints before building for release.

---

## 💻 Development Workflow

### Starting Development Server

#### Option 1: Ionic Serve (Recommended)

```bash
# Start Ionic development server
npm start

# Or explicitly:
npx ionic serve
```

- Opens at: `http://localhost:8100`
- Features: Live reload, device preview, Ionic DevApp integration
- Best for: Ionic component development

#### Option 2: Angular Serve

```bash
# Start Angular development server
npx ng serve
```

- Opens at: `http://localhost:4200`
- Features: Standard Angular CLI features
- Best for: Angular-specific development

#### Option 3: Production Mode Testing

```bash
# Serve with production configuration
npm run serveProd
```

- Tests production build settings
- Minified code
- Production environment variables

---

### Development Best Practices

#### 1. Always Run Backend First

```bash
# In a separate terminal, navigate to backend folder
cd ../rural-tourism-backend

# Start backend server
npm start
```

**Verify Backend:** Open `http://localhost:3000/api` - should return API response.

#### 2. Browser DevTools Setup

- **Chrome DevTools**: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- **Device Emulation**: Select "iPhone 12 Pro" or "Galaxy S20" for realistic testing
- **Responsive Mode**: Test different screen sizes

#### 3. Ionic Lab (Multi-Device Preview)

```bash
# Start with iOS and Android preview side-by-side
ionic serve --lab
```

Opens: `http://localhost:8100/ionic-lab`  
Shows iOS and Android versions simultaneously.

---

### Testing During Development

#### Web Browser Testing

```bash
# Run development server
npm start

# Open in browser: http://localhost:8100
```

**Test These Features:**

- ✅ Login/Registration
- ✅ Browse activities & accommodations
- ✅ Booking flow
- ✅ Profile management
- ✅ Search & filters
- ✅ Image uploads
- ✅ PDF generation
- ✅ Responsive layout

#### Unit Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage
```

#### E2E Testing

```bash
# Run end-to-end tests (if configured)
npm run e2e
```

---

### Making Changes

#### 1. Create New Pages

```bash
# Generate new page
ionic generate page pages/your-page-name

# Example:
ionic generate page pages/booking-confirmation
```

#### 2. Generate Components

```bash
# Generate component
ionic generate component components/your-component

# Example:
ionic generate component components/activity-card
```

#### 3. Generate Services

```bash
# Generate service
ionic generate service services/your-service

# Example:
ionic generate service services/payment
```

---

## 📦 Building Native Android App

### Understanding the Build Process

```
Step 1: Build Web App (Angular)
   ↓ Creates: www/ folder with HTML/CSS/JS

Step 2: Sync to Capacitor
   ↓ Copies web assets to android/app/src/main/assets/

Step 3: Build Android App (Gradle)
   ↓ Creates: APK (testing) or AAB (Play Store)
```

---

### Prerequisites for Native Build

#### 1. Install Android Studio

Download from: [developer.android.com/studio](https://developer.android.com/studio)

**During installation, ensure these are selected:**

- ✅ Android SDK
- ✅ Android SDK Platform
- ✅ Android Virtual Device (AVD)
- ✅ Android SDK Build-Tools

#### 2. Configure Android SDK

Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK

**Install these SDK Platforms:**

- ✅ Android 14.0 (API 34) - Recommended
- ✅ Android 13.0 (API 33)
- ✅ Android 11.0 (API 30)

**Install these SDK Tools:**

- ✅ Android SDK Build-Tools (latest)
- ✅ Android SDK Command-line Tools
- ✅ Android SDK Platform-Tools
- ✅ Android Emulator

#### 3. Set Environment Variables

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Java (if not already set)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

**Apply changes:**

```bash
source ~/.bashrc
```

**Verify:**

```bash
echo $ANDROID_HOME
# Should output: /home/yourusername/Android/Sdk

java -version
# Should output Java version 11 or 17
```

---

### Step 1: Initial Capacitor Setup (First Time Only)

#### Check Current Configuration

File: `capacitor.config.ts`

```typescript
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sabah.ruraltourism", // ✅ Production-ready
  appName: "Rural Tourism Sabah",
  webDir: "www",
  server: {
    androidScheme: "https",
    // cleartext removed for production
  },
};

export default config;
```

**App ID Format:**

- Reverse domain notation: `com.yourcompany.appname`
- All lowercase
- No spaces or special characters
- Must be globally unique

**⚠️ WARNING:** App ID is **permanent** once published to Play Store. Choose carefully!

---

### Step 2: Build Web Application

```bash
# Build for production
npx ionic build --prod

# Or use npm script
npm run build
```

**Output:** `www/` folder containing:

- `index.html`
- Minified JavaScript bundles
- CSS files
- Assets (images, fonts)

**Build Time:** ~1-3 minutes depending on project size

**Verify Build:**

```bash
ls -lh www/
# Should show compiled files
```

---

### Step 3: Sync Web App to Android Project

```bash
# Copy web assets to Android project
npx cap sync android
```

**What this does:**

1. Copies `www/` contents to `android/app/src/main/assets/public/`
2. Updates Capacitor plugins
3. Updates native project configuration
4. Installs any new Capacitor plugins

**Output:**

```
✔ Copying web assets from www to android/app/src/main/assets/public in 1.23s
✔ Creating capacitor.config.json in android/app/src/main/assets in 2.34ms
✔ Updating Android plugins in 34.56ms
✔ Sync finished in 2.45s
```

---

### Step 4: Open in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android
```

**Android Studio will:**

1. Open the `android/` project
2. Index files (1-2 minutes first time)
3. Download any missing Gradle dependencies
4. Build project automatically

**First-Time Setup:**

- ✅ Accept license agreements if prompted
- ✅ Let Gradle sync complete (watch bottom progress bar)
- ✅ Wait for indexing to finish

---

### Step 5: Test on Emulator or Physical Device

#### Option A: Android Emulator (Virtual Device)

**Create Emulator (First Time):**

1. Android Studio → Tools → Device Manager
2. Click "Create Device"
3. Select "Pixel 6" (recommended)
4. Select System Image: Android 14.0 (API 34)
5. Click "Finish"

**Run on Emulator:**

1. Select emulator from device dropdown (top toolbar)
2. Click green "Run" button (▶️)
3. Wait for emulator to boot (~30 seconds)
4. App installs and launches automatically

#### Option B: Physical Android Device (Recommended for Real Testing)

**Enable Developer Mode on Device:**

1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Developer Options now unlocked

**Enable USB Debugging:**

1. Go to Settings → Developer Options
2. Enable "USB Debugging"
3. Connect device via USB

**Verify Connection:**

```bash
# List connected devices
adb devices
```

**Expected Output:**

```
List of devices attached
ABC123XYZ       device
```

**Run on Device:**

1. Android Studio → Select your device from dropdown
2. Click "Run" button (▶️)
3. Approve installation on device if prompted

---

### Step 6: Build Debug APK (For Testing)

Debug APK = Unsigned build for testing only (NOT for Play Store)

#### Method 1: Android Studio GUI

1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Wait for build (~2-5 minutes)
3. Click "locate" in notification
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Method 2: Command Line

```bash
# Navigate to android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Output location
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

**Install on Device:**

```bash
# Install via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Or drag & drop APK to emulator
```

---

### Step 7: Build Release APK/AAB (For Play Store)

**CRITICAL: This requires code signing setup** (see next section)

---

## 🔐 Code Signing for Release Builds

### Why Code Signing is Required

Google Play Store requires all apps to be **digitally signed** with a keystore file. This proves you're the legitimate developer and prevents tampering.

**⚠️ CRITICAL WARNING:**

- If you **lose your keystore**, you **CANNOT update your app** on Play Store
- You would have to publish a completely new app with a different App ID
- **Backup your keystore in 3+ secure locations**

---

### Step 1: Generate Release Keystore

```bash
# Navigate to a secure location (NOT in git repo)
cd ~/secure-keys

# Generate keystore
keytool -genkey -v -keystore rural-tourism-release.keystore \
  -alias rural-tourism-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Interactive Prompts:**

```
Enter keystore password: [CREATE STRONG PASSWORD]
Re-enter new password: [REPEAT PASSWORD]

What is your first and last name?
  [Unknown]:  Rural Tourism Sabah

What is the name of your organizational unit?
  [Unknown]:  IT Department

What is the name of your organization?
  [Unknown]:  Sabah Tourism Board

What is the name of your City or Locality?
  [Unknown]:  Kota Kinabalu

What is the name of your State or Province?
  [Unknown]:  Sabah

What is the two-letter country code for this unit?
  [Unknown]:  MY

Is CN=Rural Tourism Sabah, OU=IT Department, O=Sabah Tourism Board,
L=Kota Kinabalu, ST=Sabah, C=MY correct?
  [no]:  yes

Enter key password for <rural-tourism-key>
  (RETURN if same as keystore password):  [PRESS ENTER]
```

**Output:**

```
[Storing rural-tourism-release.keystore]
```

**Keystore Details:**

- **File:** `rural-tourism-release.keystore`
- **Validity:** 10,000 days (~27 years)
- **Algorithm:** RSA 2048-bit (Play Store requirement)

---

### Step 2: Backup Your Keystore (CRITICAL!)

```bash
# Copy to multiple secure locations
cp rural-tourism-release.keystore ~/Dropbox/secure/
cp rural-tourism-release.keystore /media/external-drive/backups/
cp rural-tourism-release.keystore ~/encrypted-vault/

# Create encrypted backup
gpg -c rural-tourism-release.keystore
# Creates: rural-tourism-release.keystore.gpg
```

**Backup Checklist:**

- ✅ Cloud storage (encrypted)
- ✅ External hard drive
- ✅ USB drive in safe location
- ✅ Company vault/safe
- ✅ Password manager (for passwords)

**Store These Details Securely:**

- Keystore file location
- Keystore password
- Key alias: `rural-tourism-key`
- Key password (if different from keystore password)

---

### Step 3: Configure Gradle Signing

#### Create Key Properties File

File: `android/key.properties` (create this file)

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=rural-tourism-key
storeFile=/home/yourusername/secure-keys/rural-tourism-release.keystore
```

**⚠️ Security:**

- This file contains sensitive passwords
- **MUST be in `.gitignore`**
- Never commit to version control

#### Update .gitignore

File: `android/.gitignore`

```gitignore
# Add if not already present
key.properties
*.keystore
*.jks
```

#### Signing Configuration

The signing configuration has been prepared in `android/app/build.gradle`. When you're ready to create a release build:

1. Create `android/key.properties` file (as shown above)
2. Update the file paths and passwords
3. Build release: `./gradlew bundleRelease`

---

### Step 4: Build Signed Release AAB

```bash
# Navigate to android folder
cd android

# Build release App Bundle (AAB) - Play Store format
./gradlew bundleRelease

# Build time: 3-5 minutes
```

**Output Location:**

```
android/app/build/outputs/bundle/release/app-release.aab
```

**File Size:** ~10-30 MB (varies by app complexity)

**Verify AAB:**

```bash
ls -lh app/build/outputs/bundle/release/app-release.aab
```

---

### Step 5: Build Signed Release APK (Optional)

APK = For direct installation testing (not recommended for Play Store)

```bash
# Build release APK
./gradlew assembleRelease

# Output location
ls -lh app/build/outputs/apk/release/app-release.apk
```

**When to use APK:**

- Internal testing before Play Store
- Distribution outside Play Store (not recommended)

**When to use AAB:**

- Google Play Store upload (required)
- Optimized app size
- Dynamic feature delivery

---

### Step 6: Verify Signature

```bash
# Verify AAB is signed
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab

# Verify APK is signed
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

**Expected Output:**

```
jar verified.
```

---

## 🚀 Google Play Store Publishing

### Prerequisites

Before starting Play Store publishing:

**Account Requirements:**

- ✅ Google account (Gmail)
- ✅ $25 USD one-time registration fee
- ✅ Valid credit/debit card
- ✅ Government-issued ID for verification

**App Requirements:**

- ✅ Signed AAB file (from previous section)
- ✅ Privacy policy URL (hosted publicly)
- ✅ App description & screenshots
- ✅ High-resolution icon (512x512px)
- ✅ Feature graphic (1024x500px)
- ✅ Production API endpoint (HTTPS)

---

### Step 1: Create Play Console Developer Account

1. **Go to Play Console:**  
   [https://play.google.com/console](https://play.google.com/console)

2. **Sign in** with your Google account

3. **Click "Create Account"**
   - Select: "Organization" (recommended) or "Individual"
   - Fill in developer details:
     - Developer name: "Sabah Tourism Board" (public name)
     - Email address: (contact email)
     - Phone number: (support contact)

4. **Read and Accept:**
   - ✅ Play Console Developer Agreement
   - ✅ US export laws compliance

5. **Pay Registration Fee:**
   - Amount: $25 USD (one-time, lifetime)
   - Payment methods: Credit/Debit card, PayPal
   - **Non-refundable**

6. **Identity Verification:**
   - Upload government-issued ID
   - May require selfie verification
   - Processing time: 24-48 hours (sometimes instant)

7. **Wait for Approval:**
   - Check email for verification status
   - Once approved, you can create apps

**⏱️ Timeline:** 1-3 days for full account verification

---

### Step 2: Create New App in Play Console

1. **Play Console Dashboard → "Create App"**

2. **Fill in App Details:**

   **App name:** `Rural Tourism Sabah`  
   **Default language:** English (UK) or Malay (Bahasa Malaysia)  
   **App or game:** App  
   **Free or paid:** Free  
   **Declarations:**
   - ✅ I have read and accept the Play Console Developer Agreement
   - ✅ I acknowledge that my app must comply with Play policies

3. **Click "Create App"**

**Result:** App created in draft mode. Now you'll complete required sections before publishing.

---

### Step 3: Complete Dashboard Tasks

Play Console shows a checklist. Complete these sections:

#### A. App Access

**Question:** Does your app restrict access to content or features?

**Answer:** Yes (app requires login for most features)

**Instructions for reviewers:**

```
This app requires user authentication for booking activities and accommodations.

Test Account Credentials:
Email: reviewer@example.com
Password: TestPassword123!

Note: The test account has limited booking capabilities for review purposes only.
```

**Provide:**

- ✅ Demo/test account credentials
- ✅ Any special instructions
- ✅ Steps to access restricted features

---

#### B. Store Listing

**App Details:**

| Field                 | Content                                                        |
| --------------------- | -------------------------------------------------------------- |
| **App name**          | Rural Tourism Sabah                                            |
| **Short description** | Discover and book authentic rural tourism experiences in Sabah |
| **Full description**  | See example below                                              |
| **App icon**          | 512x512px PNG (no transparency)                                |
| **Feature graphic**   | 1024x500px JPG/PNG                                             |

**Full Description Example:**

```
Experience the beauty of rural Sabah with our comprehensive tourism platform.

FEATURES:
• Browse authentic rural accommodations (homestays, guesthouses, resorts)
• Book exciting local activities (cultural tours, adventure sports, nature experiences)
• Secure online booking and payment
• Digital booking confirmations and receipts
• Multi-language support (English, Bahasa Malaysia)
• Offline access to your bookings
• Real-time availability checking
• Direct communication with operators

DISCOVER SABAH:
Explore Sabah's rich cultural heritage and natural wonders through community-based tourism. Support local operators while enjoying unique, authentic experiences.

BOOK WITH CONFIDENCE:
• Verified operators and accommodations
• Transparent pricing
• Secure payment processing
• Customer support
• Easy cancellation policies

PERFECT FOR:
✓ Tourists seeking authentic local experiences
✓ Families looking for unique getaways
✓ Adventure travelers
✓ Cultural enthusiasts
✓ Nature lovers

Download now and start your Sabah adventure!

For support, visit: https://ruraltourism.sabah.gov.my/support
Privacy Policy: https://ruraltourism.sabah.gov.my/privacy
```

**Graphics:**

1. **App Icon (512x512px)**
   - PNG format
   - No transparency
   - 32-bit color
   - Full bleed (no rounded corners - Android applies automatically)

2. **Feature Graphic (1024x500px)**
   - JPG or PNG
   - Banner for top of store listing
   - Include app name and tagline
   - High-quality, eye-catching

3. **Screenshots (REQUIRED - at least 2)**
   - **Phone:** 1080x1920px or higher (16:9 ratio)
   - At least 2, up to 8 screenshots
   - Show key app features:
     - Home screen / Browse activities
     - Activity detail page
     - Booking screen
     - Profile / Bookings list
     - Search results

4. **Promo Video (Optional)**
   - YouTube URL
   - 30-120 seconds recommended
   - Show app in action

**Store Listing Contact Details:**

| Field       | Example                           |
| ----------- | --------------------------------- |
| **Email**   | support@ruraltourism.sabah.gov.my |
| **Phone**   | +60 XX-XXXX-XXXX (optional)       |
| **Website** | https://ruraltourism.sabah.gov.my |

**Category & Tags:**

- **Category:** Travel & Local
- **Tags:** tourism, travel, sabah, malaysia, booking, activities, accommodations

---

#### C. Content Rating

**Complete Questionnaire:**

1. Click "Start Questionnaire"
2. Select your email address
3. Choose app category: **"All other app types"**

**Sample Questions:**

**Violence:**

- Does your app contain violent content? **No**

**Sexual Content:**

- Does your app contain sexual content? **No**

**Profanity:**

- Does your app contain profanity? **No**

**Controlled Substances:**

- Does your app reference or depict controlled substances? **No**

**Crude Humor:**

- Does your app contain crude humor? **No**

**Discrimination:**

- Does your app contain discriminatory content? **No**

**User-Generated Content:**

- Can users interact or exchange content? **Yes** (reviews, if applicable)
  - Are users allowed to share info with others? **Yes**
  - Is there moderation? **Yes** (describe moderation policy)

**Data Privacy:**

- Does your app collect location data? **Yes** (for showing nearby activities)
- Does your app collect personal data? **Yes** (name, email, phone for bookings)

4. **Submit Questionnaire**
5. **Receive Rating:** Usually "Everyone" or "Teen"

---

#### D. Privacy Policy

**REQUIRED** - Your app collects personal data (user accounts, bookings)

**Create Privacy Policy:**

File: Create at `https://ruraltourism.sabah.gov.my/privacy`

**Must include:**

- What data you collect (name, email, phone, location, booking history)
- How you use it (provide services, process bookings, send notifications)
- How you store it (encryption, secure servers)
- Third parties with access (payment processors, operators)
- User rights (access, deletion, correction)
- Contact information for privacy questions

**Quick Solution:** Use privacy policy generator:

- [TermsFeed](https://www.termsfeed.com/privacy-policy-generator/)
- [FreePrivacyPolicy.com](https://www.freeprivacypolicy.com/)

**Enter URL in Play Console:**

- Store Settings → Privacy Policy → `https://ruraltourism.sabah.gov.my/privacy`

---

#### E. App Content (Data Safety)

**Data Safety Section:** Tell users what data you collect

**Data Collection:**

| Data Type                       | Collected?        | Shared? | Purpose                                  |
| ------------------------------- | ----------------- | ------- | ---------------------------------------- |
| **Personal Info** (name, email) | ✅ Yes            | ❌ No   | Account creation, bookings               |
| **Location**                    | ✅ Yes            | ❌ No   | Show nearby activities                   |
| **Financial Info**              | ✅ Yes            | ✅ Yes  | Payment processing (via payment gateway) |
| **Photos**                      | ✅ Yes (optional) | ❌ No   | Profile picture upload                   |
| **Device ID**                   | ✅ Yes            | ❌ No   | Analytics, crash reporting               |

**Security Practices:**

- ✅ Data encrypted in transit (HTTPS)
- ✅ Data encrypted at rest
- ✅ User can request data deletion
- ✅ Follows Play Families Policy: **No** (not a kids app)

---

### Step 4: Upload App Bundle (AAB)

#### Production Track vs. Testing Tracks

| Track                | Purpose                               | Review Required | Availability |
| -------------------- | ------------------------------------- | --------------- | ------------ |
| **Internal Testing** | Team testing (up to 100 testers)      | ❌ No           | Immediate    |
| **Closed Testing**   | Beta testers (invite-only, unlimited) | ❌ No           | Immediate    |
| **Open Testing**     | Public beta (anyone can join)         | ✅ Yes          | 1-3 days     |
| **Production**       | Public release                        | ✅ Yes          | 1-7 days     |

**Recommended Flow:**

1. Internal Testing → Fix bugs
2. Closed Testing (Beta) → Gather feedback
3. Production → Public launch

---

#### Upload to Internal Testing (Recommended First)

1. **Play Console → Release → Testing → Internal Testing**

2. **Create New Release:**
   - Click "Create new release"

3. **Upload AAB:**
   - Click "Upload" → Select `app-release.aab`
   - Wait for upload (~1-2 minutes)
   - Play Console validates AAB

4. **Release Name:**
   - Auto-generated: `1 (1.0.0)`
   - Or custom: "Initial Release"

5. **Release Notes:**

   ```
   Initial release of Rural Tourism Sabah app.

   Features:
   - Browse activities and accommodations
   - Secure booking system
   - User profile management
   - Booking history and receipts
   - Multi-language support

   This is a beta release for internal testing.
   ```

6. **Review Release:**
   - Verify app version: `1 (1.0.0)`
   - Check AAB details
   - Review release notes

7. **Roll Out to Internal Testing:**
   - Click "Save" → "Review Release" → "Start Rollout to Internal Testing"

8. **Create Tester List:**
   - Release → Testing → Internal Testing → Testers tab
   - Create list: "Internal Team"
   - Add tester emails (up to 100)
   - Share opt-in link with testers

**⏱️ Availability:** Immediate (no Google review)

**Testing Duration:** 1-2 weeks recommended

---

#### Upload to Production (After Testing)

1. **Play Console → Release → Production**

2. **Create New Release:**
   - Click "Create new release"

3. **Upload AAB:**
   - Same process as internal testing
   - Upload `app-release.aab`

4. **Release Notes (User-facing):**

   ```
   Welcome to Rural Tourism Sabah!

   Discover authentic rural experiences:
   ✓ Browse accommodations and activities
   ✓ Secure online booking
   ✓ Easy payment processing
   ✓ Digital confirmations

   Download now and explore Sabah!
   ```

5. **Staged Rollout (Optional but Recommended):**
   - Start with 20% of users → Monitor for crashes
   - Increase to 50% if stable
   - Full 100% rollout when confident

6. **Review and Submit:**
   - Click "Save" → "Review Release"
   - Check all details
   - Click "Start Rollout to Production"

**⏱️ Google Review:** 1-7 days (usually 1-3 days)

**Approval Email:** Notification when app is live

---

### Step 5: Wait for Google Review

**What Google Checks:**

- ✅ Policy compliance (no malware, no prohibited content)
- ✅ App functionality (does it work?)
- ✅ Metadata accuracy (description matches app)
- ✅ Content rating appropriateness
- ✅ Privacy policy validity
- ✅ Data safety accuracy
- ✅ Intellectual property (no trademark violations)

**Review Timeline:**

- **Fast:** Few hours (rare)
- **Normal:** 1-3 days (most common)
- **Slow:** Up to 7 days (complex apps)
- **Delayed:** Weeks (if issues found)

**Possible Outcomes:**

**✅ Approved:**

- Email: "Your app is live on Google Play"
- App appears in search within hours
- Share Play Store link: `https://play.google.com/store/apps/details?id=com.sabah.ruraltourism`

**❌ Rejected:**

- Email with rejection reasons
- Common reasons:
  - Policy violations
  - Broken functionality
  - Misleading metadata
  - Privacy policy issues
- Fix issues → Resubmit

**⚠️ Suspended:**

- Serious policy violations
- Appeal process available

---

### Step 6: Post-Launch Monitoring

#### Play Console Dashboard

**Monitor These Metrics:**

1. **Installs & Uninstalls:**
   - Track daily installs
   - Monitor uninstall rate (goal: <2% daily)

2. **Crash Reports:**
   - Play Console → Quality → Android Vitals → Crashes
   - Goal: Crash-free rate >99.5%
   - Fix crashes in updates

3. **ANRs (App Not Responding):**
   - Goal: ANR rate <0.5%
   - Indicates performance issues

4. **User Reviews & Ratings:**
   - Respond to reviews (improves rating)
   - Address common complaints
   - Track rating trends

5. **Pre-Launch Report:**
   - Automated tests on real devices
   - Check for compatibility issues

---

## ✅ Pre-Publishing Checklist

### Code & Configuration

- [ ] **App ID changed** from `io.ionic.starter` to production ID (`com.sabah.ruraltourism`)
  - [ ] Updated in `capacitor.config.ts`
  - [ ] Updated in `android/app/build.gradle` (namespace + applicationId)

- [ ] **App Name verified** in `capacitor.config.ts` (`Rural Tourism Sabah`)

- [ ] **Production API configured**
  - [ ] Created `environment.native.ts` with absolute HTTPS URLs
  - [ ] Backend API accessible via HTTPS
  - [ ] CORS configured for mobile app
  - [ ] API rate limiting appropriate

- [ ] **Security hardening**
  - [ ] Removed `cleartext: true` from `capacitor.config.ts`
  - [ ] Removed development IPs from `network_security_config.xml`
  - [ ] Disabled mixed content mode
  - [ ] HTTPS enforced

- [ ] **Version numbers set**
  - [ ] `versionCode: 1` in `build.gradle`
  - [ ] `versionName: "1.0.0"` in `build.gradle`

- [ ] **Keystore created and backed up**
  - [ ] Keystore file in secure location (not in git)
  - [ ] Backed up to 3+ locations
  - [ ] Passwords stored in password manager
  - [ ] `key.properties` created and gitignored

- [ ] **Build configuration**
  - [ ] Signing config added to `build.gradle`
  - [ ] Release build type configured
  - [ ] Tested signed AAB builds successfully

### Assets & Branding

- [ ] **App Icon (512x512px)**
  - [ ] High-resolution PNG
  - [ ] No transparency
  - [ ] Follows brand guidelines

- [ ] **Feature Graphic (1024x500px)**
  - [ ] Eye-catching banner design
  - [ ] Includes app name/tagline

- [ ] **Screenshots (minimum 2, recommended 4-8)**
  - [ ] Phone screenshots (1080x1920px or higher)
  - [ ] Show key features:
    - [ ] Home/Browse screen
    - [ ] Activity detail
    - [ ] Booking flow
    - [ ] Profile/Account
  - [ ] Clean, recent app state
  - [ ] No lorem ipsum or test data

- [ ] **Promo Video (optional but recommended)**
  - [ ] 30-120 seconds
  - [ ] Shows app functionality
  - [ ] Uploaded to YouTube

### Legal & Compliance

- [ ] **Privacy Policy**
  - [ ] Written and covers all data collection
  - [ ] Hosted at public URL (HTTPS)
  - [ ] Includes contact email
  - [ ] Covers: data collected, usage, storage, user rights

- [ ] **Terms of Service (optional but recommended)**
  - [ ] User agreement
  - [ ] Cancellation policies
  - [ ] Operator terms

- [ ] **Content Rating completed**
  - [ ] Questionnaire filled accurately
  - [ ] Rating appropriate for content

- [ ] **Data Safety section completed**
  - [ ] All data collection disclosed
  - [ ] Security practices described
  - [ ] Third-party sharing disclosed

### Play Console Setup

- [ ] **Developer Account**
  - [ ] Created and verified
  - [ ] $25 fee paid
  - [ ] Identity verification completed

- [ ] **App Created** in Play Console
  - [ ] App name: Rural Tourism Sabah
  - [ ] Default language set
  - [ ] Free app selected

- [ ] **Store Listing Complete**
  - [ ] Full description written (4000 chars)
  - [ ] Short description (80 chars)
  - [ ] All graphics uploaded
  - [ ] Contact email set
  - [ ] Website URL set

- [ ] **App Access**
  - [ ] Test account credentials provided
  - [ ] Instructions for reviewers clear

### Testing

- [ ] **Functional Testing**
  - [ ] User registration works
  - [ ] Login/logout works
  - [ ] Browse activities/accommodations
  - [ ] Search and filters functional
  - [ ] Booking flow complete
  - [ ] Payment processing works
  - [ ] Receipts generated
  - [ ] Profile management
  - [ ] Image uploads work
  - [ ] Offline functionality (if applicable)

- [ ] **Device Testing**
  - [ ] Tested on Android 11+
  - [ ] Tested on different screen sizes
  - [ ] Tested on low-end devices
  - [ ] No crashes or ANRs

- [ ] **Network Testing**
  - [ ] Works on WiFi
  - [ ] Works on mobile data
  - [ ] Handles poor connectivity gracefully
  - [ ] API timeouts handled

- [ ] **Internal Testing Track**
  - [ ] Deployed to internal testing
  - [ ] Tested by team (minimum 3 people)
  - [ ] Critical bugs fixed
  - [ ] Feedback incorporated

### Backend Readiness

- [ ] **Production API**
  - [ ] Deployed and stable
  - [ ] HTTPS configured
  - [ ] SSL certificate valid
  - [ ] Performance tested under load

- [ ] **Database**
  - [ ] Backups configured
  - [ ] Performance optimized
  - [ ] Migrations up to date

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry, etc.)
  - [ ] Performance monitoring
  - [ ] Uptime monitoring
  - [ ] Alert systems configured

---

## 🔄 Maintenance & Updates

### Version Management

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR:** New features (e.g., 1.0.0 → 1.1.0)
- **PATCH:** Bug fixes (e.g., 1.0.0 → 1.0.1)

**Version Code:** Integer that increments with every release

| Release      | versionName | versionCode |
| ------------ | ----------- | ----------- |
| Initial      | 1.0.0       | 1           |
| Bug fix      | 1.0.1       | 2           |
| New feature  | 1.1.0       | 3           |
| Major update | 2.0.0       | 4           |

**Update `build.gradle` for each release:**

```gradle
defaultConfig {
    versionCode 2  // Increment by 1
    versionName "1.0.1"  // Semantic version
}
```

---

### Releasing Updates

#### Step 1: Make Changes

```bash
# Make code changes
# Test thoroughly
# Commit to git
git commit -m "Fix: Booking confirmation email issue"
```

#### Step 2: Increment Versions

File: `android/app/build.gradle`

```gradle
defaultConfig {
    versionCode 2  // Was 1
    versionName "1.0.1"  // Was 1.0.0
}
```

#### Step 3: Build New Release

```bash
# Build web app
npx ionic build --prod

# Sync to Android
npx cap sync android

# Build signed AAB
cd android
./gradlew bundleRelease
```

#### Step 4: Upload to Play Console

1. Play Console → Production → Create New Release
2. Upload new AAB
3. Add release notes:

   ```
   Version 1.0.1

   Bug Fixes:
   • Fixed booking confirmation email not sending
   • Improved app loading speed
   • Fixed crash on payment screen

   Improvements:
   • Updated activity images
   • Better error messages
   ```

4. Review and submit

#### Step 5: Staged Rollout (Recommended)

1. Start with 10-20% rollout
2. Monitor crash-free rate for 24-48 hours
3. Increase to 50% if stable
4. Full 100% rollout

**⏱️ Update Review:** Usually faster than initial (hours to 1 day)

---

### Hotfix Process (Critical Bugs)

**When to use:** Critical bugs affecting all users (crashes, data loss, security issues)

1. **Fix bug immediately**
2. **Increment patch version:** 1.0.0 → 1.0.1
3. **Build and upload AAB**
4. **Request Expedited Review** (in Play Console)
5. **Monitor closely** after rollout

---

### Capacitor Plugins

The following Capacitor plugins are installed and synced to the Android project:

| Plugin | Version | Purpose |
|---|---|---|
| `@capacitor/app` | 6.0.1 | App lifecycle events |
| `@capacitor/haptics` | 6.0.1 | Haptic feedback |
| `@capacitor/keyboard` | 6.0.2 | Keyboard handling |
| `@capacitor/network` | 7.0.4 | Network status detection |
| `@capacitor/status-bar` | 6.0.1 | Status bar styling |
| `@capacitor/filesystem` | 6.0.4 | Write files to device storage (PDF downloads) |
| `@capacitor/share` | 6.0.4 | Open native share sheet (PDF downloads) |

#### PDF Download on Android

On Android, `URL.createObjectURL()` + anchor click does not work inside the Capacitor WebView. A `NativeDownloadService` (`src/app/services/native-download.service.ts`) handles this:

- **On Android (native):** Converts the blob to base64, writes it to the cache directory via `@capacitor/filesystem`, then opens the system share sheet via `@capacitor/share` so the user can open or save the PDF.
- **On web (browser):** Falls back to the standard blob + anchor click download.

This applies to:
- Booking confirmation PDF (`booking-detail` page)
- Monthly statement PDF (`my-transaction` page)

When adding new Capacitor plugins, always run:

```bash
npm install @capacitor/plugin-name@6 --legacy-peer-deps
npx cap sync android
```

> **Note:** The project uses `--legacy-peer-deps` due to mixed Capacitor v6/v7 plugin versions. Do not run `npm install` without this flag.

---

### Build Scripts (npm)

The following npm scripts are available for convenience:

```bash
# Sync Capacitor after web build
npm run android:sync

# Open project in Android Studio
npm run android:open

# Build web app and sync to Android
npm run android:build

# Build release AAB (requires key.properties setup)
npm run android:release

# Build release APK for testing
npm run android:apk

# Complete release workflow
npm run full-release
```

---

## 🔧 Troubleshooting

### Common Development Issues

#### Issue: `npm install` fails with peer dependency errors

**Solution:**

```bash
npm install --legacy-peer-deps
```

#### Issue: Ionic serve shows "Cannot GET /api"

**Solution:** Backend not running

```bash
# Start backend in separate terminal
cd ../rural-tourism-backend
npm start
```

#### Issue: Changes not showing in app

**Solution:** Clear build and restart

```bash
rm -rf www/
npx ionic build
npx cap sync android
```

---

### Common Build Issues

#### Issue: Gradle build fails with "SDK location not found"

**Solution:** Set ANDROID_HOME

```bash
export ANDROID_HOME=$HOME/Android/Sdk
# Add to ~/.bashrc to persist
```

#### Issue: "Keystore file not found"

**Solution:** Check `key.properties` path

```properties
# Use absolute path
storeFile=/home/username/secure-keys/rural-tourism-release.keystore
```

#### Issue: Build fails with "Execution failed for task ':app:mergeReleaseResources'"

**Solution:** Clean build

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

#### Issue: AAB upload rejected: "Version code already used"

**Solution:** Increment versionCode

```gradle
versionCode 2  // Was 1
```

---

### Common Runtime Issues

#### Issue: App shows white screen on launch

**Causes & Solutions:**

1. **Web assets not synced:**

   ```bash
   npx cap sync android
   ```

2. **API not accessible:**
   - Check `environment.native.ts` has correct API URL
   - Verify API is HTTPS
   - Test API endpoint in browser

3. **JavaScript errors:**
   - Open Chrome DevTools: `chrome://inspect`
   - Connect device, inspect webview
   - Check console for errors

#### Issue: "net::ERR_CLEARTEXT_NOT_PERMITTED"

**Solution:** API must be HTTPS, or allow cleartext (dev only)

`capacitor.config.ts` (development only):

```typescript
server: {
  androidScheme: 'https',
  cleartext: true  // Only for development!
}
```

#### Issue: App crashes on certain Android versions

**Solution:** Check minimum SDK version

```gradle
minSdkVersion 23  // Android 6.0+
```

---

### Play Console Issues

#### Issue: App rejected for policy violations

**Common Reasons:**

- Misleading app description
- Broken functionality
- Privacy policy missing/invalid
- Data safety inaccuracies

**Solution:** Read rejection email carefully, fix issues, resubmit

#### Issue: Low rating / bad reviews

**Actions:**

1. Respond to reviews professionally
2. Address common complaints in updates
3. Add features users request
4. Improve onboarding for confused users

#### Issue: High crash rate

**Solution:**

1. Play Console → Quality → Android Vitals → Crashes
2. Review stack traces
3. Fix critical crashes
4. Release hotfix update

---

## 📚 Resources

### Official Documentation

- **Ionic Framework:** [ionicframework.com/docs](https://ionicframework.com/docs)
- **Capacitor:** [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Angular:** [angular.io/docs](https://angular.io/docs)
- **Android Developers:** [developer.android.com](https://developer.android.com)
- **Play Console Help:** [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)

### Useful Tools

- **Capacitor CLI Docs:** [capacitorjs.com/docs/cli](https://capacitorjs.com/docs/cli)
- **Android Studio Download:** [developer.android.com/studio](https://developer.android.com/studio)
- **Privacy Policy Generator:** [termsfeed.com/privacy-policy-generator](https://www.termsfeed.com/privacy-policy-generator/)
- **App Icon Generator:** [easyappicon.com](https://easyappicon.com/)
- **Screenshot Maker:** [screenshots.pro](https://screenshots.pro/)

### Community Support

- **Ionic Forum:** [forum.ionicframework.com](https://forum.ionicframework.com)
- **Stack Overflow:** Tag `ionic-framework`, `capacitor`
- **Discord:** Ionic Community Discord
- **Reddit:** r/ionic

---

## 📞 Support

**For Rural Tourism Sabah App Issues:**

- Email: support@ruraltourism.sabah.gov.my
- Website: https://ruraltourism.sabah.gov.my/support

**For Development Questions:**

- Check documentation first (links above)
- Search existing issues in project repository
- Ask team lead or senior developer

---

## 📋 Quick Reference Commands

```bash
# Development
npm install --legacy-peer-deps        # Install dependencies
npm start                              # Start dev server
npx ionic serve --lab                  # Multi-device preview

# Building
npx ionic build --prod                 # Build web app
npx cap sync android                   # Sync to Android
npx cap open android                   # Open in Android Studio

# Release Builds
cd android                             # Navigate to Android folder
./gradlew bundleRelease                # Build AAB (Play Store)
./gradlew assembleRelease              # Build APK (testing)

# Testing
adb devices                            # List connected devices
adb install app-debug.apk              # Install APK on device
adb logcat                             # View device logs

# Version Management
# Edit: android/app/build.gradle
# Increment: versionCode and versionName

# Keystore
keytool -genkey -v -keystore name.keystore ...  # Generate keystore
jarsigner -verify -verbose file.aab             # Verify signature
```

---

**Document Version:** 1.0  
**Last Updated:** May 7, 2026  
**Maintained By:** Development Team

---

_For questions or improvements to this documentation, contact the development team._

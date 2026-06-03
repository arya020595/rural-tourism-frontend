# Android Device Requirements for RUTeC

This document outlines the minimum and recommended device specifications required to install and run the RUTeC (Rural Tourism Sabah) Android application.

---

## Minimum Requirements

| Specification | Minimum |
|---|---|
| **Android Version** | Android 7.0 (Nougat) — API Level 24 |
| **RAM** | 2 GB |
| **Storage** | 100 MB free space |
| **Internet Connection** | Required (WiFi or Mobile Data) |
| **Screen Size** | 4.5 inches |
| **Screen Resolution** | 720 x 1280 (HD) |
| **Processor** | 1.4 GHz quad-core |

---

## Recommended Requirements

| Specification | Recommended |
|---|---|
| **Android Version** | Android 10.0 (API Level 29) or higher |
| **RAM** | 4 GB or higher |
| **Storage** | 500 MB free space |
| **Internet Connection** | WiFi or 4G/5G Mobile Data |
| **Screen Size** | 5.5 inches or larger |
| **Screen Resolution** | 1080 x 1920 (FHD) or higher |
| **Processor** | 2.0 GHz octa-core or higher |

---

## Required Device Features

| Feature | Purpose |
|---|---|
| **Internet Connectivity** | All data is fetched from the backend server |
| **Camera** | Profile photo upload |
| **GPS / Location Services** | Tourism location features |
| **Google Play Services** | Required for app installation via Play Store |

---

## APK Technical Details

| Property | Value |
|---|---|
| **Package Name** | com.sabah.ruraltourism |
| **Target SDK** | Android 14 (API Level 35) |
| **Minimum SDK** | Android 7.0 (API Level 24) |
| **App Framework** | Ionic 8 + Angular 18 + Capacitor 7 |
| **Architecture** | arm64-v8a (64-bit) |

---

## Not Supported

- Android versions below 7.0 (API Level 24)
- Android tablets (UI is not optimized for tablet screen sizes)
- Rooted devices (may cause instability or security issues)
- iOS devices (Android only)

---

## Notes

- An active internet connection is required for most features as the app connects to the RUTeC backend server.
- The app supports **offline mode** — bookings created or edited while offline are queued locally (IndexedDB) and automatically synced when connectivity is restored.
- PDF downloads (booking confirmation, monthly statement) use the native share sheet on Android — the user can open or save the file via any installed PDF viewer.
- For the best experience, use a device running Android 10 or higher with at least 4 GB RAM.

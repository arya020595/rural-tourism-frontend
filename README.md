# Rural Tourism Sabah - Frontend

An Ionic Angular mobile application for rural tourism in Sabah. This project supports both web (PWA) and Android platforms using Capacitor.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start the development server (Ionic - port 8100)
npx ionic serve

# Or use Angular CLI (port 4200)
npx ng serve --open

# The app will open at http://localhost:8100 (Ionic) or http://localhost:4200 (Angular)
```

> ⚠️ **Note**: Make sure your backend API is running at `http://localhost:3000/api` before starting the application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
  - [Android Development](#android-development)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before running this project, ensure you have the following installed:

### Required Software

| Software    | Version | Download Link                     |
| ----------- | ------- | --------------------------------- |
| Node.js     | >= 18.x | [nodejs.org](https://nodejs.org/) |
| npm         | >= 9.x  | Comes with Node.js                |
| Ionic CLI   | >= 7.2  | Installed globally via npm        |
| Angular CLI | 18.x    | Installed globally via npm        |

### For Android Development (Optional)

| Software       | Version | Download Link                                                 |
| -------------- | ------- | ------------------------------------------------------------- |
| Android Studio | Latest  | [developer.android.com](https://developer.android.com/studio) |
| Java JDK       | >= 11   | [adoptium.net](https://adoptium.net/)                         |
| Android SDK    | API 30+ | Via Android Studio                                            |
| Capacitor CLI  | >= 7.2  | Installed via npm                                             |

### Install Global Dependencies

```bash
# Install Ionic CLI globally
npm install -g @ionic/cli

# Install Angular CLI globally (optional, Ionic CLI handles Angular commands)
npm install -g @angular/cli
```

---

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd rural-tourism-frontend
   ```

2. **Install project dependencies**:

   ```bash
   npm install --legacy-peer-deps
   ```

   > ⚠️ **Important**: Use `--legacy-peer-deps` flag to resolve Capacitor version conflicts.

3. **Verify installation**:
   ```bash
   npx ionic info
   ```

---

## Running the Application

### Prerequisites Before Running

Make sure your **backend API server is running** on port 3000:

- API Endpoint: `http://localhost:3000/api`
- Test endpoint: `http://localhost:3000/api/test`

### Development Server

**Method 1: Ionic CLI** (Recommended for Ionic features - port 8100):

```bash
npx ionic serve
```

The application will be available at: **http://localhost:8100**

**Method 2: Angular CLI** (For standard Angular development - port 4200):

```bash
npx ng serve --open
```

The application will be available at: **http://localhost:4200**

**Method 3: Ionic Lab** (Shows iOS and Android preview side by side):

```bash
npm start
```

The application will be available at: **http://localhost:8200**

### Available Ports

- **Ionic serve**: `http://localhost:8100` - Full Ionic features
- **Angular CLI**: `http://localhost:4200` - Standard Angular dev server
- **Ionic Lab**: `http://localhost:8200` - Multi-platform preview

### Production Build

Build the application for production:

```bash
npm run build
```

Or with Ionic CLI:

```bash
ionic build --prod
```

The production files will be generated in the `www/` directory.

### Serve Production Build

To test the production build locally:

```bash
npm run serveProd
```

---

## Android Development

### Initial Setup

1. **Sync Capacitor with Android**:

   ```bash
   npx cap sync android
   ```

2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

### Build and Run on Android

1. **Build the web assets first**:

   ```bash
   ionic build
   ```

2. **Copy assets to Android**:

   ```bash
   npx cap copy android
   ```

3. **Sync plugins and dependencies**:

   ```bash
   npx cap sync android
   ```

4. **Run on device/emulator** (from Android Studio or):
   ```bash
   npx cap run android
   ```

### Live Reload on Android Device

For development with live reload on a connected Android device:

```bash
ionic capacitor run android --livereload --external
```

---

## Environment Configuration

The application uses environment files for configuration:

### Development Environment

File: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  API: "http://localhost:3000",

  // Feature flags for development
  enableDebugMode: true,
  logApiCalls: true,
};
```

### Production Environment

File: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "http://localhost:3000/api",
  API: "http://localhost:3000",

  // Feature flags for production
  enableDebugMode: false,
  logApiCalls: false,
};
```

### Backend API Configuration

This application requires a backend API server running on port `3000`. Make sure to:

1. Start your backend server before running the application
2. Update the `apiUrl` and `API` values in the environment files to match your backend server address

### Proxy Configuration

For development, a proxy configuration is available in `proxy.conf.json` to handle CORS issues:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

---

## Available Scripts

| Script      | Command             | Description                             |
| ----------- | ------------------- | --------------------------------------- |
| `start`     | `npm start`         | Start development server with Ionic Lab |
| `serveProd` | `npm run serveProd` | Serve production build                  |
| `build`     | `npm run build`     | Build the application                   |
| `watch`     | `npm run watch`     | Build with watch mode for development   |
| `test`      | `npm test`          | Run unit tests                          |
| `lint`      | `npm run lint`      | Run ESLint for code quality             |
| `new`       | `npm run new`       | Generate a new Ionic page               |

### Additional Ionic Commands

```bash
# Generate a new page
ionic generate page pages/page-name

# Generate a new component
ionic generate component components/component-name

# Generate a new service
ionic generate service services/service-name
```

---

## Project Structure

```
rural-tourism-frontend/
├── android/                 # Android native project (Capacitor)
├── public/                  # Public static assets & icons
├── src/
│   ├── app/                 # Angular application source
│   │   ├── about/           # About page
│   │   ├── acco-form/       # Accommodation form
│   │   ├── activity-details/# Activity details page
│   │   ├── activity-form/   # Activity form
│   │   ├── add-item/        # Add activity/accommodation page
│   │   ├── booking-home/    # Booking home page
│   │   ├── home/            # Home page
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── notifications/   # Notifications page
│   │   ├── operator-bookings/ # Operator bookings management
│   │   ├── receipt/         # Receipt pages
│   │   ├── services/        # Angular services (API, auth, etc.)
│   │   ├── tourist/         # Tourist-specific pages
│   │   ├── transaction/     # Transaction page
│   │   ├── utils/           # Utility functions
│   │   ├── app-routing.module.ts
│   │   ├── app.module.ts
│   │   └── auth.guard.ts    # Route guard for authentication
│   ├── assets/              # Static assets (images, icons, etc.)
│   ├── environments/        # Environment configuration files
│   ├── theme/               # SCSS theme variables
│   ├── global.scss          # Global styles
│   ├── index.html           # Main HTML file
│   ├── main.ts              # Application entry point
│   ├── polyfills.ts         # Browser polyfills
│   ├── sw.js                # Service worker
│   └── manifest.webmanifest # PWA manifest
├── www/                     # Production build output
├── angular.json             # Angular CLI configuration
├── capacitor.config.ts      # Capacitor configuration
├── ionic.config.json        # Ionic CLI configuration
├── proxy.conf.json          # Dev proxy configuration
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── karma.conf.js            # Karma test configuration
```

---

## Troubleshooting

### Common Issues

#### 1. "Port 8100 is already in use"

```bash
# Kill the process using port 8100
npx kill-port 8100

# Or specify a different port
ionic serve --port 8101
```

#### 2. Node modules issues

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

#### 3. SweetAlert2 TypeScript errors

If you encounter TypeScript errors related to SweetAlert2, install compatible versions:

```bash
npm install sweetalert2@^11.26.17 @sweetalert2/ngx-sweetalert2@^14.1.1 --legacy-peer-deps
```

#### 4. Android build fails

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

#### 5. Capacitor sync issues

```bash
# Remove and re-add Android platform
npx cap rm android
npx cap add android
npx cap sync android
```

#### 6. CORS errors during development

Make sure your backend server allows CORS, or use the proxy configuration in `proxy.conf.json`.

#### 7. PWA/Service Worker issues

Clear the browser cache and unregister service workers:

1. Open Developer Tools (F12)
2. Go to Application tab
3. Click "Clear storage" and "Clear site data"

---

## Technologies Used

| Category       | Technology                    |
| -------------- | ----------------------------- |
| Framework      | Ionic 8 + Angular 18          |
| Mobile         | Capacitor 7.2 (Android)       |
| UI Components  | Ionic Components + Ionicons 7 |
| QR Code        | angularx-qrcode 18            |
| Alerts         | SweetAlert2 11.x              |
| Slider         | Swiper 11.x                   |
| Calendar       | ion7-calendar                 |
| Image Compress | compressorjs                  |
| Screenshot     | html2canvas                   |
| Date Utility   | Moment.js                     |
| PWA            | Angular Service Worker        |
| Testing        | Karma + Jasmine               |
| Linting        | ESLint + Angular ESLint       |
| Language       | TypeScript 5.4                |

---

## Support

For issues and questions, please create an issue in the repository.

---

## License

This project is private and proprietary.

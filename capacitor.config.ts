import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Rural Tourism Sabah',
  webDir: 'www',
  server: {
    // If you need to use cleartext (http://) for local testing or for specific use cases
    cleartext: true,
  },
  android: {
    // Optional: Enabling cleartext on Android for local HTTP (not recommended for production)
    allowMixedContent: true,  // Allow HTTP content on HTTPS app (only for testing)
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabah.ruraltourism',
  appName: 'RUTeC',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    // Allow HTTP for staging — REMOVE before Play Store release
    cleartext: true,
  },
  android: {
    // Allow HTTP mixed content for staging — REMOVE before Play Store release
    allowMixedContent: true,
  },
};

export default config;

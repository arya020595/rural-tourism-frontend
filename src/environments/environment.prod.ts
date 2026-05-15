export const environment = {
  production: true,
  // Temporarily pointing to local backend for offline PWA testing
  apiUrl: 'http://localhost:3000/api',
  API: 'http://localhost:3000',

  // Feature flags for production
  enableDebugMode: false,
  logApiCalls: false,
};

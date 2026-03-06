export const environment = {
  production: true,
  // Uses relative URLs - nginx reverse proxy handles routing to backend
  apiUrl: '/api',
  API: typeof window !== 'undefined' ? window.location.origin : '',

  // Feature flags for production
  enableDebugMode: false,
  logApiCalls: false,
};

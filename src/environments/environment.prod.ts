export const environment = {
  production: true,
  // Uses relative URLs - nginx reverse proxy handles routing to backend
  apiUrl: '/api',
  API: '',

  // Feature flags for production
  enableDebugMode: false,
  logApiCalls: false,
};

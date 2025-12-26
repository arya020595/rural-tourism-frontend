export const environment = {
  production: true,
  // TODO: Replace with your production API URL
  // For local development: http://localhost:3000/api
  // For production: https://your-api-domain.com/api
  apiUrl: 'http://localhost:3000/api',
  API: 'http://localhost:3000',

  // Feature flags for production
  enableDebugMode: false,
  logApiCalls: false,
};

// Production URL examples:
// Cloud hosting: apiUrl: 'https://api.ruraltourismsabah.com/api'
// VPS hosting: apiUrl: 'http://46.202.163.155:3000/api'
// Local network: apiUrl: 'http://192.168.1.7:3000/api'

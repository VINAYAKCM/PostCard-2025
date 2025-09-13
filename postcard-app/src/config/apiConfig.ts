// API Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';

export const apiConfig = {
  // Backend API base URL
  baseUrl: isDevelopment 
    ? 'http://localhost:3002' 
    : process.env.REACT_APP_BACKEND_URL || 'https://postcard-2025-production.up.railway.app',
  
  // API endpoints
  endpoints: {
    generatePostcard: '/api/generate-postcard',
    checkEmailLimit: '/api/check-email-limit',
    health: '/api/health'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${apiConfig.baseUrl}${endpoint}`;
};

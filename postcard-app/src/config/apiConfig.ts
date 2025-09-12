// API Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';

export const apiConfig = {
  // Backend API base URL
  baseUrl: isDevelopment 
    ? 'http://localhost:3002' 
    : '', // Use relative URLs in production (Vercel will handle routing)
  
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

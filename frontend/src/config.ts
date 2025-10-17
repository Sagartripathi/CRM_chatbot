/**
 * Frontend Configuration
 * Handles environment-specific settings for API connections
 */

// Get API URL from environment variable or fallback to development proxy
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://crm-chatbot-ei2d.onrender.com" // Production backend URL
    : "http://localhost:8000"); // Local development

// API endpoints configuration
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  leads: `${API_BASE_URL}/api/leads`,
  campaigns: `${API_BASE_URL}/api/campaigns`,
  meetings: `${API_BASE_URL}/api/meetings`,
  tickets: `${API_BASE_URL}/api/tickets`,
  health: `${API_BASE_URL}/api/health`,
};

// Export for debugging
export const config = {
  apiBaseUrl: API_BASE_URL,
  environment: process.env.NODE_ENV,
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

// Log configuration in development and production for debugging
console.log("🔧 Frontend Config:", config);
console.log("🌐 API Base URL:", API_BASE_URL);
console.log("🔍 REACT_APP_API_URL env:", process.env.REACT_APP_API_URL);

// Warn if production without API URL
if (config.isProduction && !process.env.REACT_APP_API_URL) {
  console.error("⚠️ WARNING: REACT_APP_API_URL is not set in production!");
}

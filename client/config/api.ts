/**
 * API Configuration - Single source of truth for API base URL
 * 
 * Configure API_BASE_URL via environment variable:
 * - EXPO_PUBLIC_API_URL: Full URL to your backend (e.g., https://api.yoursite.com)
 * 
 * IMPORTANT: For production builds, EXPO_PUBLIC_API_URL must be set.
 * In development, defaults to localhost:5000
 */

declare const __DEV__: boolean;

function buildApiBaseUrl(): string {
  // Check for explicit API URL environment variable
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (apiUrl) {
    // Ensure the value has a protocol
    const base = apiUrl.startsWith("http://") || apiUrl.startsWith("https://")
      ? apiUrl
      : `https://${apiUrl}`;
    
    // Remove trailing slash, ensure it ends with /api
    const cleanBase = base.replace(/\/+$/, "");
    return cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
  }
  
  // In development, use localhost
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return "http://localhost:5000/api";
  }
  
  // PRODUCTION: If EXPO_PUBLIC_API_URL is not set, this is a configuration error
  // Throw an error to fail fast rather than silently break
  throw new Error(
    "EXPO_PUBLIC_API_URL environment variable is required for production builds. " +
    "Set it to your backend URL (e.g., https://api.yoursite.com)"
  );
}

export const API_BASE_URL = buildApiBaseUrl();

// Log API URL at startup (development only)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log("API_BASE_URL =", API_BASE_URL);
}

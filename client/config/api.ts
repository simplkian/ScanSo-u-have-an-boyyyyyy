/**
 * API Configuration - Single source of truth for API base URL
 * 
 * This ensures all API requests go to the correct backend, whether running
 * on Render (production) or locally (development).
 */

// Build the API base URL from environment variables
function buildApiBaseUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_API_BASE ||
    process.env.EXPO_PUBLIC_DOMAIN ||
    "https://container-control.onrender.com";

  // Ensure the value has a protocol
  const base = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;

  // Remove trailing slash if present, then ensure it ends with /api
  const cleanBase = base.replace(/\/+$/, "");
  
  // Only append /api if not already present
  return cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
}

export const API_BASE_URL = buildApiBaseUrl();

// Log API URL at startup (development only)
if (__DEV__) {
  console.log("API_BASE_URL =", API_BASE_URL);
}

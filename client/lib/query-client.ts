import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";

// Auth storage key - must match AuthContext
const AUTH_STORAGE_KEY = "@containerflow_auth_user";

/**
 * Get the API base URL
 * Uses the centralized configuration from config/api.ts
 */
export function getApiUrl(): string {
  return API_BASE_URL;
}

/**
 * Normalize API path - strips "/api" prefix if present since API_BASE_URL already ends with "/api"
 * This maintains backward compatibility with existing code that uses paths like "/api/tasks"
 */
function normalizePath(path: string): string {
  // Ensure path starts with /
  let normalized = path.startsWith("/") ? path : `/${path}`;
  
  // Strip /api prefix if present (since API_BASE_URL already ends with /api)
  if (normalized.startsWith("/api/")) {
    normalized = normalized.substring(4); // Remove "/api" prefix, keep the rest
  } else if (normalized === "/api") {
    normalized = "";
  }
  
  return normalized;
}

// Get current user ID from AsyncStorage for auth headers
async function getStoredUserId(): Promise<string | null> {
  try {
    const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.id || null;
    }
  } catch {
    // Ignore errors - no user stored
  }
  return null;
}

/**
 * Check if response is HTML instead of JSON (indicates wrong URL)
 */
function checkForHtmlResponse(res: Response, fullUrl: string): void {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(
      `API misconfigured: received HTML instead of JSON. Check API_BASE_URL. URL=${fullUrl}, API_BASE_URL=${API_BASE_URL}`
    );
  }
}

async function throwIfResNotOk(res: Response, fullUrl: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Normalize path to avoid double /api prefix
  const path = normalizePath(route);
  const fullUrl = `${API_BASE_URL}${path}`;

  // Build headers with authentication
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Include user ID for authentication on protected routes
  const userId = await getStoredUserId();
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Check for HTML response (indicates wrong URL configuration)
  checkForHtmlResponse(res, fullUrl);

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Normalize path to avoid double /api prefix
    const path = normalizePath(queryKey[0] as string);
    const fullUrl = `${API_BASE_URL}${path}`;

    // Build URL with query params if provided
    const url = new URL(fullUrl);
    if (queryKey.length > 1 && queryKey[1]) {
      const params = queryKey[1] as Record<string, string>;
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    const res = await fetch(url.toString(), {
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });

    // Check for HTML response (indicates wrong URL configuration)
    checkForHtmlResponse(res, url.toString());

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, url.toString());
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

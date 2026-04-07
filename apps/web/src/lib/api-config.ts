/**
 * Centralized API configuration for the Kybern Portfolio/Academy.
 * Ensures consistent absolute URL resolution across client and server components.
 */

const DEFAULT_API_BASE = "http://localhost:8080/api";

export function getApiBaseUrl(): string {
  // Check for environment variable
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // If envBase is missing or empty, fallback to local dev default
  if (!envBase || envBase.trim() === "") {
    return DEFAULT_API_BASE;
  }

  // Ensure it's an absolute URL (starts with http)
  // If it's a relative path starting with /api, we should still handle it 
  // but in Next.js server context, absolute is safer.
  if (envBase.startsWith("/")) {
    // If it's a relative path, we might be on the client or server.
    // In local dev, we almost always want the absolute URL to the Go backend.
    if (typeof window !== "undefined") {
      return `${window.location.origin}${envBase}`;
    }
    // Fallback for server-side relative paths (usually doesn't happen with 8080 default)
    return `http://localhost:8080${envBase}`;
  }

  return envBase;
}

export const API_BASE_URL = getApiBaseUrl();

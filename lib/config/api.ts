/**
 * API Configuration
 *
 * This file centralizes API endpoint configuration for the application.
 *
 * Server-side code (API routes, server components) should use the internal endpoints
 * that work within the Docker network.
 *
 * Client-side code should use relative URLs which will be resolved by the browser.
 */

// Server-side API endpoints (for API routes and server components)
export const FASTAPI_ENDPOINT = process.env.FASTAPI_ENDPOINT || "http://fastapi:8000";
export const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || "http://host.docker.internal:11434";
export const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:3000";

// Database configuration
export const DATABASE_URL = process.env.DATABASE_URL;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/?directConnection=true";
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "quicksilver";

/**
 * Client-side API helper
 *
 * For client-side components, always use relative URLs.
 * Example: fetch('/api/projects') instead of fetch('http://localhost:3000/api/projects')
 *
 * This ensures requests go through the browser and work correctly whether
 * accessed via localhost, domain name, or through a reverse proxy.
 */
export const getApiUrl = (path: string) => {
  // On the client side (browser), use relative URLs
  if (typeof window !== 'undefined') {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // On the server side (SSR), use the internal API URL
  return `${INTERNAL_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// auth.ts
// Edge-compatible authentication utilities for WorkOS
import { workos } from "./instances";
import { cookies } from "next/headers";
import type { User } from "@workos-inc/node";

const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;

export interface AuthResult {
  authenticated: boolean;
  user?: User;
  error?: string;
}

/**
 * Authenticates the user from the session cookie.
 * Edge-compatible authentication helper.
 */
export async function authenticateUser(): Promise<AuthResult> {
  if (!workos) {
    return {
      authenticated: false,
      error: "WorkOS instance not initialized",
    };
  }

  if (!cookiePassword) {
    return {
      authenticated: false,
      error: "Missing cookie password configuration",
    };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("wos-session");

  if (!sessionCookie) {
    return {
      authenticated: false,
      error: "No session cookie found",
    };
  }

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie.value,
      cookiePassword: cookiePassword,
    });

    const authStatus = await session.authenticate();

    if (authStatus.authenticated) {
      return {
        authenticated: true,
        user: authStatus.user,
      };
    }

    // Try to refresh the session
    const sessionRefresh = await session.refresh();

    if (sessionRefresh.authenticated) {
      // Note: In edge runtime, we can't set cookies directly here
      // The route handler will need to handle cookie updates
      return {
        authenticated: true,
        user: sessionRefresh.user,
      };
    }

    return {
      authenticated: false,
      error: "Session is invalid and could not be refreshed",
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      authenticated: false,
      error: "Invalid session",
    };
  }
}

/**
 * Returns a JSON error response for unauthenticated requests
 */
export function unauthorizedResponse(message?: string) {
  return Response.json({ error: message || "Unauthorized" }, { status: 401 });
}

/**
 * Returns a JSON error response for server errors
 */
export function serverErrorResponse(message?: string) {
  return Response.json(
    { error: message || "Internal Server Error" },
    { status: 500 },
  );
}

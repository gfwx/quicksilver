// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("wos-session")?.value;
  const userDataCookie = request.cookies.get("user-data")?.value;
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
  const isHomePage = request.nextUrl.pathname === "/";

  // Check if user-data cookie exists and is valid
  if (userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie);
      const now = Date.now();

      // If token is still valid, allow the request through
      if (userData && userData.expires.getTime() <= now) {
        console.log("Valid user-data found, skipping WorkOS auth");
        return NextResponse.next();
      }

      console.log("user-data expired, re-authenticating");
    } catch (error) {
      console.error("Invalid user-data cookie:", error);
      // Continue to authentication flow below
    }
  }

  // If no session cookie, redirect to home (but not if already on home)
  if (!sessionCookie) {
    if (isHomePage) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If no cookie password configured, redirect to home
  if (!cookiePassword) {
    console.error("Missing WORKOS_COOKIE_PASSWORD environment variable");
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie,
      cookiePassword: cookiePassword,
    });

    const authStatus = await session.authenticate();
    if (authStatus.authenticated) {
      // Create response and add user data to cookie
      const response = NextResponse.next();

      const userData = {
        id: authStatus.user.id,
        email: authStatus.user.email,
        firstName: authStatus.user.firstName,
        lastName: authStatus.user.lastName,
        profilePictureUrl: authStatus.user.profilePictureUrl,
      };

      response.cookies.set("user-data", JSON.stringify(userData), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: Math.floor(Date.now() / 1000 + 3600),
      });

      return response;
    }

    // Attempt to refresh the session if it's not authenticated
    const sessionRefresh = await session.refresh();
    if (sessionRefresh.authenticated) {
      // Create response with refreshed session cookie
      const response = NextResponse.next();

      if (!sessionRefresh.sealedSession) {
        throw new Error("Session is invalid and could not be refreshed.");
      }

      // Set the new session cookie
      response.cookies.set("wos-session", sessionRefresh.sealedSession, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });

      const userData = {
        id: sessionRefresh.user.id,
        email: sessionRefresh.user.email,
        firstName: sessionRefresh.user.firstName,
        lastName: sessionRefresh.user.lastName,
        profilePictureUrl: sessionRefresh.user.profilePictureUrl,
      };

      response.cookies.set("user-data", JSON.stringify(userData), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: Math.floor(Date.now() / 1000 + 3600),
      });

      return response;
    }

    // If refresh fails, redirect to home
    throw new Error("Session is invalid and could not be refreshed.");
  } catch (error) {
    console.error("Authentication middleware error:", error);

    // Clear the invalid cookies and redirect
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("wos-session");
    response.cookies.delete("user-data");

    return response;
  }
}

export const config = {
  matcher: ["/", "/projects/:path*"],
};

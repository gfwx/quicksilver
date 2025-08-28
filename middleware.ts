// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!, {
  clientId: process.env.WORKOS_CLIENT_ID!,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply middleware to dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('wos-session')?.value;
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;

  // If no session cookie, redirect to home
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If no cookie password configured, redirect to home
  if (!cookiePassword) {
    console.error('Missing WORKOS_COOKIE_PASSWORD environment variable');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  try {
    // Load the sealed session
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie,
      cookiePassword: cookiePassword
    });

    const authStatus = await session.authenticate();

    if (authStatus.authenticated) {
      // Create response and add user data to headers
      const response = NextResponse.next();

      // Pass user data in headers (JSON stringified)
      response.headers.set('x-user-data', JSON.stringify({
        id: authStatus.user.id,
        email: authStatus.user.email,
        firstName: authStatus.user.firstName,
        lastName: authStatus.user.lastName,
        profilePictureUrl: authStatus.user.profilePictureUrl,
      }));

      response.headers.set('x-user-id', authStatus.user.id);
      response.headers.set('x-user-email', authStatus.user.email || '');

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
      response.cookies.set('wos-session', sessionRefresh.sealedSession, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
      });

      // Pass refreshed user data in headers
      response.headers.set('x-user-data', JSON.stringify({
        id: sessionRefresh.user.id,
        email: sessionRefresh.user.email,
        firstName: sessionRefresh.user.firstName,
        lastName: sessionRefresh.user.lastName,
        profilePictureUrl: sessionRefresh.user.profilePictureUrl,
      }));

      response.headers.set('x-user-id', sessionRefresh.user.id);
      response.headers.set('x-user-email', sessionRefresh.user.email || '');

      return response;
    }

    // If refresh fails, redirect to home
    throw new Error("Session is invalid and could not be refreshed.");

  } catch (error) {
    console.error('Authentication middleware error:', error);

    // Clear the invalid session cookie and redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('wos-session');

    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

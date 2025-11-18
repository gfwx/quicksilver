import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const profileCookie = request.cookies.get("x-current-user-id")?.value;
  const isHomePage = request.nextUrl.pathname === "/";

  if (!profileCookie && !isHomePage) {
    console.log("No profile cookie found! Redirecting to home.");
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  console.log("Cookie found or on home page, continuing...");
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/projects/:path*"],
};

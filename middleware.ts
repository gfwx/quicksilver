import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const profileCookie = request.cookies.get("x-current-user-id")?.value;
  const isHomePage = request.nextUrl.pathname === "/";

  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("Path:", request.nextUrl.pathname);
  console.log("Profile Cookie Value:", profileCookie);
  console.log("All Cookies:", request.cookies.getAll());
  console.log("Is Home Page:", isHomePage);

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

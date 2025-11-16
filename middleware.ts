import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const profileCookie = request.cookies.get("x-user-data")?.value;
  const isHomePage = request.nextUrl.pathname === "/";

  if (!profileCookie && !isHomePage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/projects/:path*"],
};

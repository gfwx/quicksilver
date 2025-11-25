// app/api/set-cookie/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    console.log("=== SET COOKIE API DEBUG ===");
    console.log("Token received:", token);

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("x-current-user-id", token, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 20, // effectively forever
    });

    console.log("Cookie set with value:", token);

    return res;
  } catch (error) {
    console.error("[SetUserCookie] Error setting user cookie:", error);
    return NextResponse.json(
      { error: "Failed to set user cookie" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  // Clear the cookie
  res.cookies.set("x-current-user-id", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}

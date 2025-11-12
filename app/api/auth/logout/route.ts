// app/api/auth/logout/route.ts
// Edge-compatible WorkOS logout endpoint
import { workos } from "@/lib/instances";
import { cookies } from "next/headers";
import { serverErrorResponse, unauthorizedResponse } from "@/lib/auth";

const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;

export const runtime = "edge";
export async function GET() {
  console.log("Session Logout...");

  if (!workos || !cookiePassword) {
    return serverErrorResponse("WorkOS not configured");
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("wos-session");

  if (!sessionCookie) {
    return unauthorizedResponse("No sealed session token found.");
  }

  console.log(sessionCookie?.value);

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie.value,
      cookiePassword: cookiePassword,
    });

    await session.authenticate();
    const logoutUrl = await session.getLogoutUrl();

    // Create a response with redirect
    const response = Response.redirect(logoutUrl);

    // Clear the session cookie
    const headers = new Headers(response.headers);
    headers.append(
      "Set-Cookie",
      `wos-session=; Path=/; HttpOnly; ${process.env.NODE_ENV === "production" ? "Secure;" : ""} SameSite=Lax; Max-Age=0`,
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return serverErrorResponse(`Failed to generate logout URL: ${error}`);
  }
}

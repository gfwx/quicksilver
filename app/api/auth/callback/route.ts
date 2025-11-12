// app/api/auth/callback/route.ts
// Edge-compatible WorkOS callback endpoint
import { workos } from "@/lib/instances";
import { upsertUser } from "@/lib/userCrudService";
import { serverErrorResponse } from "@/lib/auth";

const workosClientId = process.env.WORKOS_CLIENT_ID;
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

export async function GET(req: Request) {
  console.log("Initiated callback route");

  if (!workos || !workosClientId || !cookiePassword) {
    return serverErrorResponse("WorkOS not configured");
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const authenticateResponse =
      await workos.userManagement.authenticateWithCode({
        code,
        clientId: workosClientId,
        session: {
          sealSession: true,
          cookiePassword: cookiePassword,
        },
      });

    const { user, sealedSession } = authenticateResponse;
    await upsertUser(user);

    // Create a redirect response with the session cookie
    const response = Response.redirect(`${frontendUrl}/projects`);
    const headers = new Headers(response.headers);

    const cookieOptions = [
      `wos-session=${sealedSession}`,
      "Path=/",
      "HttpOnly",
      process.env.NODE_ENV === "production" ? "Secure" : "",
      "SameSite=Lax",
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
    ]
      .filter(Boolean)
      .join("; ");

    headers.append("Set-Cookie", cookieOptions);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Callback error:", error);
    return Response.redirect(`${frontendUrl}/?error=callback_failed`);
  }
}

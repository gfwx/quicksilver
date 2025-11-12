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

    console.log("Sealed session length:", sealedSession.length);
    console.log("Sealed session type:", typeof sealedSession);

    // Create a redirect response with the session cookie
    const redirectUrl = `${frontendUrl}/projects`;

    // Build Set-Cookie header (WorkOS sealed sessions are already cookie-safe)
    const cookieOptions = [
      `wos-session=${sealedSession}`,
      "Path=/",
      "HttpOnly",
      process.env.NODE_ENV === "production" ? "Secure" : "",
      "SameSite=Lax",
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days in seconds
    ]
      .filter(Boolean)
      .join("; ");

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": cookieOptions,
      },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${frontendUrl}/?error=callback_failed`,
      },
    });
  }
}

// app/api/auth/login/route.ts
// Edge-compatible WorkOS login endpoint
import { workos } from "@/lib/instances";
import { serverErrorResponse } from "@/lib/auth";

const workosClientId = process.env.WORKOS_CLIENT_ID;
const redirectUri = "http://localhost:3000";

export async function GET() {
  if (!workos || !workosClientId) {
    return serverErrorResponse("WorkOS not configured");
  }

  try {
    const authUrl = workos.userManagement.getAuthorizationUrl({
      provider: "authkit",
      redirectUri: `${redirectUri}/api/auth/callback`,
      clientId: workosClientId,
    });

    return Response.redirect(authUrl, 302);
  } catch (error) {
    console.error("Login error:", error);
    return serverErrorResponse(
      `Failed to generate authorization URL: ${error}`,
    );
  }
}

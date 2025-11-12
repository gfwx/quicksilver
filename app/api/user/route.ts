// app/api/user/route.ts
// Edge-compatible user info endpoint
import { authenticateUser, unauthorizedResponse } from "@/lib/auth";
import { encryptPayload } from "@/lib/cookie-helpers";
import type { Payload } from "@/lib/types";

export const runtime = "edge";

export async function GET() {
  const authResult = await authenticateUser();

  if (!authResult.authenticated || !authResult.user) {
    return unauthorizedResponse(authResult.error);
  }

  const payload: Payload = {
    id: authResult.user.id,
    exp: Math.floor(Date.now() / 1000 + 3600),
  };

  const encryptedUserId = await encryptPayload(payload);

  return Response.json({
    user: {
      id: encryptedUserId,
      email: authResult.user.email,
      firstName: authResult.user.firstName,
      lastName: authResult.user.lastName,
      profilePictureUrl: authResult.user.profilePictureUrl,
    },
  });
}

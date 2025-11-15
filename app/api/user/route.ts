// app/api/user/route.ts
// Edge-compatible user info endpoint
import { authenticateUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const authResult = await authenticateUser();

  if (!authResult.authenticated || !authResult.user) {
    return unauthorizedResponse(authResult.error);
  }

  return Response.json({
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      firstName: authResult.user.firstName,
      lastName: authResult.user.lastName,
      profilePictureUrl: authResult.user.profilePictureUrl,
    },
  });
}

// lib/userCrudService.ts
// Edge-compatible user CRUD service
import { prisma } from "./instances";

export async function upsertUser(user: User) {
  if (!prisma) {
    throw new Error("Prisma client not initialized");
  }

  // Validate required fields from WorkOS
  if (!user.email) {
    throw new Error("WorkOS user missing email; cannot upsert without it");
  }

  const firstName = user.firstName ?? "User";
  const lastName = user.lastName ?? "";
  const profilePictureUrl = user.profilePictureUrl ?? null; // Already optional, but explicit

  // Optional: Log for debugging (remove in production)

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      profileName,
      profileDescription
      profilePictureUrl,
      updatedAt: new Date(),
    },
    create: {
      id: user.id,
      firstName,
      lastName,
      profilePictureUrl,
      updatedAt: new Date(),
    },
  });
}

// lib/userCrudService.ts
// Edge-compatible user CRUD service
import { prisma } from "./instances";
import type { User } from "@workos-inc/node";

/**
 * Upserts a user from WorkOS into the database
 * This uses WorkOS's "User" type. Ideally WorkOS and Prisma should use the same type for
 * user, but it's diminishing returns.
 */
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
      firstName,
      lastName,
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

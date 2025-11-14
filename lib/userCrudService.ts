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

  // Handle potential nulls from WorkOS
  const emailVerified = user.emailVerified ?? false;
  const firstName = user.firstName ?? "User";
  const lastName = user.lastName ?? "";
  const profilePictureUrl = user.profilePictureUrl ?? null; // Already optional, but explicit

  // Optional: Log for debugging (remove in production)
  console.log("Upserting WorkOS user:", {
    id: user.id,
    email: user.email,
    emailVerified,
  });

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      firstName,
      lastName,
      emailVerified,
      profilePictureUrl,
      lastSignInAt: new Date(),
    },
    create: {
      id: user.id,
      role: "user",
      email: user.email,
      firstName,
      lastName,
      emailVerified,
      profilePictureUrl,
      lastSignInAt: new Date(),
    },
  });
}

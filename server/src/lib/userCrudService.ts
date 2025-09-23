import { globals } from "./instances";
import type { User } from "@workos-inc/node";

// this uses WorkOS's "User" type. Ideally WorkOS and Prisma should use the same type for
// user, but it's diminishing returns.
export const upsertUser = async (user: User) => {
  const { prisma } = globals;
  if (!prisma) {
    throw new Error("Prisma client not initialized");
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      firstName: user.firstName ?? "User",
      lastName: user.lastName ?? "",
      emailVerified: user.emailVerified,
      profilePictureUrl: user.profilePictureUrl,
      lastSignInAt: new Date(),
    },
    create: {
      id: user.id,
      role: 'user',
      email: user.email,
      firstName: user.firstName ?? "User",
      lastName: user.lastName ?? "",
      emailVerified: user.emailVerified,
      profilePictureUrl: user.profilePictureUrl,
      lastSignInAt: new Date(),
    },
  });
}

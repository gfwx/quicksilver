import { cookies } from "next/headers";
import { prisma } from "./instances";

export async function getCurrentProfile() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("x-user-data")?.value;

  if (!profileId) {
    return null;
  }

  try {
    const profile = await prisma.user.findUnique({
      where: { id: profileId },
    });

    return profile;
  } catch (error) {
    console.error("Error fetching current profile:", error);
    return null;
  }
}

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("No active profile found");
  }

  return profile;
}

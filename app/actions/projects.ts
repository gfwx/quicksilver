import { prisma } from "@/lib/instances";
import { decryptPayload } from "@/lib/cookie-helpers";

/**
 * Gets all projects given the encrypted user string. If the payload is not expired, then
 * data is queried from the database.
 * All decryption is done
 * @param string
 */
export async function getProjects(encryptedUserId: string) {
  try {
    const payload = await decryptPayload(encryptedUserId);

    // Case 01: Payload string is invalid.
    if (!payload) {
      console.error('Payload is null');
      return [];
    }

    // Case 02: Payload string is valid but objecis invalid (expired)
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('Payload is expired. Please authenticate');
      return [];
    }

    // Case 03: Payload is valid and object is valid
    const projects = await prisma.project.findMany({
      where: {
        userId: payload.id
      }
    })

    return projects;
  } catch (error) {
    console.error('Failed to decrypt user data from cookie: ', error);
  }
}

export async function addProject()

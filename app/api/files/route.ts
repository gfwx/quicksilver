export const runtime = "edge";
import { prisma } from "@/lib/instances";
import { checkPayload } from "@/lib/helpers";
import { decryptPayload } from "@/lib/cookie-helpers";

/**
 * Gets files for a specific project given a project ID.
 * Returns an empty array if no files are found.
 * Request headers need to contain project-id
 */

export async function GET(request: Request) {
  const projectId = request.headers.get("project-id");
  const userPayloadString = request.headers.get("user-id");
  if (!projectId) {
    return new Response(JSON.stringify({ message: "Empty project id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!userPayloadString) {
    return new Response(
      JSON.stringify({ message: "User payload not present." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const pl = await decryptPayload(userPayloadString);
  if (checkPayload(pl)) {
    const files = await prisma.file.findMany({
      where: {
        projectId: projectId,
        userId: pl.id,
      },
    });

    return new Response(JSON.stringify(files), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(
      JSON.stringify({
        message: "User payload is invalid, please reauthenticate",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/instances";
import { decryptPayload } from "@/lib/cookie-helpers";
import { checkPayload } from "@/lib/helpers";

/**
 * Gets files for a specific project given a project ID.
 * Returns an empty array if no files are found.
 * Request headers need to contain x-project-id and x-encrypted-user-id
 */

export async function GET(request: NextRequest) {
  try {
    const projectId = request.headers.get("x-project-id");
    const encryptedUserId = request.headers.get("x-encrypted-user-id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID" },
        { status: 400 },
      );
    }

    if (!encryptedUserId) {
      return NextResponse.json(
        { error: "Missing encrypted user ID" },
        { status: 400 },
      );
    }

    const payload = await decryptPayload(encryptedUserId);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
    }

    if (!checkPayload(payload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { error: "Payload expired, please re-authenticate" },
        { status: 401 },
      );
    }

    const files = await prisma.file.findMany({
      where: {
        projectId: projectId,
        userId: payload.id,
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Failed to get files: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

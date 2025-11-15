import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/instances";

/**
 * Gets files for a specific project given a project ID.
 * Returns an empty array if no files are found.
 * Request headers need to contain x-project-id and x-user-id
 */

export async function GET(request: NextRequest) {
  try {
    const projectId = request.headers.get("x-project-id");
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing Project ID" },
        { status: 400 },
      );
    }

    const files = await prisma.file.findMany({
      where: {
        projectId,
        userId,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/instances";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        user: {
          select: {
            id: true,
            profileName: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Failed to fetch all projects: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

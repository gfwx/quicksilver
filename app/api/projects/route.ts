import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/instances";
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing encrypted user ID" },
        { status: 400 },
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to get projects: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectTitle, projectContext } = body;

    if (!projectTitle) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 },
      );
    }

    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing encrypted user ID" },
        { status: 400 },
      );
    }

    const pid = crypto.randomUUID();

    if (!userId) {
      return NextResponse.json(
        { error: "No user id provided!" },
        { status: 401 },
      );
    }

    const project = await prisma.project.create({
      data: {
        id: pid,
        userId: userId,
        projectTitle: projectTitle,
        projectContext: projectContext ?? "",
        updatedAt: new Date(),
        projectTags: "",
      },
    });

    console.log(`Project created with id ${project.id}`);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, projectTitle, projectContext, userId } = body;

    if (!projectId || !projectTitle || !userId) {
      return NextResponse.json(
        {
          error: "Missing required fields: projectId, projectTitle, userId",
        },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No user id provided!" },
        { status: 401 },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        projectTitle: projectTitle,
        projectContext: projectContext ?? "",
        updatedAt: new Date(),
      },
    });

    console.log(`Project updated with id ${updatedProject.id}`);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a project
export async function DELETE(request: NextRequest) {
  const ai_endpoint = process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000/";

  try {
    const body = await request.json();
    const { projectId, userId } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, userId" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete vector embeddings from FastAPI
    try {
      const vectorDeleteResponse = await fetch(
        `${ai_endpoint}/api/vector?project_id=${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
        },
      );

      if (!vectorDeleteResponse.ok) {
        console.error(
          `Failed to delete vector embeddings for project ${projectId}: ${vectorDeleteResponse.status}`,
        );
        // Continue with project deletion even if vector deletion fails
      } else {
        console.log(
          `Successfully deleted vector embeddings for project ${projectId}`,
        );
      }
    } catch (vectorError) {
      console.error(
        `Error calling FastAPI to delete vectors for project ${projectId}:`,
        vectorError,
      );
      // Continue with project deletion even if vector deletion fails
    }

    // Delete project from database (cascading deletes will handle files)
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    console.log(`Project deleted with id ${projectId}`);
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete project: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

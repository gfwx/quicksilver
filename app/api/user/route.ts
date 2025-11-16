import { prisma } from "@/lib/instances";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        lastOpened: "desc",
      },
    });

    return Response.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, profileDescription } = body;

    if (!firstName || !lastName) {
      return Response.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        firstName,
        lastName,
        profileDescription: profileDescription || null,
        lastOpened: new Date(),
      },
    });

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, firstName, lastName, profileDescription, lastOpened } = body;

    if (!id) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (profileDescription !== undefined) updateData.profileDescription = profileDescription;
    if (lastOpened !== undefined) updateData.lastOpened = new Date(lastOpened);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return Response.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const ai_endpoint = process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000/";

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const currentProfileId = cookieStore.get("x-user-data")?.value;

    if (currentProfileId === id) {
      return Response.json(
        { error: "Cannot delete currently active profile" },
        { status: 400 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { userId: id },
    });

    console.log(`Found ${projects.length} projects to delete for user ${id}`);

    for (const project of projects) {
      console.log(`Deleting project ${project.id} for user ${id}`);

      try {
        const vectorDeleteResponse = await fetch(
          `${ai_endpoint}/api/vector?project_id=${encodeURIComponent(project.id)}`,
          {
            method: "DELETE",
          },
        );

        if (!vectorDeleteResponse.ok) {
          console.error(
            `Failed to delete vector embeddings for project ${project.id}: ${vectorDeleteResponse.status}`,
          );
        } else {
          console.log(
            `Successfully deleted vector embeddings for project ${project.id}`,
          );
        }
      } catch (vectorError) {
        console.error(
          `Error calling FastAPI to delete vectors for project ${project.id}:`,
          vectorError,
        );
      }

      await prisma.project.delete({
        where: { id: project.id },
      });

      console.log(`Successfully deleted project ${project.id}`);
    }

    await prisma.user.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: "User deleted successfully",
      projectsDeleted: projects.length
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

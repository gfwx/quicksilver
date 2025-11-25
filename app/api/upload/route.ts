import { prisma } from "@/lib/instances";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { FASTAPI_ENDPOINT } from "@/lib/config/api";

interface FileUploadResult {
  fileName: string;
  originalName: string;
  fastApiResult: { message: string };
}

export async function POST(req: Request) {
  if (!prisma) {
    console.error("Prisma instance is not initialized");
    return Response.json(
      { error: "Prisma instance not initialized" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const profileId = cookieStore.get("x-current-user-id")?.value;

  if (!profileId) {
    return Response.json({ error: "No active profile found" }, { status: 401 });
  }

  const projectId = req.headers.get("x-project-id");

  if (!projectId) {
    return Response.json(
      { message: "Missing project ID header" },
      { status: 400 },
    );
  }

  console.log("Completed checking project headers");

  let project;
  try {
    project = await prisma.project.findUnique({
      where: { id: projectId },
    });
  } catch (dbError) {
    console.error(`[Upload] Database error finding project ${projectId}:`, dbError);
    return Response.json(
      { error: "Database error while finding project" },
      { status: 500 },
    );
  }

  if (!project) {
    return Response.json(
      { message: "No matching project id!", id: projectId },
      { status: 400 },
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    console.log("Checking files..");
    if (!files || files.length === 0) {
      console.log("No files uploaded");
      return Response.json({ message: "No files uploaded" }, { status: 400 });
    }
    console.log(`Found ${files.length} files to process`);

    const processedFiles: FileUploadResult[] = [];

    for (const file of files) {
      console.log(
        `Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`,
      );

      const fileId = uuidv4();
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const fileName = `file-${timestamp}-${randomSuffix}-${file.name}`;

      const fileData = {
        id: fileId,
        status: "Pending",
        filename: fileName,
        originalname: file.name,
        size: file.size,
        encoding: "binary",
        userId: profileId,
        projectId: project.id,
      };

      let createdFile;
      try {
        createdFile = await prisma.file.create({ data: fileData });
        console.log(
          `File metadata stored for user ${profileId} with filename ${createdFile.filename}`,
        );
      } catch (dbError) {
        console.error(`[Upload] Failed to create file record for ${file.name}:`, dbError);
        throw new Error(`Database error creating file record: ${file.name}`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      let base64File = "";
      const chunkSize = 8192;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        base64File += String.fromCharCode.apply(null, Array.from(chunk));
      }
      base64File = btoa(base64File);

      const payloadToFastAPI = {
        filename: file.name,
        content: base64File,
        document_id: createdFile.filename,
        project_id: projectId,
        content_type: file.type || "application/octet-stream",
      };

      console.log(`Sending file to FastAPI: ${file.name}`);
      let response;
      try {
        response = await fetch(`${FASTAPI_ENDPOINT}/api/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payloadToFastAPI),
        });
      } catch (fetchError) {
        console.error(`[Upload] Network error calling FastAPI for ${file.name}:`, fetchError);
        throw new Error(`Network error calling FastAPI for file ${file.name}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Upload] FastAPI error for ${file.name}: ${response.status} - ${errorText}`);
        throw new Error(
          `FastAPI failed to process file ${file.name} with status: ${response.status}`,
        );
      }

      let fastAPIResponse;
      try {
        fastAPIResponse = await response.json();
        console.log(`Processed by FastAPI: ${JSON.stringify(fastAPIResponse)}`);
      } catch (jsonError) {
        console.error(`[Upload] Failed to parse FastAPI response for ${file.name}:`, jsonError);
        throw new Error(`Invalid JSON response from FastAPI for file ${file.name}`);
      }

      try {
        await prisma.file.update({
          where: { id: fileId },
          data: { status: "Processed" },
        });
      } catch (updateError) {
        console.error(`[Upload] Failed to update file status for ${file.name}:`, updateError);
        // Continue processing even if status update fails
      }

      processedFiles.push({
        fileName: createdFile.filename,
        originalName: file.name,
        fastApiResult: fastAPIResponse.message,
      });
    }

    try {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          updatedAt: new Date(),
          fileCount: {
            increment: processedFiles.length,
          },
        },
      });
    } catch (projectUpdateError) {
      console.error(`[Upload] Failed to update project file count for ${project.id}:`, projectUpdateError);
      // Continue and return success even if project update fails
    }

    return Response.json({
      message: "Files processed and uploaded securely.",
      filesProcessed: processedFiles.length,
      files: processedFiles,
      projectId: project.id,
    });
  } catch (error) {
    console.error("[Upload] Error processing project and files:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    if (errorStack) {
      console.error("[Upload] Stack trace:", errorStack);
    }
    return Response.json(
      { message: "Error processing files", error: errorMessage },
      { status: 500 },
    );
  }
}

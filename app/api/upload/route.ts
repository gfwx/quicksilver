// app/api/upload/route.ts
// Edge-compatible file upload endpoint that streams to FastAPI
import {
  authenticateUser,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/instances";
import { v4 as uuidv4 } from "uuid";

const ai_endpoint = process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000/";

interface FileUploadResult {
  fileName: string;
  originalName: string;
  fastApiResult: any;
}

export async function POST(req: Request) {
  console.log("Route fired for multiple file upload");

  // Check Prisma
  console.log("Checking prisma..");
  if (!prisma) {
    console.error("Prisma instance is not initialized");
    return serverErrorResponse("Prisma instance not initialized");
  }

  // Check authentication
  console.log("Checking user..");
  const authResult = await authenticateUser();
  if (!authResult.authenticated || !authResult.user) {
    return unauthorizedResponse(authResult.error);
  }

  const userId = authResult.user.id;

  // Read project information from headers
  console.log("Checking request headers:");
  const projectId = req.headers.get("x-project-id");

  if (!projectId) {
    return Response.json(
      { message: "Missing project ID header" },
      { status: 400 },
    );
  }

  console.log("Completed checking project headers");

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return Response.json(
      { message: "No matching project id!", id: projectId },
      { status: 400 },
    );
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    console.log("Checking files..");
    if (!files || files.length === 0) {
      console.log("No files uploaded");
      return Response.json({ message: "No files uploaded" }, { status: 400 });
    }
    console.log(`Found ${files.length} files to process`);

    const processedFiles: FileUploadResult[] = [];

    // Process each file
    for (const file of files) {
      console.log(
        `Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`,
      );

      const fileId = uuidv4();
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const fileName = `file-${timestamp}-${randomSuffix}-${file.name}`;

      // Create file metadata in database
      const fileData = {
        id: fileId,
        status: "Pending",
        filename: fileName,
        originalname: file.name,
        size: file.size,
        encoding: "binary", // Edge doesn't provide encoding, default to binary
        userId: userId,
        projectId: project.id,
      };

      const createdFile = await prisma.file.create({ data: fileData });
      console.log(
        `File metadata stored for user ${userId} with filename ${createdFile.filename}`,
      );

      // Convert File to ArrayBuffer and then to base64 for transmission
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Convert to base64 for JSON transmission
      let base64File = "";
      const chunkSize = 8192;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        base64File += String.fromCharCode.apply(null, Array.from(chunk));
      }
      base64File = btoa(base64File);

      // Send to FastAPI for processing with base64-encoded content
      const payloadToFastAPI = {
        filename: file.name,
        content: base64File,
        document_id: createdFile.filename,
        project_id: projectId,
        content_type: file.type || "application/octet-stream",
      };

      console.log(`Sending file to FastAPI: ${file.name}`);
      const response = await fetch(`${ai_endpoint}/api/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payloadToFastAPI),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`FastAPI error: ${response.status} - ${errorText}`);
        throw new Error(
          `FastAPI failed to process file ${file.name} with status: ${response.status}`,
        );
      }

      const fastAPIResponse = await response.json();
      console.log(`Processed by FastAPI: ${JSON.stringify(fastAPIResponse)}`);

      // Update file status
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "Processed" },
      });

      processedFiles.push({
        fileName: createdFile.filename,
        originalName: file.name,
        fastApiResult: fastAPIResponse,
      });
    }

    // Update project with file count
    await prisma.project.update({
      where: { id: project.id },
      data: {
        updatedAt: new Date(),
        fileCount: {
          increment: processedFiles.length,
        },
      },
    });

    return Response.json({
      message: "Files processed and uploaded securely.",
      filesProcessed: processedFiles.length,
      files: processedFiles,
      projectId: project.id,
    });
  } catch (error) {
    console.error("Error processing project and files:", error);
    return Response.json(
      { message: "Error processing files", error: String(error) },
      { status: 500 },
    );
  }
}

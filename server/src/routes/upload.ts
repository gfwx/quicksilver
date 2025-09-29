import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../lib/middleware";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from 'fs/promises';
import { globals } from "../lib/instances"
import { v4 } from "uuid"

const workosApiKey = process.env.WORKOS_API_KEY;
const workosClientId = process.env.WORKOS_CLIENT_ID;
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;

if (!workosApiKey || !workosClientId || !cookiePassword) {
  throw new Error('Missing required WorkOS environment variables.');
}

const { prisma } = globals;
const router = Router();
const uploaddir = 'uploads/';
const ai_endpoint = process.env.FASTAPI_ENDPOINT || 'http://127.0.0.1:8000/';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploaddir, { recursive: true });
      cb(null, uploaddir);
    } catch (error) {
      console.error('Failed to create upload directory', error);
      cb(new Error('Failed to create upload directory'), '');
    }
  },
  filename: (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + suffix + extension);
  }
});

const upload = multer({ storage });
router.use(cookieParser());

router.post('/', authMiddleware, upload.array('files'), async (req: Request, res: Response, next: NextFunction) => {
  console.log("Route fired for multiple file upload");

  console.log("Checking prisma..")
  if (!prisma) {
    console.error('Prisma instance is not initialized');
    res.status(500).json({ message: 'Internal Server Error: Prisma instance not initialized' });
    return;
  }

  console.log("Checking user..")
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  console.log("Checking files..")
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    console.log('No files uploaded')
    res.status(400).json({ message: 'No files uploaded' });
    return;
  }
  console.log("Completed checking files")

  // Read project information from headers
  console.log("Checking request headers:")
  const projectId = req.headers['x-project-id'] as string;
  console.log("Completed checking project headers")

  const userId = req.user.id;
  const uploadedFilePaths: string[] = [];

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(400).json({ message: "No matching project id!", id: projectId })
    return;
  }

  try {
    // Process each file
    const filePromises = files.map(async (file) => {
      uploadedFilePaths.push(file.path);

      const fileId = v4();

      const fileData = {
        id: fileId,
        status: 'Pending',
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        encoding: file.encoding,
        userId: userId,
        projectId: project.id,
      };

      const createdFile = await prisma.file.create({ data: fileData });
      console.log(`File metadata stored for user ${userId} with filename ${createdFile.filename}`);

      // Send to FastAPI for processing
      const payloadToFastAPI = {
        filepath: path.resolve(file.path),
        document_id: createdFile.filename
      };

      const response = await fetch(`${ai_endpoint}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payloadToFastAPI)
      });

      if (!response.ok) {
        throw new Error(`FastAPI failed to process file ${file.originalname} with status: ${response.status}`);
      }

      const fastAPIResponse = await response.json();
      console.log(`Processed by FastAPI: ${JSON.stringify(fastAPIResponse)}`);

      // Update file status
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'Processed' }
      });

      return {
        fileName: createdFile.filename,
        originalName: file.originalname,
        fastApiResult: fastAPIResponse
      };
    });

    const processedFiles = await Promise.all(filePromises);

    await prisma.project.update({
      where: { id: project.id },
      data: {
        updatedAt: new Date(),
        fileCount: {
          increment: processedFiles.length
        }
      }
    })

    res.status(200).json({
      message: 'Files processed and uploaded securely.',
      filesProcessed: processedFiles.length,
      files: processedFiles,
      projectId: project.id
    });
    return;

  } catch (error) {
    console.error('Error processing project and files:', error);

    // Clean up uploaded files if there was an error
    const cleanupPromises = uploadedFilePaths.map(filePath =>
      fs.unlink(filePath).catch(err =>
        console.error(`Failed to delete orphaned file ${filePath}:`, err)
      )
    );
    await Promise.allSettled(cleanupPromises);

    next(error);
  }
});

export default router;

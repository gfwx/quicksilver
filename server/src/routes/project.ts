import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../lib/middleware";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from 'fs/promises';
import { globals } from "../lib/instances";
import { v4 } from "uuid";

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
  if (!prisma) {
    res.status(500).json({ message: 'Internal Server Error: Prisma instance not initialized' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ message: 'No files uploaded' });
    return;
  }

  const { project_name, project_context } = req.body;
  if (!project_name) {
    res.status(400).json({ message: 'Project name is required' });
    return;
  }

  const userId = req.user.id;
  const uploadedFilePaths: string[] = [];

  try {
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          id: v4(),
          projectTitle: project_name,
          projectContext: project_context ?? "",
          userId: userId,
          updatedAt: new Date(),
        }
      });

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
          projectId: newProject.id,
        };

        const createdFile = await tx.file.create({ data: fileData });

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

        await tx.file.update({
          where: { id: fileId },
          data: { status: 'Processed' }
        });
      });

      await Promise.all(filePromises);

      await tx.project.update({
        where: { id: newProject.id },
        data: {
          fileCount: {
            increment: files.length
          }
        }
      });

      return newProject;
    });

    res.status(200).json({
      message: 'Project created and files processed successfully.',
      project: project
    });

  } catch (error) {
    console.error('Error creating project:', error);

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
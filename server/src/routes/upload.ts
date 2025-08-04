import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../lib/middleware";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from 'fs/promises';
import { globals } from "../lib/instances"

// --- Configuration Validation ---
const workosApiKey = process.env.WORKOS_API_KEY;
const workosClientId = process.env.WORKOS_CLIENT_ID;
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;

if (!workosApiKey || !workosClientId || !cookiePassword) {
  throw new Error('Missing required WorkOS environment variables.');
}

// --- Service Initialization ---
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

// --- Secured Upload Endpoint ---
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  // By the time this handler runs, authMiddleware has already run.
  // We can safely assume req.user exists and is valid.
  if (!prisma) {
    console.error('Prisma instance is not initialized');
    res.status(500).json({ message: 'Internal Server Error: Prisma instane not initialized' });
    return;
  }

  if (!req.user) {
    // This should theoretically never be reached if middleware is correct
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: 'No file upload found' });
    return;
  }

  const userId = req.user.id;
  const upload_path: string | undefined = req.file.path;

  try {
    const fileData = {
      status: 'Pending',
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      encoding: req.file.encoding,
      userId: userId, // Correctly link the file to the authenticated user
    };

    const createdFile = await prisma.file.create({ data: fileData });
    console.log(`File metadata stored for user ${userId} with id ${createdFile.filename}`);

    const payloadToFastAPI = {
      filepath: path.resolve(upload_path), // Use absolute path
      document_id: createdFile.filename
    };

    const response = await fetch(`${ai_endpoint}api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payloadToFastAPI)
    });

    if (!response.ok) {
      // Let the error handler manage this failure
      throw new Error(`FastAPI failed to process file with status: ${response.status}`);
    }

    const fastAPIResponse = await response.json();
    console.log(`Processed by FastAPI: ${JSON.stringify(fastAPIResponse)}`);

    await prisma.file.update({
      where: { filename: createdFile.filename },
      data: { status: 'Processed' }
    });

    res.status(200).json({
      message: 'File uploaded and processed successfully.',
      fileName: createdFile.filename,
      fastApiResult: fastAPIResponse
    });
    return;

  } catch (error) {
    // Cleanup orphaned file on failure
    if (upload_path) {
      fs.unlink(upload_path).catch(err => console.error("Failed to delete orphaned file:", err));
    }
    // Pass error to a central error handler
    next(error);
  }
});

export default router;

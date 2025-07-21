import { Router } from "express";
import { PrismaClient, Prisma } from "../../app/generated/prisma";
import multer from "multer";
import path from "path";
import fs from 'fs/promises';

const router = Router();

const prisma = new PrismaClient();
const uploaddir = 'uploads/';

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.mkdir(uploaddir, { recursive: true });
      cb(null, uploaddir);
    } catch (error) {
      const emsg = 'Failed to create upload directory'
      console.error(emsg, error);
      cb(new Error(emsg), '');
    }
  },

  filename: function (req, file, cb) {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + suffix + extension);
  }

})

const upload = multer({ storage });
const ai_endpoint = process.env.AI_ENDPOINT || 'http://127.0.0.1:8000/';

//@ts-ignore No matter what I do it just doesn't go away, at the same time everything works perfectly okay :-/
router.post('/', upload.single('file'), async (req, res) => {
  let upload_path: string | undefined
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file upload found' });
    }
    upload_path = req.file.path

    const fileData = {
      status: 'Pending',
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size.toString(),
      encoding: req.file.encoding,
    }

    const createdFile = await prisma.$transaction(async (tx) => {
      return await tx.file.create({
        data: fileData
      })
    })

    console.log(`File metadata stored with id ${req.file.filename}`)

    const payloadToFastAPI = {
      filepath: uploaddir + req.file.filename,
      document_id: createdFile.filename
    }

    const response = await fetch(`${ai_endpoint}api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payloadToFastAPI)
    })

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({ message: 'Non-JSON error response from FastAPI' }));
      console.error(`FastAPI failed to process file (Status: ${response.status}):`, errorDetails);

      await prisma.file.update({
        where: { filename: createdFile.filename },
        data: { status: 'ProcessingFailed' }
      }).catch(dbErr => console.error("Failed to update file status after FastAPI error:", dbErr));

      return res.status(response.status).json({
        message: 'FastAPI failed to process file.',
        fastApiError: errorDetails
      });
    }

    const fastAPIResponse = await response.json();
    console.log(`Processed by FastAPI: ${JSON.stringify(fastAPIResponse)}`)

    await prisma.file.update({
      where: { filename: createdFile.filename },
      data: {
        status: 'Processed'
      }
    }).catch(dbErr => console.error('Failed to update status after uploading data:', dbErr));


    return res.status(200).json({
      message: 'File uploaded and processed successfully.',
      fileName: createdFile.filename,
      fastApiResult: fastAPIResponse
    })
  }
  catch (error: any) {
    if (upload_path) {
      try {
        await fs.unlink(upload_path)
        console.log(`Successfully deleted file from server: ${upload_path}`);
      }
      catch (fileError: any) {
        console.log(`Failed to delete file from server; ${fileError}`);
      }
    }
    return res.status(500).json({
      message: 'Internal server error during file processing',
      error: error.message
    })
  }
})

export default router;

import { Router } from "express"
import { PrismaClient, Prisma } from "../../app/generated/prisma";
import multer from "multer";
import path from "path"
import { file } from "bun";

const router = Router();

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, 'uploads/')
  },

  filename: function (req, file, cb) {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + suffix + extension);
  }

})

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file upload found' });
  } else {
    console.log(req.body, req.file);

    const fileData = {
      status: 'Uploaded',
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

    console.log(`File created with id ${req.file.filename}`)

    res.status(200).json({ message: `File uploaded successfully!`, file: createdFile })
  }
})

export default router;

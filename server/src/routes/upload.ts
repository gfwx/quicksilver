import { Router } from "express"
import multer from "multer";
import path from "path"

const router = Router();

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

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.json({ message: 'No file upload found' });
  }

  console.log(req.body, req.file);

  res.json({ message: 'File uploaded successfully' })
})

export default router;

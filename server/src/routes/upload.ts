import { Router } from "express"

const router = Router();
router.post('/', (req, res) => {
  res.json({ message: 'File uploaded successfully' })
})

export default router;

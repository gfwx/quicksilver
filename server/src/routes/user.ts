import dotenv from "dotenv"
import { authMiddleware } from "../lib/middleware";
import { Router, Request, Response } from "express";
import { encryptPayload, type Payload } from "../lib/encryption";

dotenv.config();

const router = Router();
//@ts-expect-error BECAUSE I KNOW WHAT I AM DOING
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  console.log("/api/user/me fetched")
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload: Payload = {
    id: req.user.id,
    exp: Math.floor((Date.now() / 1000) + 3600)
  }

  const encryptedUserId = await encryptPayload(payload)
  res.json({
    user: {
      id: encryptedUserId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      profilePictureUrl: req.user.profilePictureUrl
    }
  });
});

export default router;

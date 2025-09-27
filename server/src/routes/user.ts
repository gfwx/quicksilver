import { authMiddleware } from "../lib/middleware";
import { Router, Request, Response } from "express";


// [FIX] Needs to be completely changed to include encrypted id in the response, not just plaintext.

const router = Router();
//@ts-expect-error BECAUSE I KNOW WHAT I AM DOING
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  console.log("/api/user/me fetched")
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      profilePictureUrl: req.user.profilePictureUrl
    }
  });
});

export default router;

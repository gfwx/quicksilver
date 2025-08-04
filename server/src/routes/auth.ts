import { Router, Request, Response } from "express"
import { WorkOS } from "@workos-inc/node";
import { PrismaClient } from "../../app/generated/prisma"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

dotenv.config();

const workosApiKey = process.env.WORKOS_API_KEY;
const workosClientId = process.env.WORKOS_CLIENT_ID;
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
const redirectUri = process.env.EXPRESS_SERVER_PATH;
const frontendUrl = process.env.FRONTEND_URL;


if (!workosApiKey || !workosClientId || !cookiePassword || !redirectUri) {
  throw new Error('Missing environment variables');
}

const prisma = new PrismaClient()
const workos = new WorkOS(workosApiKey, { clientId: workosClientId });
const router = Router();

router.use(cookieParser())

router.get('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const authUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri: redirectUri ?? "http://localhost:3001" + '/api/auth/callback',
      clientId: workosClientId
    })
    res.redirect(authUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/api/auth/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ error: 'No code provided' });
    return;
  }

  try {
    const authenticateResponse =
      await workos.userManagement.authenticateWithCode({
        code,
        clientId: workosClientId,
        session: {
          sealSession: true,
          cookiePassword: cookiePassword
        }
      });

    const { user, sealedSession } = authenticateResponse;
    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // business logic
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        firstName: user.firstName ?? "User",
        lastName: user.lastName ?? "",
        emailVerified: user.emailVerified,
        profilePictureUrl: user.profilePictureUrl,
        lastSignInAt: new Date(),
      },
      create: {
        id: user.id,
        role: 'user',
        email: user.email,
        firstName: user.firstName ?? "User",
        lastName: user.lastName ?? "",
        emailVerified: user.emailVerified,
        profilePictureUrl: user.profilePictureUrl,
        lastSignInAt: new Date(),
      },
    });

    res.redirect(frontendUrl ?? "http://localhost:3000/dashboard")
  }

  catch (error) {
    // Theoretical login route for the client. May be subject to change?
    console.error(error)
    res.redirect('/login')
  }
});

export default router;

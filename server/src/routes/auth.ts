import dotenv from 'dotenv'
dotenv.config();

import { Router, Request, Response } from "express"
import { globals } from "../lib/instances"
import cookieParser from "cookie-parser";
import { upsertUser } from '../lib/userCrudService';

const { workos, prisma } = globals;

const workosClientId = process.env.WORKOS_CLIENT_ID;
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
const redirectUri = process.env.EXPRESS_SERVER_PATH;
const frontendUrl = process.env.FRONTEND_URL;

if (!workosClientId || !cookiePassword || !redirectUri) {
  throw new Error('Missing environment variables');
}

if (!workos || !prisma) {
  throw new Error('Missing global instances!')
}

const router = Router();

router.use(cookieParser())

router.get('/login', async (req: Request, res: Response) => {
  try {
    const authUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri: 'http://localhost:3001/api/auth/callback', // needs to be changed to an environment variable
      clientId: workosClientId
    })
    res.redirect(authUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to generate authorization URL: ${error}` });
  }
});

router.get('/logout', async (req: Request, res: Response) => {
  console.log("Session Logout...")
  const sessionCookie = req.cookies['wos-session']

  if (!sessionCookie) {
    res.status(401).json({ error: 'No sealed session token found.' })
    return;
  }
  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie,
      cookiePassword: cookiePassword
    })

    await session.authenticate();
    const logoutUrl = await session.getLogoutUrl()

    res.clearCookie("wos-session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // or "none" if cross-site
      path: "/",       // must match cookie’s original path
    })

    res.redirect(logoutUrl);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to generate logout URL: ${error}` })
  }
})

router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  console.log("Initiated callback route")

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
    await upsertUser(user);

    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.redirect(`${frontendUrl}/dashboard`)
  }

  catch (error) {
    // Theoretical login route for the client. May be subject to change?
    console.error(error)
    res.redirect('/?error=callback_failed')
  }
});



export default router;

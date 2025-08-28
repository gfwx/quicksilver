import { Request, Response, NextFunction } from "express";
import { globals } from "./instances";
import dotenv from "dotenv"

dotenv.config();

const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
const { workos } = globals;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies['wos-session'];

  if (!workos) {
    res.status(500).json({ message: 'Internal Server Error: WorkOS instance not initialized.' });
    return;
  }
  if (!sessionCookie) {
    res.status(401).json({ message: 'Unauthorized: No session cookie provided.' });
    return;
  }
  if (!cookiePassword) {
    res.status(500).json({ message: 'Internal Server Error: Missing cookie password.' });
    return;
  }

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sessionCookie,
      cookiePassword: cookiePassword
    });

    const authStatus = await session.authenticate();

    if (authStatus.authenticated) {
      req.user = authStatus.user;
      return next();
    }

    const sessionRefresh = await session.refresh();

    if (sessionRefresh.authenticated) {
      res.cookie('wos-session', sessionRefresh.sealedSession, {
        path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax'
      });
      req.user = sessionRefresh.user;
      return next();
    }

    throw new Error("Session is invalid and could not be refreshed.");

  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.clearCookie('wos-session');
    res.status(401).json({ message: 'Unauthorized: Invalid session.' });
    return;
  }
};

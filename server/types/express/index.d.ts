// server/src/types/express/index.d.ts
import { User } from '@workos-inc/node';

// This merges our custom 'user' property with the existing Request interface
declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}

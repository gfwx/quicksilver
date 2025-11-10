import { PrismaClient } from "../../prisma-client"; // Assuming path is correct
import { WorkOS } from "@workos-inc/node";
import dotenv from "dotenv";
dotenv.config();

const workosApiKey = process.env.WORKOS_API_KEY;
const workosClientId = process.env.WORKOS_CLIENT_ID;

class Globals {
  public prisma: PrismaClient | null;
  public workos: WorkOS | null;

  constructor() {
    this.prisma = new PrismaClient();
    if (!workosApiKey || !workosClientId) {
      this.workos = null;
      throw new Error("Missing WorkOS API key or client ID");
    }
    this.workos = new WorkOS(workosApiKey, { clientId: workosClientId });
  }
}

export const globals = new Globals();

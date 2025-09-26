import { PrismaClient } from "./app/generated/prisma";
import { WorkOS } from "@workos-inc/node";
import dotenv from 'dotenv'

dotenv.config();

// This is done to prevent additional PrismaClient instances from being created upon mounting
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();


if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let workos: WorkOS | null = null;

if (process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID) {
  workos = new WorkOS(process.env.WORKOS_API_KEY, {
    clientId: process.env.WORKOS_CLIENT_ID,
  });
}

export { workos };

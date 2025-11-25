import { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { WorkOS } from "@workos-inc/node";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "",
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });
type ModelNames = Prisma.ModelName;
export type PrismaModels = {
  [M in ModelNames]: Exclude<
    Awaited<ReturnType<PrismaClient[Uncapitalize<M>]["findUnique"]>>,
    null
  >;
};
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let workos: WorkOS | null = null;

if (process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID) {
  workos = new WorkOS(process.env.WORKOS_API_KEY, {
    clientId: process.env.WORKOS_CLIENT_ID,
  });
}

export { workos };

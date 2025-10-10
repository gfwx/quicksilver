import { prisma } from "@/lib/instances"

/**
 * Gets files for a specific project given a project ID.
 * Returns an empty array if no files are found.
 * @param projectId
 * @returns
 */
export async function getFiles(projectId: string) {
  const f = await prisma.file.findMany({
    where: {
      projectId: projectId
    }
  })

  return f;
}

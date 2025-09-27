import { UserNav } from "@/components/userNav";
import { cookies } from "next/headers";
import { prisma, PrismaModels } from "@/lib/instances";
import { decryptPayload } from "@/lib/cookie-helpers";
import type { User } from "@/lib/types";

import { ProjectProvider } from "@/lib/contexts/ProjectContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let projects: PrismaModels["Project"][] = []

  try {
    const cookieStore = await cookies();
    const userData = cookieStore.get("user-data")?.value;

    if (userData) {
      try {
        const { id } = JSON.parse(userData) as User;
        const payload = await decryptPayload(id);
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          console.error('User session expired');
        } else {
          projects = await prisma.project.findMany({ where: { userId: payload.id } })
        }
      } catch (error) {
        console.error('Failed to decrypt user data from cookie: ', error);
      }
    }
  } catch (error) {
    console.error('An error occured while trying to fetch cookies: ', error);
  }
  return (
    <ProjectProvider initialProjects={projects}>
      <main className="p-8 flex flex-col gap-9">
        <UserNav />
        {children}
      </main>
    </ProjectProvider>
  );
};

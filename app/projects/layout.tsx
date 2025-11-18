import { cookies } from "next/headers";
import { ProjectProvider } from "@/lib/contexts/ProjectContext";
import { UserNav } from "@/components/userNav";
import type { PrismaModels } from "@/lib/instances";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let projects: PrismaModels["Project"][] = [];

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("x-current-user-id")?.value;

    if (!userId) {
      console.log("No x-current-user-id cookie found");
      return (
        <ProjectProvider initialProjects={[]}>
          <main className="p-8 flex flex-col gap-9">
            <UserNav />
            {children}
          </main>
        </ProjectProvider>
      );
    }
    console.log("Fetching user object from API: ", userId);
    // Use internal API URL for server-side fetches in Docker
    // This ensures the fetch goes directly to the Next.js container, not through nginx
    const internalApiUrl =
      process.env.INTERNAL_API_URL || "http://localhost:3000";
    const fullUrl = `${internalApiUrl}/api/projects`;

    console.log("Fetching from full URL:", fullUrl);

    const projectResponse = await fetch(`${fullUrl}?user=${userId}`, {
      method: "GET",
    });

    console.log("Response status:", projectResponse.status);

    if (projectResponse.ok) {
      const data = await projectResponse.json();
      console.log("Fetched projects data:", data);
      projects = data;
    } else {
      console.error(
        `Fetch failed with status: ${projectResponse.status} ${projectResponse.statusText}`,
      );
    }
  } catch (error) {
    console.error("Failed to fetch projects: ", error);
  }

  console.log("Final projects array length:", projects.length);

  return (
    <ProjectProvider initialProjects={projects}>
      <main className="p-8 flex flex-col gap-9">
        <UserNav />
        {children}
      </main>
    </ProjectProvider>
  );
}

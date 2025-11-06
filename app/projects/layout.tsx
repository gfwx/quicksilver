import { UserNav } from "@/components/userNav";
import { cookies, headers } from "next/headers";
import { PrismaModels } from "@/lib/instances";
import { ProjectProvider } from "@/lib/contexts/ProjectContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let projects: PrismaModels["Project"][] = [];

  try {
    // Get user data from the cookie set by middleware
    const cookieStore = await cookies();
    const userData = cookieStore.get("user-data")?.value;

    if (!userData) {
      console.log("No user-data cookie found");
      return (
        <ProjectProvider initialProjects={[]}>
          <main className="p-8 flex flex-col gap-9">
            <UserNav />
            {children}
          </main>
        </ProjectProvider>
      );
    }

    const { id } = JSON.parse(userData);
    console.log("Fetching projects with encrypted user ID:", id);

    // Construct full URL for server-side fetch
    const h = await headers();
    const protocol = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    const fullUrl = `${protocol}://${host}/api/projects`;

    console.log("Fetching from full URL:", fullUrl);

    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "x-encrypted-user-id": id,
      },
    });

    console.log("Response status:", res.status);

    if (res.ok) {
      const data = await res.json();
      console.log("Fetched projects data:", data);
      projects = data;
    } else {
      console.error(
        `Fetch failed with status: ${res.status} ${res.statusText}`,
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

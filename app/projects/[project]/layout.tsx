import { cookies } from "next/headers";
import { ChatSidebar } from "@/lib/components/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}>) {
  const p = await params;
  const projectId = p.project;

  let chats: { id: string; title: string; createdAt: Date; updatedAt: Date }[] =
    [];

  const cookieStore = await cookies();
  const id = cookieStore.get("x-current-user-id")?.value;

  if (!id) {
    console.log("No user found!");
    return (
      <SidebarProvider>
        <ChatSidebar chats={[]} projectId={projectId} userId={""} />
        <main className="flex-1 mx-auto overflow-auto">{children}</main>
      </SidebarProvider>
    );
  }

  try {
    const internalApiUrl =
      process.env.INTERNAL_API_URL || "http://localhost:3000";
    const fullUrl = `${internalApiUrl}/api/db/chats`;
    const response = await fetch(`${fullUrl}?user=${id}&project=${projectId}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      chats = data.chats;
    } else {
      console.error(`[ProjectLayout] Failed to fetch chats. Status: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      console.error("[ProjectLayout] Error response:", errorData);
    }
  } catch (error) {
    console.error("[ProjectLayout] Error fetching chats:", error);
    chats = [];
  }

  return (
    <SidebarProvider>
      <ChatSidebar chats={chats} projectId={projectId} userId={id} />
      <main className="flex-1 mx-auto overflow-auto">{children}</main>
    </SidebarProvider>
  );
}

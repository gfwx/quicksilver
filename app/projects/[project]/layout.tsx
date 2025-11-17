import { headers, cookies } from "next/headers";
import { ChatSidebar } from "@/lib/components/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { project: string };
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
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(
      `${baseUrl}/api/db/chats?user=${id}&project=${projectId}`,
      {
        method: "GET",
      },
    );

    if (response.ok) {
      const data = await response.json();
      chats = data.chats;
    }
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    chats = [];
  }

  return (
    <SidebarProvider>
      <ChatSidebar chats={chats} projectId={projectId} userId={id} />
      <main className="flex-1 mx-auto overflow-auto">{children}</main>
    </SidebarProvider>
  );
}

import { headers } from "next/headers";
import { ChatSidebar } from "@/lib/components/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { project: string };
}>) {
  /**
   * In a realistic scenario, the user object would be
   * fetched from the authentication server via middleware
   * the middleware would then propagate auth state to the app via layout.
   */
  const user = {
    id: process.env.DEMO_USER_ID, // temporrary
  };

  const p = await params;
  const projectId = p.project;

  let chats: { id: string; title: string; createdAt: Date; updatedAt: Date }[] =
    [];
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(`${baseUrl}/api/db/chats?user_id=${user.id}`, {
      method: "GET",
    });

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
      <ChatSidebar chats={chats} projectId={projectId} userId={user.id!} />
      <main className="flex-1 mx-auto overflow-auto">{children}</main>
    </SidebarProvider>
  );
}

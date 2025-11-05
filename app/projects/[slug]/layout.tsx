import type { Metadata } from "next";
import { AuthProvider } from "@/lib/providers/authProvider";
import { headers } from "next/headers";
import { ChatSidebar } from "@/lib/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "QuickSilver Chat Demo",
  description: "A chat demo built with Next.js and Tailwind CSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * In a realistic scenario, the user object would be
   * fetched from the authentication server via middleware
   * the middleware would then propagate auth state to the app via layout.
   */
  const user = {
    id: process.env.DEMO_USER_ID,
  };

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
    <AuthProvider user={user}>
      <SidebarProvider>
        <ChatSidebar chats={chats} />
        <main className="flex-1 mx-auto overflow-auto">{children}</main>
      </SidebarProvider>
    </AuthProvider>
  );
}

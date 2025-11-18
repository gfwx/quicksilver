import { ChatProvider } from "@/lib/providers/chatProvider";
import type { UIMessage } from "ai";
import { headers, cookies } from "next/headers";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ chat: string }>;
}) {
  const { chat: chatId } = await params;

  let messages: UIMessage[] = [];

  const cookieStore = await cookies();
  const id = cookieStore.get("x-current-user-id")?.value;

  if (!id) {
    console.log("No user found!");
    return (
      <ChatProvider chatHistory={[]}>
        <div>{children}</div>
      </ChatProvider>
    );
  }

  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(
      `${baseUrl}/api/db/messages?chat=${chatId}&user=${id}`,
      {
        method: "GET",
      },
    );

    if (response.ok) {
      const data = await response.json();
      messages = data.messages;
    }
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    messages = [];
  }

  return (
    <ChatProvider chatHistory={messages}>
      <div>{children}</div>
    </ChatProvider>
  );
}

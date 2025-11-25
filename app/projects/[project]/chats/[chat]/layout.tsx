import { ChatProvider } from "@/lib/providers/chatProvider";
import type { UIMessage } from "ai";
import { cookies } from "next/headers";

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
    const internalApiUrl =
      process.env.INTERNAL_API_URL || "http://localhost:3000";
    const fullUrl = `${internalApiUrl}/api/db/messages`;
    const response = await fetch(`${fullUrl}?chat=${chatId}&user=${id}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      messages = data.messages;
    } else {
      console.error(
        `[ChatLayout] Failed to fetch messages. Status: ${response.status}`,
      );
      const errorData = await response.json().catch(() => ({}));
      console.error("[ChatLayout] Error response:", errorData);
    }
  } catch (error) {
    console.error("[ChatLayout] Error fetching messages:", error);
    messages = [];
  }

  return <ChatProvider chatHistory={messages}>{children}</ChatProvider>;
}

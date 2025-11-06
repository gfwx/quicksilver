import { ChatProvider } from "@/lib/providers/chatProvider";
import { UIMessage } from "ai";
import { headers } from "next/headers";

export default async function RootLayout({
  params,
  children,
}: {
  params: { chat: string };
  children: React.ReactNode;
}) {
  const { chat } = params;
  const user = {
    id: process.env.DEMO_USER_ID,
  };

  let messages: UIMessage[] = [];
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(
      `${baseUrl}/api/db/messages?user_id=${user.id}&chat_id=${chat}`,
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

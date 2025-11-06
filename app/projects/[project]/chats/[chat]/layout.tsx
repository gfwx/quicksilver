import { ChatProvider } from "@/lib/providers/chatProvider";
import { UIMessage } from "ai";
import { headers, cookies } from "next/headers";

export default async function RootLayout({
  params,
  children,
}: {
  params: { chat: string };
  children: React.ReactNode;
}) {
  const { chat: chatId } = await params;

  let messages: UIMessage[] = [];

  const cookieStore = await cookies();
  const userData = cookieStore.get("user-data")?.value;

  if (!userData) {
    console.log("No user found!");
    return (
      <ChatProvider chatHistory={[]}>
        <div>{children}</div>
      </ChatProvider>
    );
  }

  const { id } = JSON.parse(userData);

  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const response = await fetch(
      `${baseUrl}/api/db/messages?chat_id=${chatId}`,
      {
        method: "GET",
        headers: {
          "x-encrypted-user-id": id,
        },
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

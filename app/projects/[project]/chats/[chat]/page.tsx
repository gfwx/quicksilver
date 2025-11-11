"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useMessages } from "@/lib/providers/chatProvider";
import { TextBoxButton } from "@/lib/components/TextboxBtn";
import { ChatBubble } from "@/lib/components/ChatBubble";
import { useAuth } from "@/lib/contexts/AuthContext";
import { DefaultChatTransport } from "ai";

export default function Chat() {
  /**
   * Because the state of the component depends on message size (which changes dynamically),
   * the UI is updated a LOT on load.
   * Results in loading lag despite chats being a client UI.
   * I'm not sure there's a way to fix this.
   */

  const { authState } = useAuth();
  const { user } = authState;
  const params = useParams();

  console.log(`user: ${user?.id}`);

  const chatId = params.chat as string;
  const projectId = params.project as string;

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [previousScrollTop, setPreviousScrollTop] = useState(0);
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => {
        return {
          body: {
            messages,
            project_id: projectId,
          },
        };
      },
    }),
    onFinish: async ({ message: assistantMessage }) => {
      const created_at = new Date();
      await fetch(`/api/db/messages?chat_id=${chatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-encrypted-user-id": user!.id,
        },
        body: JSON.stringify({
          message: assistantMessage,
          user_id: user!.id,
          chat_id: chatId,
          created_at,
          updated_at: created_at,
        }),
      }).catch(console.error);
    },
  });
  const { history } = useMessages();

  const messagesRef = useRef<HTMLDivElement>(null);

  // Message history is passed from the layout component and stored as state here.
  useEffect(() => {
    setMessages(history);
  }, [history, setMessages]);

  // Attach the scroll event listener to a specified element (via useRef)
  useEffect(() => {
    const section = messagesRef.current;
    if (!section) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = section;

      // If the user is actively (even slightly) scrolling down (down gesture, not UI), it must stop automatically scrolling down
      const isScrollingDown = scrollTop >= previousScrollTop;
      setIsAtBottom(
        // scrollTop + clientHeight -> refers to the current scroll position plus the height of the element
        // scrollHeight - 100 -> adds a buffer to prevent the chat from immediately scrolling up when the user scrolls down
        scrollTop + clientHeight >= scrollHeight - 100 && isScrollingDown,
      );

      // Reset the previous scrollTop.
      setPreviousScrollTop(scrollTop);
    };

    section.addEventListener("scroll", handleScroll);
    return () => section.removeEventListener("scroll", handleScroll);
  }, [previousScrollTop]);

  //Whenever messages updates
  // (ie. when the user is typing a message or the AI is generating a response, fire this function)
  useEffect(() => {
    // messagesRef.current ensures that the current ref isn't null (ie. the element exists)
    if (isAtBottom && messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAtBottom]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const created_at = new Date();
    e.preventDefault();
    setError(null);
    const userInput = input;
    try {
      // Prevent sending the message if there's no text. For some reason this just causes the model to freeze up.
      if (userInput.trim() !== "") {
        await sendMessage({ text: userInput });
        const userMessageId = uuidv4();
        const userMessage = {
          id: userMessageId,
          role: "user" as const,
          parts: [{ type: "text" as const, text: userInput }],
        };
        fetch(`/api/db/messages?chat_id=${chatId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-encrypted-user-id": user!.id,
          },
          body: JSON.stringify({
            message: userMessage,
            created_at: created_at,
            updated_at: created_at,
          }),
        }).catch(console.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setInput("");
    }
  };

  const handleStop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await stop();
  };

  console.log(messages);

  return (
    <div className="flex items-center flex-col w-full max-w-4xl pt-4 mx-auto stretch gap-8">
      {/*The main scroll section that contains chats.*/}
      <section
        ref={messagesRef}
        className="messages w-full flex-1 overflow-y-auto flex flex-col gap-8 max-h-full no-scrollbar pb-24"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <ChatBubble message={message} />
          </div>
        ))}

        {/*Shows this part when the AI response is in the loading state*/}
        {status !== "ready" &&
          (!messages.length ||
            messages[messages.length - 1]?.role !== "assistant") && (
            <div className="flex w-full justify-start">
              <div className="text-blue-500">Loading AI Response</div>
            </div>
          )}
      </section>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white overflow-clip flex items-center justify-between fixed bottom-4 w-full max-w-4xl p-4 border border-zinc-300 dark:border-zinc-800 rounded-full shadow-xl"
      >
        <input
          className="max-w-4xl bottom-0 w-full p-2 focus:outline-none"
          value={input}
          placeholder="Say something..."
          disabled={status !== "ready"}
          onChange={(e) => setInput(e.currentTarget.value)}
        />

        <TextBoxButton
          status={status}
          active_handler={handleSubmit}
          disabled_handler={handleStop}
        />
      </form>
    </div>
  );
}

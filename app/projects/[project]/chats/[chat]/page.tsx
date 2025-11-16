"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useMessages } from "@/lib/providers/chatProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { DefaultChatTransport } from "ai";
import { MessagesSection, ChatInputForm } from "@/lib/components/chat";

export default function Chat() {
  const { authState } = useAuth();
  const { user } = authState;
  const params = useParams();

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
        },
        body: JSON.stringify({
          message: assistantMessage,
          userId: user?.id ?? "",
          chatId,
          created_at,
          updated_at: created_at,
        }),
      }).catch(console.error);
    },
  });
  const { history } = useMessages();

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(history);
  }, [history, setMessages]);

  useEffect(() => {
    const section = messagesRef.current;
    if (!section) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = section;

      const isScrollingDown = scrollTop >= previousScrollTop;
      setIsAtBottom(
        scrollTop + clientHeight >= scrollHeight - 100 && isScrollingDown,
      );

      setPreviousScrollTop(scrollTop);
    };

    section.addEventListener("scroll", handleScroll);
    return () => section.removeEventListener("scroll", handleScroll);
  }, [previousScrollTop]);

  useEffect(() => {
    if (isAtBottom && messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isAtBottom]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const userInput = input;
    try {
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
          },
          body: JSON.stringify({
            message: userMessage,
            userId: user?.id ?? "",
            chatId,
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
      <MessagesSection ref={messagesRef} messages={messages} status={status} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ChatInputForm
        input={input}
        setInput={setInput}
        status={status}
        handleSubmit={handleSubmit}
        handleStop={handleStop}
      />
    </div>
  );
}

"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useMessages } from "@/lib/providers/chatProvider";
import { useProfile } from "@/lib/hooks/useProfile";
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import { DefaultChatTransport } from "ai";
import { MessagesSection, ChatInputForm } from "@/lib/components/chat";
import ModelSelector from "@/lib/components/chat/ModelSelector";

export default function Chat() {
  const { currentProfile, hasHydrated: profileHydrated } = useProfile();
  const { selectedModel, hasHydrated: modelHydrated } = useModelSelection();
  const params = useParams();

  const chatId = params.chat as string;
  const projectId = params.project as string;

  // Use a ref to always get the latest selectedModel value
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
    if (modelHydrated && selectedModel) {
      console.log(`Chat ready with model: ${selectedModel}`);
    } else if (modelHydrated && !selectedModel) {
      console.warn("Model hydrated but no model selected!");
    }
  }, [modelHydrated, selectedModel]);

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [previousScrollTop, setPreviousScrollTop] = useState(0);
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => {
        // Use ref to get the current model value at the time of sending
        const currentModel = selectedModelRef.current;
        console.log(
          `[prepareSendMessagesRequest] Sending with model: ${currentModel}`,
        );
        return {
          body: {
            messages,
            project_id: projectId,
            model: currentModel,
          },
        };
      },
    }),
    onFinish: async ({ message: assistantMessage }) => {
      try {
        const response = await fetch(`/api/db/messages?chat_id=${chatId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: assistantMessage,
            userId: currentProfile?.id ?? "",
            chatId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            `[onFinish] Failed to save assistant message to DB. Status: ${response.status}`,
            errorData,
          );
        }
      } catch (error) {
        console.error("[onFinish] Error saving assistant message:", error);
      }
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
        sendMessage({ text: userInput });
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
            userId: currentProfile?.id ?? "",
            chatId,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              return response
                .json()
                .catch(() => ({}))
                .then((errorData) => {
                  console.error(
                    `[handleSubmit] Failed to save user message to DB. Status: ${response.status}`,
                    errorData,
                  );
                });
            }
          })
          .catch((error) => {
            console.error("[handleSubmit] Error saving user message:", error);
          });
      }
    } catch (err) {
      console.error("[handleSubmit] Error during message submission:", err);
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

  if (modelHydrated && profileHydrated)
    return (
      <div className="flex items-center flex-col h-full w-full max-w-4xl pt-4 mx-auto stretch gap-8">
        <MessagesSection
          ref={messagesRef}
          messages={messages}
          status={status}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="flex w-full flex-col fixed bottom-4 items-center">
          <div className="w-full max-w-4xl items-start flex">
            <ModelSelector />
          </div>
          <ChatInputForm
            input={input}
            setInput={setInput}
            status={status}
            handleSubmit={handleSubmit}
            handleStop={handleStop}
          />
        </div>
      </div>
    );
}

"use client";
// Used for providing message / chat history from the server (layout) to the page.

import { createContext, useContext, useState } from "react";
import { UIMessage } from "ai";

type ChatContext = {
  history: UIMessage[];
  setHistory: (messages: UIMessage[]) => void;
};

const ChatContext = createContext<ChatContext>({
  history: [],
  setHistory: () => {},
});

const ChatProvider = ({
  children,
  chatHistory,
}: {
  children: React.ReactNode;
  chatHistory: UIMessage[];
}) => {
  const [history, setHistory] = useState(chatHistory);

  return (
    <ChatContext.Provider value={{ history, setHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

const useMessages = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error(
      "useContext(ChatContext) should only be used within a ChatProvider!",
    );
  }
  return ctx;
};

export { ChatProvider, useMessages };

import React from "react";
import { UIMessage } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ChatBubbleProps {
  message: UIMessage;
}

/**
 * ChatBubble that displays a message dynamically, based on the message role.
 * If it's a user message, it returns the message wrapped in a message bubble
 * Otherwise, it returns the message wrapped in a markdown-enabled wrapper powered by react-markdown aand remark.
 *
 * @param Object: ChatBubbleProps
 * @returns React.FC<ChatBubbleProps>
 */

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const content = message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("\n\n");

  if (message.role === "assistant") {
    return (
      <div className="w-full text-left">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            code: ({ children, className, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <code
                  className={`${className} bg-gray-800 rounded px-1 py-0.5 font-mono`}
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="bg-gray-800 rounded px-1 py-0.5 text-white font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="bg-slate-400 text-white p-3 rounded-lg max-w-[70%] whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  return null;
};

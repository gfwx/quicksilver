import { forwardRef } from "react";
import { ChatBubble } from "@/lib/components/ChatBubble";
import type { UIMessage } from "@ai-sdk/react";
import type { ChatStatus } from "ai";

interface MessagesSectionProps {
  messages: UIMessage[];
  status: ChatStatus;
}

const MessagesSection = forwardRef<HTMLDivElement, MessagesSectionProps>(
  ({ messages, status }, ref) => {
    return (
      <section
        ref={ref}
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

        {status !== "ready" &&
          (!messages.length ||
            messages[messages.length - 1]?.role !== "assistant") && (
            <div className="flex w-full justify-start">
              <div className="text-blue-500">Loading AI Response</div>
            </div>
          )}
      </section>
    );
  },
);

MessagesSection.displayName = "MessagesSection";

export default MessagesSection;

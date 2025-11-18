import { TextBoxButton } from "@/lib/components/TextboxBtn";
import { ChatStatus } from "ai";

interface ChatInputFormProps {
  input: string;
  setInput: (value: string) => void;
  status: ChatStatus;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleStop: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ChatInputForm({
  input,
  setInput,
  status,
  handleSubmit,
  handleStop,
}: ChatInputFormProps) {
  return (
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
  );
}

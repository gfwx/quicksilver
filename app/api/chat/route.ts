import { createOllama } from "ollama-ai-provider-v2";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const ollama = createOllama({
    baseURL: "http://127.0.0.1:11434/api",
  });

  // this is hard-coded. needs to be fixed later.
  const model = "gemma3:4b-it-qat";
  const result = streamText({
    model: ollama(model),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

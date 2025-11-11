import { createOllama } from "ollama-ai-provider-v2";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000";

async function fetchVectorEmbeddings(
  query: string,
  projectId: string,
): Promise<string[]> {
  try {
    const response = await fetch(
      `${FASTAPI_BACKEND_URL}/api/vector?query=${query}&project_id=${projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log(response);

    if (!response.ok) {
      const { error } = await response.json();
      console.error(
        `[${response.status}] Failed to fetch embeddings: ${error}`,
      );
      return [];
    }

    const data = await response.json();
    return data.text || [];
  } catch (error) {
    console.error("Error fetching vector embeddings:", error);
    return [];
  }
}

export async function POST(req: Request) {
  const {
    messages,
    project_id,
  }: { messages: UIMessage[]; project_id?: string } = await req.json();

  function getMessageText(msg: UIMessage): string {
    if (!msg.parts) return "";
    return msg.parts.reduce((acc: string, part: any) => {
      if (part.type === "text") {
        return acc + part.text;
      }
      return acc;
    }, "");
  }

  const lastMessage = messages[messages.length - 1];
  const lastMessageText = getMessageText(lastMessage);

  console.log(`Project ID: ${project_id} | Message: ${lastMessageText}`);

  // Fetch relevant context from vector store if we have both message and project_id
  const contextMessages: UIMessage[] = [];
  if (lastMessageText && project_id) {
    const topHits = await fetchVectorEmbeddings(lastMessageText, project_id);

    if (topHits.length > 0) {
      // Add context as a system message with parts for each hit
      contextMessages.push({
        id: `context-${Date.now()}`,
        role: "system",
        parts: topHits.map((hit) => ({
          type: "text" as const,
          text: hit,
        })),
      });
    }
  }

  const ollama = createOllama({
    baseURL: "http://127.0.0.1:11434/api",
  });

  // this is hard-coded. needs to be fixed later.
  const model = "gemma3:4b-it-qat";
  const result = streamText({
    model: ollama(model),
    messages: convertToModelMessages([...contextMessages, ...messages]),
  });

  return result.toUIMessageStreamResponse();
}

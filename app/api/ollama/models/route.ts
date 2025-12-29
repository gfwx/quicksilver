import { OLLAMA_ENDPOINT } from "@/lib/config/api";
import { NextResponse } from "next/server";

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
}

const env = process.env.NODE_ENV;
const ollamaEndpoint =
  env === "production" ? OLLAMA_ENDPOINT : "http://localhost:11434";

export async function GET() {
  try {
    const response = await fetch(`${ollamaEndpoint}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch Ollama models. Status: ${response.status}`,
      );
      return NextResponse.json(
        {
          error: "Failed to fetch models from Ollama",
          models: [],
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const models = data.models || [];

    return NextResponse.json({
      models: models.map((model: OllamaModel) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        digest: model.digest,
      })),
    });
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to Ollama service",
        models: [],
      },
      { status: 500 },
    );
  }
}

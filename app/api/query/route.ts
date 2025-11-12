// app/api/query/route.ts
// Edge-compatible vector search endpoint
export const runtime = "edge";

const FASTAPI_ENDPOINT =
  process.env.FASTAPI_ENDPOINT || "http://127.0.0.1:8000";

/**
 * Vector search query endpoint
 * Note: Changed from GET to POST since the original was using body with GET (non-standard)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, project_id } = body;

    if (!query) {
      return Response.json(
        { error: "Missing / empty query" },
        { status: 400 }
      );
    }

    if (!project_id) {
      return Response.json(
        { error: "Missing / empty project id." },
        { status: 400 }
      );
    }

    const aiResponse = await fetch(`${FASTAPI_ENDPOINT}/api/vector`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query as string,
        project_id: project_id as string,
      }),
    });

    let topHits: string[] = [];
    if (!aiResponse.ok) {
      console.error(
        `Vector search failed with status ${aiResponse.status}:`,
        await aiResponse.text()
      );
    } else {
      const data = await aiResponse.json();
      console.log(data);
      topHits = data.text || [];
    }

    return Response.json({ topHits }, { status: 200 });
  } catch (e) {
    console.error("Query endpoint error:", e);
    return Response.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

/**
 * Also support GET with query parameters for proper REST semantics
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const project_id = searchParams.get("project_id");

    if (!query) {
      return Response.json(
        { error: "Missing / empty query" },
        { status: 400 }
      );
    }

    if (!project_id) {
      return Response.json(
        { error: "Missing / empty project id." },
        { status: 400 }
      );
    }

    const aiResponse = await fetch(
      `${FASTAPI_ENDPOINT}/api/vector?query=${encodeURIComponent(query)}&project_id=${encodeURIComponent(project_id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let topHits: string[] = [];
    if (!aiResponse.ok) {
      console.error(
        `Vector search failed with status ${aiResponse.status}:`,
        await aiResponse.text()
      );
    } else {
      const data = await aiResponse.json();
      console.log(data);
      topHits = data.text || [];
    }

    return Response.json({ topHits }, { status: 200 });
  } catch (e) {
    console.error("Query endpoint error:", e);
    return Response.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
